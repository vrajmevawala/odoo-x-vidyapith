const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const complianceService = require('../services/complianceService');

const getComplianceReport = asyncHandler(async (req, res) => {
  const report = await complianceService.getComplianceReport();
  sendResponse(res, 200, report);
});

const getExpiredLicenses = asyncHandler(async (req, res) => {
  const drivers = await complianceService.getExpiredLicenseDrivers();
  sendResponse(res, 200, drivers);
});

const getExpiringLicenses = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const drivers = await complianceService.getExpiringLicenseDrivers(days);
  sendResponse(res, 200, drivers);
});

const getLowSafetyScores = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold, 10) || 50;
  const drivers = await complianceService.getLowSafetyScoreDrivers(threshold);
  sendResponse(res, 200, drivers);
});

module.exports = { getComplianceReport, getExpiredLicenses, getExpiringLicenses, getLowSafetyScores };
