const express = require('express');
const router = express.Router();
const {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  updateDriverStatus,
  getDriverPerformance,
} = require('../controllers/driverController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateUser);

router
  .route('/')
  .get(getDrivers)
  .post(authorizeRoles(ROLES.FLEET_MANAGER), createDriver);

router
  .route('/:id')
  .get(getDriver)
  .put(authorizeRoles(ROLES.FLEET_MANAGER), updateDriver);

router.patch(
  '/:id/status',
  authorizeRoles(ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER),
  updateDriverStatus
);

router.get('/:id/performance', getDriverPerformance);

module.exports = router;
