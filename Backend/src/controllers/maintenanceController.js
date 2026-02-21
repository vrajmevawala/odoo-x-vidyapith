const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const { NotFoundError, BusinessRuleError } = require('../utils/AppError');
const { buildQueryOptions, paginationMeta } = require('../utils/queryHelpers');
const { VEHICLE_STATUS } = require('../config/constants');

/**
 * @desc    Get all maintenance logs
 * @route   GET /api/maintenance
 * @access  Private
 */
const getMaintenanceLogs = asyncHandler(async (req, res) => {
  const { filter, sort, skip, limit, page } = buildQueryOptions(req.query, [
    'vehicle',
    'type',
    'isCompleted',
  ]);

  const [logs, total] = await Promise.all([
    MaintenanceLog.find(filter)
      .populate('vehicle', 'name licensePlate status')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    MaintenanceLog.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    results: logs,
    pagination: paginationMeta(total, page, limit),
  });
});

/**
 * @desc    Create maintenance log (vehicle → In Shop)
 * @route   POST /api/maintenance
 * @access  Private (fleet_manager)
 */
const createMaintenanceLog = asyncHandler(async (req, res) => {
  const { vehicle: vehicleId, type, cost, date, notes } = req.body;

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
    throw new BusinessRuleError('Cannot schedule maintenance for a vehicle currently on a trip');
  }

  if (vehicle.status === VEHICLE_STATUS.RETIRED) {
    throw new BusinessRuleError('Cannot schedule maintenance for a retired vehicle');
  }

  // Set vehicle to In Shop
  vehicle.status = VEHICLE_STATUS.IN_SHOP;
  await vehicle.save();

  const log = await MaintenanceLog.create({
    vehicle: vehicleId,
    type,
    cost,
    date,
    notes,
  });

  const populated = await MaintenanceLog.findById(log._id).populate(
    'vehicle',
    'name licensePlate status'
  );

  sendResponse(res, 201, populated, 'Maintenance log created. Vehicle set to In Shop.');
});

/**
 * @desc    Complete maintenance (vehicle → Available)
 * @route   PATCH /api/maintenance/:id/complete
 * @access  Private (fleet_manager)
 */
const completeMaintenanceLog = asyncHandler(async (req, res) => {
  const log = await MaintenanceLog.findById(req.params.id);
  if (!log) throw new NotFoundError('Maintenance log not found');

  if (log.isCompleted) {
    throw new BusinessRuleError('Maintenance log is already completed');
  }

  log.isCompleted = true;
  log.completedAt = new Date();
  await log.save();

  // Check if there are other open maintenance logs for this vehicle
  const openLogs = await MaintenanceLog.countDocuments({
    vehicle: log.vehicle,
    isCompleted: false,
  });

  // Only set vehicle to Available if no other open maintenance logs exist
  if (openLogs === 0) {
    const vehicle = await Vehicle.findById(log.vehicle);
    if (vehicle && vehicle.status === VEHICLE_STATUS.IN_SHOP) {
      vehicle.status = VEHICLE_STATUS.AVAILABLE;
      await vehicle.save();
    }
  }

  const populated = await MaintenanceLog.findById(log._id).populate(
    'vehicle',
    'name licensePlate status'
  );

  sendResponse(res, 200, populated, 'Maintenance completed. Vehicle status updated.');
});

module.exports = {
  getMaintenanceLogs,
  createMaintenanceLog,
  completeMaintenanceLog,
};
