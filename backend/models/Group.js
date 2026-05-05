const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  description: { type: String, maxlength: 200, default: '' },
  avatar: { type: String, default: null },
  avatarColor: { type: String, default: '#00F5FF' },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  conversationId: { type: String, unique: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

groupSchema.pre('save', function (next) {
  if (this.isNew) {
    this.conversationId = `group_${this._id}`;
    const colors = ['#00F5FF', '#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF', '#06D6A0'];
    this.avatarColor = colors[Math.floor(Math.random() * colors.length)];
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);
