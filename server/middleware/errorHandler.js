const AppError = require('../utils/AppError');

/**
 * Map known error types (Mongoose, JWT, etc.) to AppError instances
 */
const mapError = (err) => {
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return new AppError('Resource not found', 404, 'INVALID_ID');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return new AppError(`${field} already exists`, 400, 'DUPLICATE_KEY');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    return new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Default fallback
  return new AppError(err.message || 'Server Error', err.statusCode || 500);
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  const error = mapError(err);

  // Log error with timestamp
  console.error(`[${new Date().toISOString()}] ERROR:`, {
    message: error.message,
    statusCode: error.statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    code: error.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;