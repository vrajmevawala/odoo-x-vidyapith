const prisma = require('../config/prisma');
const { BusinessRuleError } = require('../utils/AppError');
const { VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS } = require('../config/constants');

const validateTripCreation = async ({ vehicleId, driverId, cargoWeight }) => {
  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: vehicleId } }),
    prisma.driver.findUnique({ where: { id: driverId } }),
  ]);

  if (!vehicle) throw new BusinessRuleError('Vehicle not found');
  if (!driver) throw new BusinessRuleError('Driver not found');

  if (vehicle.status === VEHICLE_STATUS.RETIRED) throw new BusinessRuleError('Cannot assign a retired vehicle to a trip');
  if (vehicle.status === VEHICLE_STATUS.IN_SHOP) throw new BusinessRuleError('Cannot assign a vehicle currently in shop');
  if (vehicle.status === VEHICLE_STATUS.OUT_OF_SERVICE) throw new BusinessRuleError('Cannot assign an out-of-service vehicle');
  if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) throw new BusinessRuleError(`Vehicle is not available. Current status: ${vehicle.status}`);

  if (driver.status === DRIVER_STATUS.SUSPENDED) throw new BusinessRuleError('Cannot assign a suspended driver');
  if (driver.status !== DRIVER_STATUS.AVAILABLE) throw new BusinessRuleError(`Driver is not available. Current status: ${driver.status}`);

  if (driver.licenseExpiryDate < new Date()) {
    throw new BusinessRuleError(`Driver's license expired on ${driver.licenseExpiryDate.toISOString().split('T')[0]}`);
  }

  if (cargoWeight > vehicle.maxLoadCapacity) {
    throw new BusinessRuleError(`Cargo weight (${cargoWeight} kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacity} kg)`);
  }

  return { vehicle, driver };
};

const dispatchTrip = async (trip) => {
  if (trip.status !== TRIP_STATUS.DRAFT) {
    throw new BusinessRuleError(`Cannot dispatch trip. Current status: ${trip.status}. Only Draft trips can be dispatched.`);
  }

  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: trip.vehicleId } }),
    prisma.driver.findUnique({ where: { id: trip.driverId } }),
  ]);

  if (!vehicle) throw new BusinessRuleError('Associated vehicle not found');
  if (!driver) throw new BusinessRuleError('Associated driver not found');

  if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) throw new BusinessRuleError(`Vehicle is no longer available. Status: ${vehicle.status}`);
  if (driver.status !== DRIVER_STATUS.AVAILABLE) throw new BusinessRuleError(`Driver is no longer available. Status: ${driver.status}`);
  if (driver.licenseExpiryDate < new Date()) throw new BusinessRuleError("Driver's license has expired since trip creation");

  // Atomic update via transaction
  await prisma.$transaction([
    prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VEHICLE_STATUS.ON_TRIP } }),
    prisma.driver.update({ where: { id: trip.driverId }, data: { status: DRIVER_STATUS.ON_TRIP } }),
    prisma.trip.update({ where: { id: trip.id }, data: { status: TRIP_STATUS.DISPATCHED, dispatchedAt: new Date() } }),
  ]);

  return trip;
};

const completeTrip = async (trip) => {
  if (trip.status !== TRIP_STATUS.DISPATCHED) {
    throw new BusinessRuleError(`Cannot complete trip. Current status: ${trip.status}. Only Dispatched trips can be completed.`);
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });

  await prisma.$transaction([
    prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        status: VEHICLE_STATUS.AVAILABLE,
        odometer: (vehicle?.odometer || 0) + trip.distanceKm,
      },
    }),
    prisma.driver.update({ where: { id: trip.driverId }, data: { status: DRIVER_STATUS.AVAILABLE } }),
    prisma.trip.update({ where: { id: trip.id }, data: { status: TRIP_STATUS.COMPLETED, completedAt: new Date() } }),
  ]);

  return trip;
};

const cancelTrip = async (trip) => {
  if (trip.status === TRIP_STATUS.COMPLETED) throw new BusinessRuleError('Cannot cancel a completed trip');
  if (trip.status === TRIP_STATUS.CANCELLED) throw new BusinessRuleError('Trip is already cancelled');

  const ops = [
    prisma.trip.update({ where: { id: trip.id }, data: { status: TRIP_STATUS.CANCELLED, cancelledAt: new Date() } }),
  ];

  if (trip.status === TRIP_STATUS.DISPATCHED) {
    ops.push(
      prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VEHICLE_STATUS.AVAILABLE } }),
      prisma.driver.update({ where: { id: trip.driverId }, data: { status: DRIVER_STATUS.AVAILABLE } }),
    );
  }

  await prisma.$transaction(ops);
  return trip;
};

module.exports = { validateTripCreation, dispatchTrip, completeTrip, cancelTrip };
