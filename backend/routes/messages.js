const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, reactToMessage, deleteMessage, markRead } = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.get('/:conversationId', auth, getMessages);
router.post('/', auth, sendMessage);
router.post('/:messageId/react', auth, reactToMessage);
router.delete('/:messageId', auth, deleteMessage);
router.put('/:conversationId/read', auth, markRead);

module.exports = router;
