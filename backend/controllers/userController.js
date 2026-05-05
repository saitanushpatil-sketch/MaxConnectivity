const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user._id;

    if (!q || q.length < 2) return res.json({ users: [] });

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } }
      ]
    }).select('username displayName avatarColor avatar email bio status').limit(10);

    // Add friend status to each user
    const userIds = users.map(u => u._id);
    const requests = await FriendRequest.find({
      $or: [
        { sender: currentUserId, receiver: { $in: userIds } },
        { sender: { $in: userIds }, receiver: currentUserId }
      ]
    });

    const usersWithStatus = users.map(user => {
      const request = requests.find(r =>
        r.sender.toString() === user._id.toString() ||
        r.receiver.toString() === user._id.toString()
      );
      return {
        ...user.toObject(),
        friendStatus: request ? request.status : 'none',
        requestId: request ? request._id : null,
        isRequestSender: request ? request.sender.toString() === currentUserId.toString() : false
      };
    });

    res.json({ users: usersWithStatus });
  } catch (err) {
    res.status(500).json({ message: 'Error searching users' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -socketId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};
