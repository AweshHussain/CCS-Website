import 'dotenv/config';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app.js';
import { connectDB, db } from './db.js';
import { activeHeartbeats } from './routes/teamRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ccs_jwt_super_secret_key_2026_production';

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

// Socket.io JWT Authentication Middleware
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    (socket.handshake.headers?.authorization?.startsWith('Bearer ')
      ? socket.handshake.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    return next(new Error('Authentication required: Missing JWT in WebSocket handshake'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Authentication failed: Invalid or expired WebSocket token'));
  }
});

// Socket.io Real-time Collaboration Engine
io.on('connection', (socket) => {
  // 1. User Online Heartbeat Registration (strictly bound to authenticated socket.user.id)
  socket.on('user_connected', async ({ groupId }) => {
    const userId = socket.user.id;
    socket.userId = userId;
    activeHeartbeats.set(userId, Date.now());

    // Join strictly the authenticated user's personal private room
    socket.join(`user_${userId}`);

    // If groupId is provided, verify against database to prevent cross-group eavesdropping
    if (groupId) {
      try {
        const user = await db.findUserById(userId);
        if (socket.user.role === 'coordinator' || (user && user.groupId === groupId)) {
          socket.groupId = groupId;
          socket.join(`group_${groupId}`);
          io.to(`group_${groupId}`).emit('teammate_presence', {
            userId,
            status: 'online',
            lastSeen: Date.now(),
          });
        }
      } catch (err) {
        console.warn('Socket user_connected validation error:', err.message);
      }
    }

    io.emit('presence_update', { userId, status: 'online' });
  });

  // 2. Dynamic Room Switcher with Authorization Check
  socket.on('join_group_room', async (groupId) => {
    if (!groupId) return;
    try {
      const user = await db.findUserById(socket.user.id);
      if (socket.user.role === 'coordinator' || (user && user.groupId === groupId)) {
        socket.groupId = groupId;
        socket.join(`group_${groupId}`);
      }
    } catch (err) {
      console.warn('Socket join_group_room error:', err.message);
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
