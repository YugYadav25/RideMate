const express = require('express');
const router = express.Router();

// Import controllers
const { register, login, getMe, updateProfile } = require('../controllers/authController');

// Import middleware
const { authMiddleware } = require('../middleware/authMiddleware');

// Authentication routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;