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
      origin: ["http://localhost:4200", "http://localhost:3000", process.env.FRONTEND_URL].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication Middleware (Optional for connections)
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
      }
      next();
    } catch (error) {
      console.warn('Socket Auth Warning (Continuing as guest):', error.message);
      // We still call next() because we want to allow guests to connect
      next();
    }
  });

  // Connection Handler
  io.on('connection', (socket) => {
    const userId = socket.userId;

    if (userId) {
      // Store user's socket
      userSockets.set(userId.toString(), socket.id);
      // Join user's personal room
      socket.join(`user:${userId}`);
    } else {
      // Join anonymous room if needed
      socket.join('anonymous');
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      if (userId) {
        userSockets.delete(userId.toString());
      }
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