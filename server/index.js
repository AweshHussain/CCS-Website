import 'dotenv/config';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { connectDB, db } from './db.js';
import { activeHeartbeats } from './routes/teamRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
const PORT = process.env.PORT || 5000;

// Create HTTP Server & attach Socket.io
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Pass io to Express app instance so REST routes can broadcast events
app.set('io', io);

// Socket.io Real-time Collaboration Engine
io.on('connection', (socket) => {
  // 1. User Online Heartbeat Registration
  socket.on('user_connected', ({ userId, groupId, fullName }) => {
    if (!userId) return;
    socket.userId = userId;
    socket.groupId = groupId;
    activeHeartbeats.set(userId, Date.now());

    // Join personal private room for direct 1-on-1 messages
    socket.join(`user_${userId}`);

    // Join team group room if student belongs to a group
    if (groupId) {
      socket.join(`group_${groupId}`);
      io.to(`group_${groupId}`).emit('teammate_presence', {
        userId,
        status: 'online',
        lastSeen: Date.now(),
      });
    }

    io.emit('presence_update', { userId, status: 'online' });
  });

  // 2. Dynamic Room Switcher
  socket.on('join_group_room', (groupId) => {
    if (groupId) {
      socket.join(`group_${groupId}`);
    }
  });

  // 3. User Typing Indicator
  socket.on('typing_start', ({ groupId, recipientId, userName }) => {
    if (groupId) {
      socket.to(`group_${groupId}`).emit('teammate_typing', { userName, groupId });
    } else if (recipientId) {
      socket.to(`user_${recipientId}`).emit('direct_typing', { userName, senderId: socket.userId });
    }
  });

  socket.on('typing_stop', ({ groupId, recipientId }) => {
    if (groupId) {
      socket.to(`group_${groupId}`).emit('teammate_stopped_typing');
    } else if (recipientId) {
      socket.to(`user_${recipientId}`).emit('direct_stopped_typing', { senderId: socket.userId });
    }
  });

  // 4. Disconnect Handler
  socket.on('disconnect', () => {
    if (socket.userId) {
      activeHeartbeats.delete(socket.userId);
      if (socket.groupId) {
        io.to(`group_${socket.groupId}`).emit('teammate_presence', {
          userId: socket.userId,
          status: 'offline',
          lastSeen: Date.now(),
        });
      }
      io.emit('presence_update', { userId: socket.userId, status: 'offline' });
    }
  });
});

// Initialize Database connection then start HTTP server
async function startServer() {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 CCS Society Backend Engine running on port ${PORT}`);
    console.log(`⚡ WebSocket / Socket.io Real-Time Engine Active`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`💾 Active Database: ${db.isCloudConnected() ? 'MongoDB Atlas (CCS-Cluster)' : 'Local JSON'}`);
    console.log(`📁 Avatars Storage: ${path.join(uploadsDir, 'avatars')}`);
    console.log(`===============================================`);
  });
}

startServer();
