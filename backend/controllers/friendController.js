const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

exports.sendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ message: "Can't friend yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: 'User not found' });

    const existing = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (existing) {
      if (existing.status === 'accepted') return res.status(400).json({ message: 'Already friends' });
      if (existing.status === 'pending') return res.status(400).json({ message: 'Request already pending' });
      // rejected - allow re-send
      existing.sender = senderId;
      existing.receiver = receiverId;
      existing.status = 'pending';
      existing.updatedAt = new Date();
      await existing.save();
      return res.json({ message: 'Friend request sent!', request: existing });
    }

    const request = await FriendRequest.create({ sender: senderId, receiver: receiverId });
    await request.populate('sender receiver', 'username displayName avatarColor avatar');
    
    res.status(201).json({ message: 'Friend request sent!', request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending request' });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body; // action: 'accept' | 'reject'
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = action === 'accept' ? 'accepted' : 'rejected';
    request.updatedAt = new Date();
    await request.save();

    res.json({ message: `Request ${request.status}`, request });
  } catch (err) {
    res.status(500).json({ message: 'Error responding to request' });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const accepted = await FriendRequest.find({
      status: 'accepted',
      $or: [{ sender: userId }, { receiver: userId }]
    }).populate('sender receiver', 'username displayName avatarColor avatar status lastSeen bio');

    const friends = accepted.map(req => {
      const friend = req.sender._id.toString() === userId.toString() ? req.receiver : req.sender;
      return friend;
    });

    res.json({ friends });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching friends' });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const incoming = await FriendRequest.find({ receiver: userId, status: 'pending' })
      .populate('sender', 'username displayName avatarColor avatar');

    const outgoing = await FriendRequest.find({ sender: userId, status: 'pending' })
      .populate('receiver', 'username displayName avatarColor avatar');

    res.json({ incoming, outgoing });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching requests' });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    await FriendRequest.findOneAndDelete({
      status: 'accepted',
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ]
    });

    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing friend' });
  }
};
