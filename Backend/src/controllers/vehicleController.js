const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const { NotFoundError, BusinessRuleError } = require('../utils/AppError');
const { buildQueryOptions, paginationMeta } = require('../utils/queryHelpers');
const { VEHICLE_STATUS } = require('../config/constants');

const getVehicles = asyncHandler(async (req, res) => {
  const { where, orderBy, skip, take, page } = buildQueryOptions(req.query, [
    'status', 'vehicleType', 'name', 'model', 'licensePlate',
  ]);

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({ where, orderBy, skip, take }),
    prisma.vehicle.count({ where }),
  ]);

  sendResponse(res, 200, {
    results: vehicles,
    pagination: paginationMeta(total, page, take),
  });
});

const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) throw new NotFoundError('Vehicle not found');
  sendResponse(res, 200, vehicle);
});

const createVehicle = asyncHandler(async (req, res) => {
  const { name, model, vehicleType, licensePlate, maxLoadCapacity, odometer, acquisitionCost } = req.body;
  const vehicle = await prisma.vehicle.create({
    data: {
      name,
      model,
      vehicleType: vehicleType || 'Truck',
      licensePlate: licensePlate?.toUpperCase(),
      maxLoadCapacity: Number(maxLoadCapacity) || 0,
      odometer: Number(odometer) || 0,
      acquisitionCost: Number(acquisitionCost) || 0,
    },
  });
  sendResponse(res, 201, vehicle, 'Vehicle created successfully');
});

const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  if (vehicle.status === VEHICLE_STATUS.RETIRED && req.body.status !== VEHICLE_STATUS.AVAILABLE) {
    throw new BusinessRuleError('Cannot update a retired vehicle');
  }

  const { name, model, vehicleType, licensePlate, maxLoadCapacity, odometer, acquisitionCost, status } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (model !== undefined) data.model = model;
  if (vehicleType !== undefined) data.vehicleType = vehicleType;
  if (licensePlate !== undefined) data.licensePlate = licensePlate.toUpperCase();
  if (maxLoadCapacity !== undefined) data.maxLoadCapacity = Number(maxLoadCapacity);
  if (odometer !== undefined) data.odometer = Number(odometer);
  if (acquisitionCost !== undefined) data.acquisitionCost = Number(acquisitionCost);
  if (status !== undefined) data.status = status;

  const updated = await prisma.vehicle.update({ where: { id: req.params.id }, data });
  sendResponse(res, 200, updated, 'Vehicle updated successfully');
});

const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
    throw new BusinessRuleError('Cannot delete a vehicle currently on a trip');
  }

  await prisma.vehicle.delete({ where: { id: req.params.id } });
  sendResponse(res, 200, null, 'Vehicle deleted successfully');
});

const retireVehicle = asyncHandler(async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  if (vehicle.status === VEHICLE_STATUS.RETIRED) {
    throw new BusinessRuleError('Vehicle is already retired');
  }
  if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
    throw new BusinessRuleError('Cannot retire a vehicle currently on a trip');
  }

  const updated = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: { status: VEHICLE_STATUS.RETIRED },
  });
  sendResponse(res, 200, updated, 'Vehicle retired successfully');
});

const updateVehicleStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new BusinessRuleError('Status is required');

  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  if (vehicle.status === VEHICLE_STATUS.RETIRED) {
    throw new BusinessRuleError('Cannot change status of a retired vehicle. Use un-retire flow.');
  }

  const validStatuses = Object.values(VEHICLE_STATUS);
  if (!validStatuses.includes(status)) {
    throw new BusinessRuleError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const updated = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: { status },
  });
  sendResponse(res, 200, updated, `Vehicle status updated to ${status}`);
});

module.exports = { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle, retireVehicle, updateVehicleStatus };
