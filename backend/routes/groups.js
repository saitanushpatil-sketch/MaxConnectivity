const express = require('express');
const router = express.Router();
const { createGroup, getMyGroups, addMember, leaveGroup } = require('../controllers/groupController');
const auth = require('../middleware/auth');

router.post('/', auth, createGroup);
router.get('/', auth, getMyGroups);
router.post('/member', auth, addMember);
router.delete('/:groupId/leave', auth, leaveGroup);

module.exports = router;
