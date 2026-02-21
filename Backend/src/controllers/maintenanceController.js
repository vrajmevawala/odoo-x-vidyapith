const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const { NotFoundError, BusinessRuleError } = require('../utils/AppError');
const { buildQueryOptions, paginationMeta } = require('../utils/queryHelpers');
const { VEHICLE_STATUS } = require('../config/constants');

const MAINT_INCLUDE = {
  vehicle: { select: { id: true, name: true, licensePlate: true, status: true } },
};

const getMaintenanceLogs = asyncHandler(async (req, res) => {
  const { where, orderBy, skip, take, page } = buildQueryOptions(req.query, [
    'vehicleId', 'type', 'isCompleted',
  ]);

  const [logs, total] = await Promise.all([
    prisma.maintenanceLog.findMany({ where, orderBy, skip, take, include: MAINT_INCLUDE }),
    prisma.maintenanceLog.count({ where }),
  ]);

  sendResponse(res, 200, {
    results: logs,
    pagination: paginationMeta(total, page, take),
  });
});

const createMaintenanceLog = asyncHandler(async (req, res) => {
  const { vehicle: vehicleId, type, cost, date, notes } = req.body;

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
    throw new BusinessRuleError('Cannot schedule maintenance for a vehicle currently on a trip');
  }
  if (vehicle.status === VEHICLE_STATUS.RETIRED) {
    throw new BusinessRuleError('Cannot schedule maintenance for a retired vehicle');
  }

  // Set vehicle to In Shop + create log in a transaction
  const [, log] = await prisma.$transaction([
    prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: VEHICLE_STATUS.IN_SHOP },
    }),
    prisma.maintenanceLog.create({
      data: {
        vehicleId,
        type,
        cost: Number(cost),
        date: date ? new Date(date) : new Date(),
        notes,
      },
      include: MAINT_INCLUDE,
    }),
  ]);

  sendResponse(res, 201, log, 'Maintenance log created. Vehicle set to In Shop.');
});

const completeMaintenanceLog = asyncHandler(async (req, res) => {
  const log = await prisma.maintenanceLog.findUnique({ where: { id: req.params.id } });
  if (!log) throw new NotFoundError('Maintenance log not found');

  if (log.isCompleted) {
    throw new BusinessRuleError('Maintenance log is already completed');
  }

  const updated = await prisma.maintenanceLog.update({
    where: { id: req.params.id },
    data: { isCompleted: true, completedAt: new Date() },
    include: MAINT_INCLUDE,
  });

  // Check if other open logs remain for this vehicle
  const openLogs = await prisma.maintenanceLog.count({
    where: { vehicleId: log.vehicleId, isCompleted: false },
  });

  if (openLogs === 0) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: log.vehicleId } });
    if (vehicle && vehicle.status === VEHICLE_STATUS.IN_SHOP) {
      await prisma.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: VEHICLE_STATUS.AVAILABLE },
      });
    }
  }

  sendResponse(res, 200, updated, 'Maintenance completed. Vehicle status updated.');
});

module.exports = { getMaintenanceLogs, createMaintenanceLog, completeMaintenanceLog };
