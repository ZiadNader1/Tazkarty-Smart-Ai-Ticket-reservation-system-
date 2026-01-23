import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

// User socket mapping: { userId: socketId }
const userSockets = new Map();

/**
 * Initialize Socket.IO
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      console.error('Socket Auth Error:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection Handler
  io.on('connection', (socket) => {
    const userId = socket.userId;


    // Store user's socket
    userSockets.set(userId.toString(), socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle disconnection
    socket.on('disconnect', () => {

      userSockets.delete(userId.toString());
    });

    // Custom events
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });


  return io;
};

/**
 * Send notification to specific user
 */
export const sendNotificationToUser = (userId, notification) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return false;
  }

  const userIdStr = userId.toString();

  // Emit to user's room
  io.to(`user:${userIdStr}`).emit('notification', {
    ...notification,
    timestamp: new Date(),
    read: false
  });


  return true;
};

/**
 * Send payment status update
 */
export const sendPaymentUpdate = (userId, paymentData) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return false;
  }

  io.to(`user:${userId.toString()}`).emit('payment:update', paymentData);
  return true;
};

/**
 * Send ticket update
 */
export const sendTicketUpdate = (userId, ticketData) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return false;
  }

  io.to(`user:${userId.toString()}`).emit('ticket:update', ticketData);
  return true;
};

/**
 * Broadcast to all users
 */
export const broadcastNotification = (notification) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return false;
  }

  io.emit('notification:broadcast', notification);
  return true;
};

/**
 * Get online users count
 */
export const getOnlineUsersCount = () => {
  return userSockets.size;
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId) => {
  return userSockets.has(userId.toString());
};

export { io };