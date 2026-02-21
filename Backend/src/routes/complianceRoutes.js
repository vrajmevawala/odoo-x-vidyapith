const express = require('express');
const router = express.Router();
const {
  getComplianceReport,
  getExpiredLicenses,
  getExpiringLicenses,
  getLowSafetyScores,
} = require('../controllers/complianceController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateUser);
router.use(authorizeRoles(ROLES.SAFETY_OFFICER, ROLES.FLEET_MANAGER));

router.get('/report', getComplianceReport);
router.get('/expired-licenses', getExpiredLicenses);
router.get('/expiring-licenses', getExpiringLicenses);
router.get('/low-safety-scores', getLowSafetyScores);

module.exports = router;
