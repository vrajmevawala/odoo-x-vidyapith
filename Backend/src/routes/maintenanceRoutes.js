const express = require('express');
const router = express.Router();
const {
  getMaintenanceLogs,
  createMaintenanceLog,
  completeMaintenanceLog,
} = require('../controllers/maintenanceController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateUser);

router
  .route('/')
  .get(getMaintenanceLogs)
  .post(authorizeRoles(ROLES.FLEET_MANAGER), createMaintenanceLog);

router.patch(
  '/:id/complete',
  authorizeRoles(ROLES.FLEET_MANAGER),
  completeMaintenanceLog
);

module.exports = router;
