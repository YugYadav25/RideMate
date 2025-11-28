const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token and attach user to request
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user is a driver
const driverMiddleware = (req, res, next) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({ message: 'Access denied. Driver role required.' });
  }
  next();
};

// Middleware to check if user is a rider
const riderMiddleware = (req, res, next) => {
  if (req.user.role !== 'rider') {
    return res.status(403).json({ message: 'Access denied. Rider role required.' });
  }
  next();
};

module.exports = {
  authMiddleware,
  driverMiddleware,
  riderMiddleware,
};

