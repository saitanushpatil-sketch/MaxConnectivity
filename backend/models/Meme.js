const mongoose = require('mongoose');

const memeSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  tags: [String],
  keywords: [String],
  category: {
    type: String,
    enum: ['reaction', 'greeting', 'emotion', 'humor', 'relatable', 'savage', 'wholesome', 'college', 'gaming', 'work'],
    default: 'reaction'
  },
  usageCount: { type: Number, default: 0 },
  trending: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

memeSchema.index({ keywords: 'text', tags: 'text', name: 'text' });

module.exports = mongoose.model('Meme', memeSchema);
