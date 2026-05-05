const express = require('express');
const router = express.Router();
const { searchUsers, getProfile } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/search', auth, searchUsers);
router.get('/:userId', auth, getProfile);

module.exports = router;
