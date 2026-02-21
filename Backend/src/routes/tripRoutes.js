const express = require('express');
const router = express.Router();
const {
  getTrips,
  getTrip,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} = require('../controllers/tripController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateUser);

router
  .route('/')
  .get(getTrips)
  .post(authorizeRoles(ROLES.DISPATCHER), createTrip);

router.route('/:id').get(getTrip);

router.patch('/:id/dispatch', authorizeRoles(ROLES.DISPATCHER), dispatchTrip);
router.patch('/:id/complete', authorizeRoles(ROLES.DISPATCHER), completeTrip);
router.patch('/:id/cancel', authorizeRoles(ROLES.DISPATCHER), cancelTrip);

module.exports = router;
