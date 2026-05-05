const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  type: {
    type: String,
    enum: ['text', 'meme', 'image', 'sticker', 'reaction'],
    default: 'text'
  },
  content: { type: String, default: '' },
  memeUrl: { type: String, default: null },
  memeId: { type: String, default: null },
  memeName: { type: String, default: null },
  imageUrl: { type: String, default: null },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String
  }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Generate conversation ID from two user IDs (sorted for consistency)
messageSchema.statics.getConversationId = function (userId1, userId2) {
  return [userId1.toString(), userId2.toString()].sort().join('_');
};

module.exports = mongoose.model('Message', messageSchema);
