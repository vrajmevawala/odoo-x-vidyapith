const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const complianceService = require('../services/complianceService');

/**
 * @desc    Get full compliance report
 * @route   GET /api/compliance/report
 * @access  Private (safety_officer)
 */
const getComplianceReport = asyncHandler(async (req, res) => {
  const report = await complianceService.getComplianceReport();
  sendResponse(res, 200, report);
});

/**
 * @desc    Get drivers with expired licenses
 * @route   GET /api/compliance/expired-licenses
 * @access  Private (safety_officer)
 */
const getExpiredLicenses = asyncHandler(async (req, res) => {
  const drivers = await complianceService.getExpiredLicenseDrivers();
  sendResponse(res, 200, drivers);
});

/**
 * @desc    Get drivers with licenses expiring soon
 * @route   GET /api/compliance/expiring-licenses
 * @access  Private (safety_officer)
 */
const getExpiringLicenses = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const drivers = await complianceService.getExpiringLicenseDrivers(days);
  sendResponse(res, 200, drivers);
});

/**
 * @desc    Get drivers with low safety scores
 * @route   GET /api/compliance/low-safety-scores
 * @access  Private (safety_officer)
 */
const getLowSafetyScores = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold, 10) || 50;
  const drivers = await complianceService.getLowSafetyScoreDrivers(threshold);
  sendResponse(res, 200, drivers);
});

module.exports = {
  getComplianceReport,
  getExpiredLicenses,
  getExpiringLicenses,
  getLowSafetyScores,
};
