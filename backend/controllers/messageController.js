const Message = require('../models/Message');
const User = require('../models/User');
const Meme = require('../models/Meme');

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 40 } = req.query;
    const userId = req.user._id;

    const messages = await Message.find({
      conversationId,
      deletedFor: { $ne: userId },
      isDeleted: false
    })
      .populate('sender', 'username displayName avatarColor avatar')
      .populate('replyTo', 'content sender type memeUrl')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({ messages: messages.reverse(), page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, groupId, content, type, memeUrl, memeId, memeName, replyTo } = req.body;
    const senderId = req.user._id;

    const message = await Message.create({
      conversationId,
      sender: senderId,
      receiver: receiverId || null,
      groupId: groupId || null,
      type: type || 'text',
      content: content || '',
      memeUrl: memeUrl || null,
      memeId: memeId || null,
      memeName: memeName || null,
      replyTo: replyTo || null
    });

    // Update meme usage stats
    if (memeId) {
      await Meme.findOneAndUpdate({ id: memeId }, { $inc: { usageCount: 1 } });
      await User.findByIdAndUpdate(senderId, { $inc: { totalMemesSent: 1 } });
    }

    // Update streak
    await updateStreak(senderId);

    await message.populate('sender', 'username displayName avatarColor avatar');
    await message.populate('replyTo', 'content sender type memeUrl');

    res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending message' });
  }
};

exports.reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const existingIdx = message.reactions.findIndex(r => r.userId.toString() === userId.toString());
    if (existingIdx > -1) {
      if (message.reactions[existingIdx].emoji === emoji) {
        message.reactions.splice(existingIdx, 1); // toggle off
      } else {
        message.reactions[existingIdx].emoji = emoji; // change reaction
      }
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();
    res.json({ reactions: message.reactions });
  } catch (err) {
    res.status(500).json({ message: 'Error reacting to message' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteFor } = req.body; // 'me' | 'everyone'
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Not found' });

    if (deleteFor === 'everyone' && message.sender.toString() === userId.toString()) {
      message.isDeleted = true;
      message.content = 'This message was deleted';
    } else {
      message.deletedFor.push(userId);
    }

    await message.save();
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting message' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      { conversationId, readBy: { $ne: userId }, sender: { $ne: userId } },
      { $push: { readBy: userId } }
    );

    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Error marking read' });
  }
};

async function updateStreak(userId) {
  const user = await User.findById(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDay = user.lastActiveDay ? new Date(user.lastActiveDay) : null;

  if (lastDay) {
    const diff = (today - lastDay) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      user.streak += 1;
    } else if (diff > 1) {
      user.streak = 1;
    }
  } else {
    user.streak = 1;
  }

  // Badge system
  const badges = user.badges || [];
  if (user.streak >= 7 && !badges.includes('week_streak')) badges.push('week_streak');
  if (user.streak >= 30 && !badges.includes('month_streak')) badges.push('month_streak');
  if (user.totalMemesSent >= 100 && !badges.includes('meme_lord')) badges.push('meme_lord');

  user.lastActiveDay = today;
  user.badges = badges;
  await user.save();
}
