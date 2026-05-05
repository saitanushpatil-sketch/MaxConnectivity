const express = require('express');
const router = express.Router();
const { sendRequest, respondToRequest, getFriends, getPendingRequests, removeFriend } = require('../controllers/friendController');
const auth = require('../middleware/auth');

router.post('/request', auth, sendRequest);
router.put('/respond', auth, respondToRequest);
router.get('/', auth, getFriends);
router.get('/pending', auth, getPendingRequests);
router.delete('/:friendId', auth, removeFriend);

module.exports = router;
