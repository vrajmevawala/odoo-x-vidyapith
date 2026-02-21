const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/constants');
const { UnauthorizedError, ForbiddenError } = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verify JWT and attach user to request.
 */
const authenticateUser = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new UnauthorizedError('Authentication required. Please provide a valid token.');
  }

  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new UnauthorizedError('User belonging to this token no longer exists.');
  }

  req.user = user;
  next();
});

/**
 * Restrict access to specific roles.
 * @param  {...string} roles - Allowed roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Role '${req.user.role}' is not authorized to access this resource.`
      );
    }
    next();
  };
};

module.exports = { authenticateUser, authorizeRoles };
