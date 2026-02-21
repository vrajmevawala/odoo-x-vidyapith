const Trip = require('../models/Trip');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const { NotFoundError } = require('../utils/AppError');
const { buildQueryOptions, paginationMeta } = require('../utils/queryHelpers');
const tripService = require('../services/tripService');

/**
 * @desc    Get all trips
 * @route   GET /api/trips
 * @access  Private
 */
const getTrips = asyncHandler(async (req, res) => {
  const { filter, sort, skip, limit, page } = buildQueryOptions(req.query, [
    'status',
    'vehicle',
    'driver',
    'origin',
    'destination',
  ]);

  const [trips, total] = await Promise.all([
    Trip.find(filter)
      .populate('vehicle', 'name licensePlate status')
      .populate('driver', 'name email status')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Trip.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    results: trips,
    pagination: paginationMeta(total, page, limit),
  });
});

/**
 * @desc    Get single trip
 * @route   GET /api/trips/:id
 * @access  Private
 */
const getTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id)
    .populate('vehicle')
    .populate('driver');

  if (!trip) throw new NotFoundError('Trip not found');
  sendResponse(res, 200, trip);
});

/**
 * @desc    Create trip (Draft)
 * @route   POST /api/trips
 * @access  Private (dispatcher)
 */
const createTrip = asyncHandler(async (req, res) => {
  const { vehicle, driver, cargoWeight, origin, destination, distanceKm, revenue } = req.body;

  // Validate all business rules
  await tripService.validateTripCreation({
    vehicleId: vehicle,
    driverId: driver,
    cargoWeight,
  });

  const trip = await Trip.create({
    vehicle,
    driver,
    cargoWeight,
    origin,
    destination,
    distanceKm,
    revenue,
  });

  const populated = await Trip.findById(trip._id)
    .populate('vehicle', 'name licensePlate maxLoadCapacity')
    .populate('driver', 'name email');

  sendResponse(res, 201, populated, 'Trip created in Draft status');
});

/**
 * @desc    Dispatch a trip
 * @route   PATCH /api/trips/:id/dispatch
 * @access  Private (dispatcher)
 */
const dispatchTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) throw new NotFoundError('Trip not found');

  await tripService.dispatchTrip(trip);

  const populated = await Trip.findById(trip._id)
    .populate('vehicle', 'name licensePlate status')
    .populate('driver', 'name email status');

  sendResponse(res, 200, populated, 'Trip dispatched successfully');
});

/**
 * @desc    Complete a trip
 * @route   PATCH /api/trips/:id/complete
 * @access  Private (dispatcher)
 */
const completeTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) throw new NotFoundError('Trip not found');

  await tripService.completeTrip(trip);

  const populated = await Trip.findById(trip._id)
    .populate('vehicle', 'name licensePlate status odometer')
    .populate('driver', 'name email status');

  sendResponse(res, 200, populated, 'Trip completed successfully');
});

/**
 * @desc    Cancel a trip
 * @route   PATCH /api/trips/:id/cancel
 * @access  Private (dispatcher)
 */
const cancelTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) throw new NotFoundError('Trip not found');

  await tripService.cancelTrip(trip);

  const populated = await Trip.findById(trip._id)
    .populate('vehicle', 'name licensePlate status')
    .populate('driver', 'name email status');

  sendResponse(res, 200, populated, 'Trip cancelled successfully');
});

module.exports = {
  getTrips,
  getTrip,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
};
