const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const { NotFoundError, BusinessRuleError } = require('../utils/AppError');
const { buildQueryOptions, paginationMeta } = require('../utils/queryHelpers');
const { DRIVER_STATUS, TRIP_STATUS } = require('../config/constants');

/**
 * @desc    Get all drivers
 * @route   GET /api/drivers
 * @access  Private
 */
const getDrivers = asyncHandler(async (req, res) => {
  const { filter, sort, skip, limit, page } = buildQueryOptions(req.query, [
    'status',
    'name',
    'email',
    'licenseCategory',
  ]);

  const [drivers, total] = await Promise.all([
    Driver.find(filter).sort(sort).skip(skip).limit(limit),
    Driver.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    results: drivers,
    pagination: paginationMeta(total, page, limit),
  });
});

/**
 * @desc    Get single driver
 * @route   GET /api/drivers/:id
 * @access  Private
 */
const getDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) throw new NotFoundError('Driver not found');
  sendResponse(res, 200, driver);
});

/**
 * @desc    Create driver
 * @route   POST /api/drivers
 * @access  Private (fleet_manager)
 */
const createDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.create(req.body);
  sendResponse(res, 201, driver, 'Driver created successfully');
});

/**
 * @desc    Update driver
 * @route   PUT /api/drivers/:id
 * @access  Private (fleet_manager)
 */
const updateDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) throw new NotFoundError('Driver not found');

  if (driver.status === DRIVER_STATUS.ON_TRIP) {
    throw new BusinessRuleError('Cannot update a driver currently on a trip');
  }

  const updatedDriver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  sendResponse(res, 200, updatedDriver, 'Driver updated successfully');
});

/**
 * @desc    Update driver status
 * @route   PATCH /api/drivers/:id/status
 * @access  Private (fleet_manager, safety_officer)
 */
const updateDriverStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new BusinessRuleError('Status is required');

  const driver = await Driver.findById(req.params.id);
  if (!driver) throw new NotFoundError('Driver not found');

  const validStatuses = Object.values(DRIVER_STATUS);
  if (!validStatuses.includes(status)) {
    throw new BusinessRuleError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Cannot change status of a driver on trip manually
  if (driver.status === DRIVER_STATUS.ON_TRIP && status !== DRIVER_STATUS.AVAILABLE) {
    throw new BusinessRuleError('Driver is on trip. Complete the trip to change status.');
  }

  driver.status = status;
  await driver.save();

  sendResponse(res, 200, driver, `Driver status updated to ${status}`);
});

/**
 * @desc    Get driver performance
 * @route   GET /api/drivers/:id/performance
 * @access  Private
 */
const getDriverPerformance = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) throw new NotFoundError('Driver not found');

  const [completedTrips, cancelledTrips, totalTrips] = await Promise.all([
    Trip.countDocuments({ driver: req.params.id, status: TRIP_STATUS.COMPLETED }),
    Trip.countDocuments({ driver: req.params.id, status: TRIP_STATUS.CANCELLED }),
    Trip.countDocuments({ driver: req.params.id }),
  ]);

  const trips = await Trip.find({
    driver: req.params.id,
    status: TRIP_STATUS.COMPLETED,
  });

  const totalDistance = trips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
  const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);

  sendResponse(res, 200, {
    driver: {
      _id: driver._id,
      name: driver.name,
      safetyScore: driver.safetyScore,
      status: driver.status,
      isLicenseExpired: driver.isLicenseExpired,
    },
    performance: {
      totalTrips,
      completedTrips,
      cancelledTrips,
      completionRate: totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(1) : 0,
      totalDistanceKm: totalDistance,
      totalRevenue,
    },
  });
});

module.exports = {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  updateDriverStatus,
  getDriverPerformance,
};
