const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');
const db = require('../db');

function setupWebsocket(httpServer, corsOrigin) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('unauthorized'));
      const payload = verifyToken(token);
      const user = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(payload.sub);
      if (!user) return next(new Error('unauthorized'));
      socket.user = user;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on('conversation:join', (conversationId) => {
      const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
      if (conv && (conv.client_id === socket.user.id || conv.provider_id === socket.user.id)) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('conversation:typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('conversation:typing', {
        conversationId, userId: socket.user.id, isTyping: !!isTyping,
      });
    });
  });

  return io;
}

module.exports = { setupWebsocket };
