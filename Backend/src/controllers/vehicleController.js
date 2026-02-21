const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const { NotFoundError, BusinessRuleError } = require('../utils/AppError');
const { buildQueryOptions, paginationMeta } = require('../utils/queryHelpers');
const { VEHICLE_STATUS } = require('../config/constants');

/**
 * @desc    Get all vehicles
 * @route   GET /api/vehicles
 * @access  Private
 */
const getVehicles = asyncHandler(async (req, res) => {
  const { filter, sort, skip, limit, page } = buildQueryOptions(req.query, [
    'status',
    'vehicleType',
    'name',
    'model',
    'licensePlate',
  ]);

  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter).sort(sort).skip(skip).limit(limit),
    Vehicle.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    results: vehicles,
    pagination: paginationMeta(total, page, limit),
  });
});

/**
 * @desc    Get single vehicle
 * @route   GET /api/vehicles/:id
 * @access  Private
 */
const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw new NotFoundError('Vehicle not found');
  sendResponse(res, 200, vehicle);
});

/**
 * @desc    Create vehicle
 * @route   POST /api/vehicles
 * @access  Private (fleet_manager)
 */
const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.create(req.body);
  sendResponse(res, 201, vehicle, 'Vehicle created successfully');
});

/**
 * @desc    Update vehicle
 * @route   PUT /api/vehicles/:id
 * @access  Private (fleet_manager)
 */
const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  // Prevent updating retired vehicles (except un-retiring by fleet_manager)
  if (vehicle.status === VEHICLE_STATUS.RETIRED && req.body.status !== VEHICLE_STATUS.AVAILABLE) {
    throw new BusinessRuleError('Cannot update a retired vehicle');
  }

  const updatedVehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  sendResponse(res, 200, updatedVehicle, 'Vehicle updated successfully');
});

/**
 * @desc    Delete vehicle
 * @route   DELETE /api/vehicles/:id
 * @access  Private (fleet_manager)
 */
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
    throw new BusinessRuleError('Cannot delete a vehicle currently on a trip');
  }

  await vehicle.deleteOne();
  sendResponse(res, 200, null, 'Vehicle deleted successfully');
});

/**
 * @desc    Retire a vehicle
 * @route   PATCH /api/vehicles/:id/retire
 * @access  Private (fleet_manager only)
 */
const retireVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  if (vehicle.status === VEHICLE_STATUS.RETIRED) {
    throw new BusinessRuleError('Vehicle is already retired');
  }

  if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
    throw new BusinessRuleError('Cannot retire a vehicle currently on a trip');
  }

  vehicle.status = VEHICLE_STATUS.RETIRED;
  await vehicle.save();

  sendResponse(res, 200, vehicle, 'Vehicle retired successfully');
});

/**
 * @desc    Update vehicle status
 * @route   PATCH /api/vehicles/:id/status
 * @access  Private (fleet_manager)
 */
const updateVehicleStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new BusinessRuleError('Status is required');

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  if (vehicle.status === VEHICLE_STATUS.RETIRED) {
    throw new BusinessRuleError('Cannot change status of a retired vehicle. Use un-retire flow.');
  }

  const validStatuses = Object.values(VEHICLE_STATUS);
  if (!validStatuses.includes(status)) {
    throw new BusinessRuleError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  vehicle.status = status;
  await vehicle.save();

  sendResponse(res, 200, vehicle, `Vehicle status updated to ${status}`);
});

module.exports = {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  retireVehicle,
  updateVehicleStatus,
};
