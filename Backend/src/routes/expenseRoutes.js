const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  getExpensesByVehicle,
} = require('../controllers/expenseController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateUser);

router
  .route('/')
  .get(getExpenses)
  .post(authorizeRoles(ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST), createExpense);

router.get('/vehicle/:vehicleId', getExpensesByVehicle);

module.exports = router;
