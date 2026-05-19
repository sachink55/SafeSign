import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Middleware to verify admin role
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token or unauthorized.' });
  }
};

// ─── GET ALL USERS (Admin only) ─────────────────────────────
router.get('/users', requireAdmin, async (req, res) => {
  try {
    // Return all users who are not admins
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users.' });
  }
});

// ─── UPDATE USER BANK DETAILS (Admin only) ───────────────────
router.put('/users/:id/bank', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { balance, accountType } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.bankDetails.balance = balance;
    user.bankDetails.accountType = accountType;
    await user.save();

    res.json({ message: 'Bank details updated successfully.', user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating bank details.' });
  }
});

// ─── VERIFY CHEQUE SIGNATURE (Admin only) ───────────────────
router.post('/verify-cheque', requireAdmin, async (req, res) => {
  try {
    const { email, chequeImageBase64 } = req.body;
    if (!email || !chequeImageBase64) {
      return res.status(400).json({ message: 'Email and cheque image are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (!user.signature) {
      return res.status(400).json({ message: 'User does not have a registered signature.' });
    }

    // 1. Setup temporary directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'safesign-'));
    const registeredImagePath = path.join(tempDir, 'registered.png');
    const uploadedImagePath = path.join(tempDir, 'uploaded.png');

    // 2. Fetch the registered signature from Cloudinary and save to temp file
    const response = await fetch(user.signature);
    if (!response.ok) throw new Error('Failed to fetch registered signature.');
    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(registeredImagePath, Buffer.from(arrayBuffer));

    // 3. Decode base64 uploaded image and save to temp file
    const base64Data = chequeImageBase64.replace(/^data:image\/\w+;base64,/, '');
    await fs.writeFile(uploadedImagePath, Buffer.from(base64Data, 'base64'));

    // 4. Run the python script
    const scriptPath = path.join(__dirname, '..', 'predict.py');
    const modelPath = path.join(__dirname, '..', '..', '..', 'model', 'signature_triplet_model_1.h5');
    const pythonExe = path.join(__dirname, '..', '..', '..', 'myenv', 'Scripts', 'python.exe');

    execFile(pythonExe, [scriptPath, modelPath, registeredImagePath, uploadedImagePath], async (error, stdout, stderr) => {
      // Clean up files first
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.error('Error cleaning up temp directory:', err);
      }

      if (error) {
        console.error('Python script error:', error, stderr);
        return res.status(500).json({ message: 'Error running signature verification model.' });
      }

      try {
        const lines = stdout.trim().split('\n');
        const jsonOutput = lines[lines.length - 1]; 
        const result = JSON.parse(jsonOutput);

        if (!result.success) {
          return res.status(500).json({ message: 'Model error', details: result.error });
        }

        console.log(`✅ Sending verification response for ${user.email}. Signature: ${user.signature}`);
        res.json({
          message: 'Verification complete',
          prediction: result.prediction,
          distance: result.distance,
          threshold: result.threshold,
          verifiedName: user.name,
          registeredSignature: user.signature
        });

        // Save to admin history
        try {
          await User.findByIdAndUpdate(req.user.id, {
            $push: {
              verificationHistory: {
                $each: [{
                  verifiedEmail: email,
                  verifiedName: user.name,
                  prediction: result.prediction,
                  distance: result.distance,
                  threshold: result.threshold,
                  timestamp: new Date()
                }],
                $slice: -10 // Keep last 10
              }
            }
          });
        } catch (historyErr) {
          console.error('Failed to save verification history:', historyErr);
        }
      } catch (err) {
        console.error('Error parsing python output:', err, stdout);
        res.status(500).json({ message: 'Failed to parse model result.' });
      }
    });

  } catch (err) {
    console.error('Verify cheque error:', err);
    res.status(500).json({ message: 'Server error during verification.' });
  }
});

export default router;
