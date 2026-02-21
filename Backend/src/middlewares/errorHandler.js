const { AppError } = require('../utils/AppError');

/**
 * Centralized error-handling middleware.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let error = { ...err, message: err.message, stack: err.stack };

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = { message: `Invalid ${err.path}: ${err.value}`, statusCode: 400 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    error = { message: `Duplicate value for field: ${field}`, statusCode: 409 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = { message: messages.join('. '), statusCode: 422, errors: messages };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Invalid token', statusCode: 401 };
  }
  if (err.name === 'TokenExpiredError') {
    error = { message: 'Token expired', statusCode: 401 };
  }

  const statusCode = error.statusCode || err.statusCode || 500;
  const isOperational = err instanceof AppError;

  const response = {
    success: false,
    message: error.message || 'Internal Server Error',
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  if (process.env.NODE_ENV === 'development' && !isOperational) {
    response.stack = error.stack;
  }

  if (statusCode === 500 && !isOperational) {
    console.error('UNHANDLED ERROR:', err);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
