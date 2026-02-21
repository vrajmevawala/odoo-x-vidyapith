const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { authenticateUser } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateUser, getMe);

module.exports = router;
