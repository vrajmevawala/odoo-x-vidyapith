const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getVehicleROI,
  getFuelEfficiency,
} = require('../controllers/analyticsController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateUser);
router.use(authorizeRoles(ROLES.FINANCIAL_ANALYST, ROLES.FLEET_MANAGER));

router.get('/dashboard', getDashboard);
router.get('/vehicle-roi/:vehicleId', getVehicleROI);
router.get('/fuel-efficiency/:vehicleId', getFuelEfficiency);

module.exports = router;
