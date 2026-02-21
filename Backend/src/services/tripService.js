const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const { BusinessRuleError } = require('../utils/AppError');
const { VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS } = require('../config/constants');

/**
 * Validate trip creation business rules.
 * Throws BusinessRuleError if any rule is violated.
 */
const validateTripCreation = async ({ vehicleId, driverId, cargoWeight }) => {
  const [vehicle, driver] = await Promise.all([
    Vehicle.findById(vehicleId),
    Driver.findById(driverId),
  ]);

  if (!vehicle) throw new BusinessRuleError('Vehicle not found');
  if (!driver) throw new BusinessRuleError('Driver not found');

  // Vehicle status check
  if (vehicle.status === VEHICLE_STATUS.RETIRED) {
    throw new BusinessRuleError('Cannot assign a retired vehicle to a trip');
  }
  if (vehicle.status === VEHICLE_STATUS.IN_SHOP) {
    throw new BusinessRuleError('Cannot assign a vehicle currently in shop');
  }
  if (vehicle.status === VEHICLE_STATUS.OUT_OF_SERVICE) {
    throw new BusinessRuleError('Cannot assign an out-of-service vehicle');
  }
  if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
    throw new BusinessRuleError(`Vehicle is not available. Current status: ${vehicle.status}`);
  }

  // Driver status check
  if (driver.status === DRIVER_STATUS.SUSPENDED) {
    throw new BusinessRuleError('Cannot assign a suspended driver');
  }
  if (driver.status !== DRIVER_STATUS.AVAILABLE) {
    throw new BusinessRuleError(`Driver is not available. Current status: ${driver.status}`);
  }

  // License expiry check
  if (driver.isLicenseExpired) {
    throw new BusinessRuleError(
      `Driver's license expired on ${driver.licenseExpiryDate.toISOString().split('T')[0]}`
    );
  }

  // Cargo weight check
  if (cargoWeight > vehicle.maxLoadCapacity) {
    throw new BusinessRuleError(
      `Cargo weight (${cargoWeight} kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacity} kg)`
    );
  }

  return { vehicle, driver };
};

/**
 * Dispatch a trip: transition from Draft → Dispatched.
 * Sets vehicle & driver to On Trip.
 */
const dispatchTrip = async (trip) => {
  if (trip.status !== TRIP_STATUS.DRAFT) {
    throw new BusinessRuleError(
      `Cannot dispatch trip. Current status: ${trip.status}. Only Draft trips can be dispatched.`
    );
  }

  const [vehicle, driver] = await Promise.all([
    Vehicle.findById(trip.vehicle),
    Driver.findById(trip.driver),
  ]);

  if (!vehicle) throw new BusinessRuleError('Associated vehicle not found');
  if (!driver) throw new BusinessRuleError('Associated driver not found');

  // Re-check availability at dispatch time
  if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
    throw new BusinessRuleError(`Vehicle is no longer available. Status: ${vehicle.status}`);
  }
  if (driver.status !== DRIVER_STATUS.AVAILABLE) {
    throw new BusinessRuleError(`Driver is no longer available. Status: ${driver.status}`);
  }
  if (driver.isLicenseExpired) {
    throw new BusinessRuleError("Driver's license has expired since trip creation");
  }

  // Transition statuses
  vehicle.status = VEHICLE_STATUS.ON_TRIP;
  driver.status = DRIVER_STATUS.ON_TRIP;
  trip.status = TRIP_STATUS.DISPATCHED;
  trip.dispatchedAt = new Date();

  await Promise.all([vehicle.save(), driver.save(), trip.save()]);

  return trip;
};

/**
 * Complete a trip: transition Dispatched → Completed.
 * Restores vehicle & driver to Available, updates odometer.
 */
const completeTrip = async (trip) => {
  if (trip.status !== TRIP_STATUS.DISPATCHED) {
    throw new BusinessRuleError(
      `Cannot complete trip. Current status: ${trip.status}. Only Dispatched trips can be completed.`
    );
  }

  const [vehicle, driver] = await Promise.all([
    Vehicle.findById(trip.vehicle),
    Driver.findById(trip.driver),
  ]);

  if (!vehicle) throw new BusinessRuleError('Associated vehicle not found');
  if (!driver) throw new BusinessRuleError('Associated driver not found');

  // Update odometer
  vehicle.odometer = (vehicle.odometer || 0) + trip.distanceKm;
  vehicle.status = VEHICLE_STATUS.AVAILABLE;
  driver.status = DRIVER_STATUS.AVAILABLE;
  trip.status = TRIP_STATUS.COMPLETED;
  trip.completedAt = new Date();

  await Promise.all([vehicle.save(), driver.save(), trip.save()]);

  return trip;
};

/**
 * Cancel a trip: transition Draft / Dispatched → Cancelled.
 * If dispatched, restores vehicle & driver to Available.
 */
const cancelTrip = async (trip) => {
  if (trip.status === TRIP_STATUS.COMPLETED) {
    throw new BusinessRuleError('Cannot cancel a completed trip');
  }
  if (trip.status === TRIP_STATUS.CANCELLED) {
    throw new BusinessRuleError('Trip is already cancelled');
  }

  if (trip.status === TRIP_STATUS.DISPATCHED) {
    const [vehicle, driver] = await Promise.all([
      Vehicle.findById(trip.vehicle),
      Driver.findById(trip.driver),
    ]);

    if (vehicle) {
      vehicle.status = VEHICLE_STATUS.AVAILABLE;
      await vehicle.save();
    }
    if (driver) {
      driver.status = DRIVER_STATUS.AVAILABLE;
      await driver.save();
    }
  }

  trip.status = TRIP_STATUS.CANCELLED;
  trip.cancelledAt = new Date();
  await trip.save();

  return trip;
};

module.exports = {
  validateTripCreation,
  dispatchTrip,
  completeTrip,
  cancelTrip,
};
