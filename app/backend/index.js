import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' })); // large limit for base64 signature

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Production: Serve Frontend ──────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  console.log(`📦 Production mode: Serving static files from ${distPath}`);
  
  app.use(express.static(distPath));
  
  // Handle SPA routing: serve index.html for all non-api routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next(); // Fall through to 404 if it's a missing API route
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── Connect to MongoDB & Start Server ──────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Server startup failed:');
    console.error(err);
    process.exit(1);
  });
