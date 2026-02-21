const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const { NotFoundError } = require('../utils/AppError');
const analyticsService = require('../services/analyticsService');

/**
 * @desc    Get fleet dashboard metrics
 * @route   GET /api/analytics/dashboard
 * @access  Private (financial_analyst)
 */
const getDashboard = asyncHandler(async (req, res) => {
  const metrics = await analyticsService.getDashboardMetrics();
  sendResponse(res, 200, metrics);
});

/**
 * @desc    Get vehicle ROI
 * @route   GET /api/analytics/vehicle-roi/:vehicleId
 * @access  Private (financial_analyst)
 */
const getVehicleROI = asyncHandler(async (req, res) => {
  const data = await analyticsService.getVehicleROI(req.params.vehicleId);
  if (!data) throw new NotFoundError('Vehicle not found');
  sendResponse(res, 200, data);
});

/**
 * @desc    Get fuel efficiency for a vehicle
 * @route   GET /api/analytics/fuel-efficiency/:vehicleId
 * @access  Private (financial_analyst)
 */
const getFuelEfficiency = asyncHandler(async (req, res) => {
  const data = await analyticsService.getFuelEfficiency(req.params.vehicleId);
  if (!data) throw new NotFoundError('Vehicle not found');
  sendResponse(res, 200, data);
});

module.exports = {
  getDashboard,
  getVehicleROI,
  getFuelEfficiency,
};
