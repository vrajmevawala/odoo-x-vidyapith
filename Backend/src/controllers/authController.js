const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const { BadRequestError, UnauthorizedError } = require('../utils/AppError');
const { JWT_SECRET, JWT_EXPIRE, BCRYPT_SALT_ROUNDS } = require('../config/constants');

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email: email?.toLowerCase() } });
  if (existing) throw new BadRequestError('Email already registered');

  const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), password: hashed, role },
  });

  const token = generateToken(user);

  sendResponse(res, 201, {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  }, 'User registered successfully');
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new BadRequestError('Please provide email and password');

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new UnauthorizedError('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new UnauthorizedError('Invalid credentials');

  const token = generateToken(user);

  sendResponse(res, 200, {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  }, 'Login successful');
});

const getMe = asyncHandler(async (req, res) => {
  sendResponse(res, 200, {
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

module.exports = { register, login, getMe };
