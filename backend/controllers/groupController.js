const Group = require('../models/Group');
const Message = require('../models/Message');

exports.createGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const adminId = req.user._id;

    const members = [...new Set([adminId.toString(), ...(memberIds || [])])];

    const group = await Group.create({
      name,
      description,
      admin: adminId,
      members
    });

    await group.populate('members', 'username displayName avatarColor avatar');
    res.status(201).json({ group });
  } catch (err) {
    res.status(500).json({ message: 'Error creating group' });
  }
};

exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user._id,
      isActive: true
    }).populate('members', 'username displayName avatarColor avatar status')
      .populate('admin', 'username displayName');

    res.json({ groups });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching groups' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    res.json({ message: 'Member added', group });
  } catch (err) {
    res.status(500).json({ message: 'Error adding member' });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.members = group.members.filter(m => m.toString() !== userId.toString());
    if (group.members.length === 0) group.isActive = false;
    await group.save();
    res.json({ message: 'Left group' });
  } catch (err) {
    res.status(500).json({ message: 'Error leaving group' });
  }
};
