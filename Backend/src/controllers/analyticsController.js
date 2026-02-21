const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const { NotFoundError } = require('../utils/AppError');
const analyticsService = require('../services/analyticsService');

const getDashboard = asyncHandler(async (req, res) => {
  const metrics = await analyticsService.getDashboardMetrics();
  sendResponse(res, 200, metrics);
});

const getVehicleROI = asyncHandler(async (req, res) => {
  const data = await analyticsService.getVehicleROI(req.params.vehicleId);
  if (!data) throw new NotFoundError('Vehicle not found');
  sendResponse(res, 200, data);
});

const getFuelEfficiency = asyncHandler(async (req, res) => {
  const data = await analyticsService.getFuelEfficiency(req.params.vehicleId);
  if (!data) throw new NotFoundError('Vehicle not found');
  sendResponse(res, 200, data);
});

module.exports = { getDashboard, getVehicleROI, getFuelEfficiency };
