import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import coordinatorRoutes from './routes/coordinatorRoutes.js';
import { connectDB, db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded profile images statically
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coordinator', coordinatorRoutes);

// Public Announcement Endpoint for Public Website Marquee
app.get('/api/announcement', async (req, res) => {
  try {
    const settings = await db.getSettings();
    return res.status(200).json({
      success: true,
      announcementBanner: settings?.announcementBanner || '',
      isBannerActive: settings?.isBannerActive ?? false,
      submissionSeasonOpen: settings?.submissionSeasonOpen ?? true,
      societyName: settings?.societyName || 'Code & Compute Society (CCS)',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Public Multi-Announcements Endpoint for Floating Icon & Realtime Updates
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await db.getAnnouncements();
    return res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Health check endpoint with database status
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'CCS Society Backend Engine',
    database: db.isCloudConnected() ? 'MongoDB Atlas (CCS-Cluster)' : 'Local JSON Store',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Initialize Database connection then start HTTP server
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 CCS Society Backend Engine running on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`💾 Active Database: ${db.isCloudConnected() ? 'MongoDB Atlas (CCS-Cluster)' : 'Local JSON'}`);
    console.log(`📁 Avatars Storage: ${path.join(uploadsDir, 'avatars')}`);
    console.log(`===============================================`);
  });
}

startServer();
