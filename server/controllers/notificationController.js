const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { unreadOnly } = req.query;

    const query = { receiverId: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('rideId', 'from to date time')
      .sort({ timestamp: -1 })
      .limit(100);

    // Transform notifications to ensure rideId is always a string
    const transformedNotifications = notifications.map(notif => {
      const notifObj = notif.toObject ? notif.toObject() : notif;
      return {
        ...notifObj,
        rideId: notifObj.rideId?._id ? notifObj.rideId._id.toString() : (notifObj.rideId?.toString() || notifObj.rideId || null),
        receiverId: notifObj.receiverId?.toString() || notifObj.receiverId,
        _id: notifObj._id?.toString() || notifObj._id,
      };
    });

    res.json({
      success: true,
      notifications: transformedNotifications,
      unreadCount: await Notification.countDocuments({ receiverId: userId, isRead: false }),
    });
  } catch (error) {
    console.error('[Notification] GetNotifications error:', error);
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      receiverId: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('[Notification] MarkAsRead error:', error);
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { receiverId: userId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('[Notification] MarkAllAsRead error:', error);
    next(error);
  }
};

// Helper function to create a notification
const createNotification = async (receiverId, type, message, rideId = null, requestId = null) => {
  try {
    const notification = await Notification.create({
      receiverId,
      type,
      message,
      rideId,
      requestId,
    });
    return notification;
  } catch (error) {
    console.error('[Notification] CreateNotification error:', error);
    throw error;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
};

