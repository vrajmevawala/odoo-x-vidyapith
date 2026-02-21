const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const MaintenanceLog = require('../models/MaintenanceLog');
const { VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS } = require('../config/constants');

/**
 * Dashboard summary – fleet-wide KPIs.
 */
const getDashboardMetrics = async () => {
  const [
    totalVehicles,
    availableVehicles,
    onTripVehicles,
    inShopVehicles,
    retiredVehicles,
    totalDrivers,
    availableDrivers,
    totalTrips,
    completedTrips,
    activeTrips,
  ] = await Promise.all([
    Vehicle.countDocuments(),
    Vehicle.countDocuments({ status: VEHICLE_STATUS.AVAILABLE }),
    Vehicle.countDocuments({ status: VEHICLE_STATUS.ON_TRIP }),
    Vehicle.countDocuments({ status: VEHICLE_STATUS.IN_SHOP }),
    Vehicle.countDocuments({ status: VEHICLE_STATUS.RETIRED }),
    Driver.countDocuments(),
    Driver.countDocuments({ status: DRIVER_STATUS.AVAILABLE }),
    Trip.countDocuments(),
    Trip.countDocuments({ status: TRIP_STATUS.COMPLETED }),
    Trip.countDocuments({ status: TRIP_STATUS.DISPATCHED }),
  ]);

  // Revenue & distance from completed trips
  const tripAgg = await Trip.aggregate([
    { $match: { status: TRIP_STATUS.COMPLETED } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$revenue' },
        totalDistance: { $sum: '$distanceKm' },
      },
    },
  ]);

  // Total expenses
  const expenseAgg = await Expense.aggregate([
    { $group: { _id: null, totalCost: { $sum: '$cost' } } },
  ]);

  // Total maintenance cost
  const maintenanceAgg = await MaintenanceLog.aggregate([
    { $group: { _id: null, totalCost: { $sum: '$cost' } } },
  ]);

  const totalRevenue = tripAgg[0]?.totalRevenue || 0;
  const totalDistance = tripAgg[0]?.totalDistance || 0;
  const totalExpenses = expenseAgg[0]?.totalCost || 0;
  const totalMaintenanceCost = maintenanceAgg[0]?.totalCost || 0;

  const activeFleetCount = totalVehicles - retiredVehicles;
  const utilizationRate =
    activeFleetCount > 0
      ? ((onTripVehicles / activeFleetCount) * 100).toFixed(1)
      : 0;

  return {
    fleet: {
      totalVehicles,
      activeFleetCount,
      availableVehicles,
      onTripVehicles,
      inShopVehicles,
      retiredVehicles,
      utilizationRate: `${utilizationRate}%`,
    },
    drivers: {
      totalDrivers,
      availableDrivers,
    },
    trips: {
      totalTrips,
      completedTrips,
      activeTrips,
      totalDistanceKm: totalDistance,
    },
    financials: {
      totalRevenue,
      totalExpenses,
      totalMaintenanceCost,
      netProfit: totalRevenue - totalExpenses - totalMaintenanceCost,
    },
  };
};

/**
 * Vehicle ROI calculation.
 * ROI = (Revenue – Costs) / AcquisitionCost × 100
 */
const getVehicleROI = async (vehicleId) => {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) return null;

  const objectId = new mongoose.Types.ObjectId(vehicleId);

  // Revenue from completed trips
  const tripAgg = await Trip.aggregate([
    { $match: { vehicle: objectId, status: TRIP_STATUS.COMPLETED } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$revenue' },
        totalDistance: { $sum: '$distanceKm' },
        tripCount: { $sum: 1 },
      },
    },
  ]);

  // Total expenses
  const expenseAgg = await Expense.aggregate([
    { $match: { vehicle: objectId } },
    { $group: { _id: null, totalCost: { $sum: '$cost' } } },
  ]);

  // Total maintenance cost
  const maintenanceAgg = await MaintenanceLog.aggregate([
    { $match: { vehicle: objectId } },
    { $group: { _id: null, totalCost: { $sum: '$cost' } } },
  ]);

  const totalRevenue = tripAgg[0]?.totalRevenue || 0;
  const totalDistance = tripAgg[0]?.totalDistance || 0;
  const tripCount = tripAgg[0]?.tripCount || 0;
  const totalExpenses = expenseAgg[0]?.totalCost || 0;
  const totalMaintenanceCost = maintenanceAgg[0]?.totalCost || 0;
  const totalCosts = totalExpenses + totalMaintenanceCost;

  const acquisitionCost = vehicle.acquisitionCost || 0;
  const roi =
    acquisitionCost > 0
      ? (((totalRevenue - totalCosts) / acquisitionCost) * 100).toFixed(2)
      : 'N/A';

  return {
    vehicle: {
      _id: vehicle._id,
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      acquisitionCost,
      odometer: vehicle.odometer,
      status: vehicle.status,
    },
    metrics: {
      totalRevenue,
      totalExpenses,
      totalMaintenanceCost,
      totalCosts,
      netProfit: totalRevenue - totalCosts,
      roi: roi === 'N/A' ? roi : `${roi}%`,
      tripCount,
      totalDistanceKm: totalDistance,
    },
  };
};

/**
 * Fuel efficiency for a vehicle.
 * Fuel Efficiency = Total Distance / Total Liters
 */
const getFuelEfficiency = async (vehicleId) => {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) return null;

  const objectId = new mongoose.Types.ObjectId(vehicleId);

  // Total distance from completed trips
  const tripAgg = await Trip.aggregate([
    { $match: { vehicle: objectId, status: TRIP_STATUS.COMPLETED } },
    { $group: { _id: null, totalDistance: { $sum: '$distanceKm' } } },
  ]);

  // Total fuel liters
  const fuelAgg = await Expense.aggregate([
    { $match: { vehicle: objectId, type: 'Fuel' } },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: '$liters' },
        totalFuelCost: { $sum: '$cost' },
        refuelCount: { $sum: 1 },
      },
    },
  ]);

  const totalDistance = tripAgg[0]?.totalDistance || 0;
  const totalLiters = fuelAgg[0]?.totalLiters || 0;
  const totalFuelCost = fuelAgg[0]?.totalFuelCost || 0;
  const refuelCount = fuelAgg[0]?.refuelCount || 0;

  const fuelEfficiency =
    totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : 'N/A';

  const costPerKm =
    totalDistance > 0 ? (totalFuelCost / totalDistance).toFixed(2) : 'N/A';

  return {
    vehicle: {
      _id: vehicle._id,
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      odometer: vehicle.odometer,
    },
    fuelMetrics: {
      totalDistanceKm: totalDistance,
      totalLiters,
      totalFuelCost,
      refuelCount,
      fuelEfficiencyKmPerLiter: fuelEfficiency === 'N/A' ? fuelEfficiency : `${fuelEfficiency} km/L`,
      costPerKm: costPerKm === 'N/A' ? costPerKm : `$${costPerKm}/km`,
    },
  };
};

module.exports = {
  getDashboardMetrics,
  getVehicleROI,
  getFuelEfficiency,
};
