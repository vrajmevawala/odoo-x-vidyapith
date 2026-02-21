const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { JWT_SECRET } = require('../config/constants');
const { UnauthorizedError, ForbiddenError } = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const authenticateUser = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new UnauthorizedError('Authentication required. Please provide a valid token.');
  }

  const decoded = jwt.verify(token, JWT_SECRET);

  // Reject stale MongoDB ObjectId tokens (24 hex chars) – UUIDs are 36 chars
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!decoded.id || !uuidRegex.test(decoded.id)) {
    throw new UnauthorizedError('Invalid token (legacy format). Please log in again.');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });

  if (!user) {
    throw new UnauthorizedError('User belonging to this token no longer exists.');
  }

  // Never expose password
  const { password: _, ...safeUser } = user;
  req.user = safeUser;
  next();
});

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
