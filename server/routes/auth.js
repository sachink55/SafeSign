import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import User from '../models/User.js';

// Configure cloudinary (though we pass secrets directly to sign request, it's good practice)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const router = express.Router();

// ─── CLOUDINARY SIGNATURE ────────────────────────────────────
router.get('/cloudinary-signature', (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  } catch (err) {
    console.error('Cloudinary signature error:', err);
    res.status(500).json({ message: 'Failed to generate upload signature' });
  }
});

// ─── REGISTER ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, signature, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate dummy bank details
    const bankDetails = {
      accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
      balance: Math.floor(Math.random() * 5000) + 500, // Random between 500 and 5500
      accountType: 'Savings'
    };

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      signature,
      role: role || 'user',
      bankDetails: role === 'admin' ? {} : bankDetails,
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        signature: user.signature,
        role: user.role,
        bankDetails: user.bankDetails
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        signature: user.signature,
        role: user.role,
        bankDetails: user.bankDetails
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── GET CURRENT USER (protected) ───────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        signature: user.signature,
        role: user.role,
        bankDetails: user.bankDetails
      } 
    });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

export default router;
