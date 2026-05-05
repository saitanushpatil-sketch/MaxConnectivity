const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 40
  },
  avatar: {
    type: String,
    default: null
  },
  avatarColor: {
    type: String,
    default: '#00F5FF'
  },
  bio: {
    type: String,
    maxlength: 150,
    default: ''
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String,
    default: null
  },
  // Reaction stats - gamification
  totalMemesSent: { type: Number, default: 0 },
  totalReactionsReceived: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActiveDay: { type: Date, default: null },
  badges: [{ type: String }],

  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  // Assign random avatar color on first save
  if (this.isNew) {
    const colors = ['#00F5FF', '#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF', '#06D6A0'];
    this.avatarColor = colors[Math.floor(Math.random() * colors.length)];
    this.displayName = this.displayName || this.username;
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.socketId;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
