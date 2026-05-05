const express = require('express');
const router = express.Router();
const { searchMemes, getTrending, getCategories } = require('../controllers/memeController');
const auth = require('../middleware/auth');

router.get('/search', auth, searchMemes);
router.get('/trending', auth, getTrending);
router.get('/categories', auth, getCategories);

module.exports = router;
