import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import { connectDB, db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
const PORT = process.env.PORT || 5000;

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
