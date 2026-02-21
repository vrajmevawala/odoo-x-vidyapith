const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  retireVehicle,
  updateVehicleStatus,
} = require('../controllers/vehicleController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateUser);

router
  .route('/')
  .get(getVehicles)
  .post(authorizeRoles(ROLES.FLEET_MANAGER), createVehicle);

router
  .route('/:id')
  .get(getVehicle)
  .put(authorizeRoles(ROLES.FLEET_MANAGER), updateVehicle)
  .delete(authorizeRoles(ROLES.FLEET_MANAGER), deleteVehicle);

router.patch('/:id/retire', authorizeRoles(ROLES.FLEET_MANAGER), retireVehicle);
router.patch('/:id/status', authorizeRoles(ROLES.FLEET_MANAGER), updateVehicleStatus);

module.exports = router;
