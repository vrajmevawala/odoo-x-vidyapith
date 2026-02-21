const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const { NotFoundError } = require('../utils/AppError');
const { buildQueryOptions, paginationMeta } = require('../utils/queryHelpers');
const tripService = require('../services/tripService');

const TRIP_INCLUDE = {
  vehicle: { select: { id: true, name: true, licensePlate: true, status: true, maxLoadCapacity: true, odometer: true } },
  driver: { select: { id: true, name: true, email: true, status: true } },
};

const getTrips = asyncHandler(async (req, res) => {
  const { where, orderBy, skip, take, page } = buildQueryOptions(req.query, [
    'status', 'vehicleId', 'driverId', 'origin', 'destination',
  ]);

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({ where, orderBy, skip, take, include: TRIP_INCLUDE }),
    prisma.trip.count({ where }),
  ]);

  sendResponse(res, 200, {
    results: trips,
    pagination: paginationMeta(total, page, take),
  });
});

const getTrip = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: TRIP_INCLUDE,
  });
  if (!trip) throw new NotFoundError('Trip not found');
  sendResponse(res, 200, trip);
});

const createTrip = asyncHandler(async (req, res) => {
  const { vehicle, driver, cargoWeight, origin, destination, distanceKm, revenue } = req.body;

  await tripService.validateTripCreation({
    vehicleId: vehicle,
    driverId: driver,
    cargoWeight: Number(cargoWeight),
  });

  const trip = await prisma.trip.create({
    data: {
      vehicleId: vehicle,
      driverId: driver,
      cargoWeight: Number(cargoWeight),
      origin,
      destination,
      distanceKm: Number(distanceKm),
      revenue: Number(revenue) || 0,
    },
    include: TRIP_INCLUDE,
  });

  sendResponse(res, 201, trip, 'Trip created in Draft status');
});

const dispatchTrip = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip) throw new NotFoundError('Trip not found');

  await tripService.dispatchTrip(trip);

  const populated = await prisma.trip.findUnique({
    where: { id: trip.id },
    include: TRIP_INCLUDE,
  });
  sendResponse(res, 200, populated, 'Trip dispatched successfully');
});

const completeTrip = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip) throw new NotFoundError('Trip not found');

  await tripService.completeTrip(trip);

  const populated = await prisma.trip.findUnique({
    where: { id: trip.id },
    include: TRIP_INCLUDE,
  });
  sendResponse(res, 200, populated, 'Trip completed successfully');
});

const cancelTrip = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip) throw new NotFoundError('Trip not found');

  await tripService.cancelTrip(trip);

  const populated = await prisma.trip.findUnique({
    where: { id: trip.id },
    include: TRIP_INCLUDE,
  });
  sendResponse(res, 200, populated, 'Trip cancelled successfully');
});

module.exports = { getTrips, getTrip, createTrip, dispatchTrip, completeTrip, cancelTrip };
