import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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

export default router;
