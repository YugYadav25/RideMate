const express = require('express');
const router = express.Router();

// Import controllers
const { handleChat } = require('../controllers/chatController');

// Import middleware
const { authMiddleware } = require('../middleware/authMiddleware');

// Chat routes
router.post('/', authMiddleware, handleChat);

module.exports = router;
