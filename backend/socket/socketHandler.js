const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    },
    pingTimeout: 60000
  });

  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id;
    console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

    // Update user status
    await User.findByIdAndUpdate(userId, { status: 'online', socketId: socket.id });
    socket.broadcast.emit('user_status', { userId, status: 'online' });

    // Join personal room
    socket.join(userId.toString());

    // Join conversation rooms
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(conversationId);
    });

    // Send message
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, receiverId, groupId, content, type, memeUrl, memeId, memeName, replyTo } = data;

        const message = await Message.create({
          conversationId,
          sender: userId,
          receiver: receiverId || null,
          groupId: groupId || null,
          type: type || 'text',
          content: content || '',
          memeUrl: memeUrl || null,
          memeId: memeId || null,
          memeName: memeName || null,
          replyTo: replyTo || null
        });

        await message.populate('sender', 'username displayName avatarColor avatar');
        if (replyTo) await message.populate('replyTo', 'content sender type memeUrl');

        // Emit to conversation room
        io.to(conversationId).emit('receive_message', message);

        // If DM, notify receiver's personal room too
        if (receiverId) {
          io.to(receiverId).emit('new_message_notification', {
            conversationId,
            message,
            from: socket.user.username
          });
        }

        // If group, notify all members
        if (groupId) {
          socket.to(conversationId).emit('new_message_notification', {
            conversationId,
            message,
            from: socket.user.username
          });
        }

        if (callback) callback({ success: true, message });
      } catch (err) {
        console.error('Socket send_message error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Typing indicators
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(conversationId).emit('user_typing', {
        userId,
        username: socket.user.username,
        conversationId
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(conversationId).emit('user_stop_typing', {
        userId,
        conversationId
      });
    });

    // Message reactions
    socket.on('react_message', async ({ messageId, emoji, conversationId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingIdx = message.reactions.findIndex(r => r.userId.toString() === userId.toString());
        if (existingIdx > -1) {
          if (message.reactions[existingIdx].emoji === emoji) {
            message.reactions.splice(existingIdx, 1);
          } else {
            message.reactions[existingIdx].emoji = emoji;
          }
        } else {
          message.reactions.push({ userId, emoji });
        }
        await message.save();

        io.to(conversationId).emit('message_reacted', {
          messageId,
          reactions: message.reactions
        });
      } catch (err) {
        console.error('React error:', err);
      }
    });

    // Read receipts
    socket.on('mark_read', async ({ conversationId }) => {
      await Message.updateMany(
        { conversationId, readBy: { $ne: userId }, sender: { $ne: userId } },
        { $push: { readBy: userId } }
      );
      socket.to(conversationId).emit('messages_read', { conversationId, readBy: userId });
    });

    // Online presence ping
    socket.on('ping_presence', () => {
      socket.emit('pong_presence', { timestamp: Date.now() });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.user.username}`);
      await User.findByIdAndUpdate(userId, {
        status: 'offline',
        socketId: null,
        lastSeen: new Date()
      });
      socket.broadcast.emit('user_status', { userId, status: 'offline', lastSeen: new Date() });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
