const express = require('express');
const router = express.Router();

// Import controllers
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

// Import middleware
const { authMiddleware } = require('../middleware/authMiddleware');

// Notification routes
router.route('/')
  .get(authMiddleware, getNotifications);

router.route('/read-all')
  .patch(authMiddleware, markAllAsRead);

router.route('/:id/read')
  .patch(authMiddleware, markAsRead);

module.exports = router;


