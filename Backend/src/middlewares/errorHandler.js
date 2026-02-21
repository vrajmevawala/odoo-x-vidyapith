const { Prisma } = require('@prisma/client');
const { AppError } = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let error = { ...err, message: err.message, stack: err.stack };

  // Prisma – unique constraint violation (P2002)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const fields = err.meta?.target?.join(', ') || 'unknown field';
    error = { message: `Duplicate value for field: ${fields}`, statusCode: 409 };
  }

  // Prisma – record not found (P2025)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    error = { message: err.meta?.cause || 'Record not found', statusCode: 404 };
  }

  // Prisma – foreign key constraint failed (P2003)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
    error = { message: `Related record not found for field: ${err.meta?.field_name || 'unknown'}`, statusCode: 422 };
  }

  // Prisma – validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    error = { message: 'Invalid data provided', statusCode: 422 };
  }

  // Prisma – invalid UUID
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2023') {
    error = { message: `Invalid ID format: ${err.meta?.message || ''}`, statusCode: 400 };
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
