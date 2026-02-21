const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const { NotFoundError, BusinessRuleError } = require('../utils/AppError');
const { buildQueryOptions, paginationMeta } = require('../utils/queryHelpers');
const { DRIVER_STATUS, TRIP_STATUS } = require('../config/constants');

const getDrivers = asyncHandler(async (req, res) => {
  const { where, orderBy, skip, take, page } = buildQueryOptions(req.query, [
    'status', 'name', 'email', 'licenseCategory',
  ]);

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({ where, orderBy, skip, take }),
    prisma.driver.count({ where }),
  ]);

  // Add computed field
  const results = drivers.map((d) => ({
    ...d,
    isLicenseExpired: d.licenseExpiryDate < new Date(),
  }));

  sendResponse(res, 200, {
    results,
    pagination: paginationMeta(total, page, take),
  });
});

const getDriver = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!driver) throw new NotFoundError('Driver not found');
  sendResponse(res, 200, { ...driver, isLicenseExpired: driver.licenseExpiryDate < new Date() });
});

const createDriver = asyncHandler(async (req, res) => {
  const { name, email, phone, licenseNumber, licenseExpiryDate, licenseCategory, performance } = req.body;

  const driver = await prisma.driver.create({
    data: {
      name,
      email: email?.toLowerCase(),
      phone,
      licenseNumber,
      licenseExpiryDate: new Date(licenseExpiryDate),
      licenseCategory,
      performance: performance || 'Good',
    },
  });
  sendResponse(res, 201, driver, 'Driver created successfully');
});

const updateDriver = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!driver) throw new NotFoundError('Driver not found');

  if (driver.status === DRIVER_STATUS.ON_TRIP) {
    throw new BusinessRuleError('Cannot update a driver currently on a trip');
  }

  const { name, email, phone, licenseNumber, licenseExpiryDate, licenseCategory, performance } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email.toLowerCase();
  if (phone !== undefined) data.phone = phone;
  if (licenseNumber !== undefined) data.licenseNumber = licenseNumber;
  if (licenseExpiryDate !== undefined) data.licenseExpiryDate = new Date(licenseExpiryDate);
  if (licenseCategory !== undefined) data.licenseCategory = licenseCategory;
  if (performance !== undefined) data.performance = performance;

  const updated = await prisma.driver.update({ where: { id: req.params.id }, data });
  sendResponse(res, 200, updated, 'Driver updated successfully');
});

const updateDriverStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new BusinessRuleError('Status is required');

  const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!driver) throw new NotFoundError('Driver not found');

  const validStatuses = Object.values(DRIVER_STATUS);
  if (!validStatuses.includes(status)) {
    throw new BusinessRuleError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  if (driver.status === DRIVER_STATUS.ON_TRIP && status !== DRIVER_STATUS.AVAILABLE) {
    throw new BusinessRuleError('Driver is on trip. Complete the trip to change status.');
  }

  const updated = await prisma.driver.update({
    where: { id: req.params.id },
    data: { status },
  });
  sendResponse(res, 200, updated, `Driver status updated to ${status}`);
});

const getDriverPerformance = asyncHandler(async (req, res) => {
  const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!driver) throw new NotFoundError('Driver not found');

  const [completedTrips, cancelledTrips, totalTrips] = await Promise.all([
    prisma.trip.count({ where: { driverId: req.params.id, status: TRIP_STATUS.COMPLETED } }),
    prisma.trip.count({ where: { driverId: req.params.id, status: TRIP_STATUS.CANCELLED } }),
    prisma.trip.count({ where: { driverId: req.params.id } }),
  ]);

  const agg = await prisma.trip.aggregate({
    where: { driverId: req.params.id, status: TRIP_STATUS.COMPLETED },
    _sum: { distanceKm: true, revenue: true },
  });

  sendResponse(res, 200, {
    driver: {
      id: driver.id,
      name: driver.name,
      safetyScore: driver.safetyScore,
      status: driver.status,
      isLicenseExpired: driver.licenseExpiryDate < new Date(),
    },
    performance: {
      totalTrips,
      completedTrips,
      cancelledTrips,
      completionRate: totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(1) : 0,
      totalDistanceKm: agg._sum.distanceKm || 0,
      totalRevenue: agg._sum.revenue || 0,
    },
  });
});

module.exports = { getDrivers, getDriver, createDriver, updateDriver, updateDriverStatus, getDriverPerformance };
