import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export const getTeamSocket = (): Socket | null => {
  if (typeof window === 'undefined') return null;

  if (!socketInstance) {
    // Connect to same origin in production/Vercel or localhost:5000 in dev
    const socketUrl =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : window.location.origin;

    socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ [TeamSocket] Connected to real-time engine:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 [TeamSocket] Disconnected:', reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ [TeamSocket] Connection warning (fallback to polling):', err.message);
    });
  }

  return socketInstance;
};

export const registerSocketUser = (userId: string, groupId: string | null, fullName: string) => {
  const socket = getTeamSocket();
  if (socket && socket.connected) {
    socket.emit('user_connected', { userId, groupId, fullName });
  } else if (socket) {
    socket.once('connect', () => {
      socket.emit('user_connected', { userId, groupId, fullName });
    });
  }
};

export const disconnectTeamSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
