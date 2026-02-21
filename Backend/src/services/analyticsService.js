const prisma = require('../config/prisma');
const { VEHICLE_STATUS, DRIVER_STATUS, TRIP_STATUS } = require('../config/constants');

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
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: VEHICLE_STATUS.AVAILABLE } }),
    prisma.vehicle.count({ where: { status: VEHICLE_STATUS.ON_TRIP } }),
    prisma.vehicle.count({ where: { status: VEHICLE_STATUS.IN_SHOP } }),
    prisma.vehicle.count({ where: { status: VEHICLE_STATUS.RETIRED } }),
    prisma.driver.count(),
    prisma.driver.count({ where: { status: DRIVER_STATUS.AVAILABLE } }),
    prisma.trip.count(),
    prisma.trip.count({ where: { status: TRIP_STATUS.COMPLETED } }),
    prisma.trip.count({ where: { status: TRIP_STATUS.DISPATCHED } }),
  ]);

  const tripAgg = await prisma.trip.aggregate({
    where: { status: TRIP_STATUS.COMPLETED },
    _sum: { revenue: true, distanceKm: true },
  });

  const expenseAgg = await prisma.expense.aggregate({
    _sum: { cost: true },
  });

  const maintenanceAgg = await prisma.maintenanceLog.aggregate({
    _sum: { cost: true },
  });

  const totalRevenue = tripAgg._sum.revenue || 0;
  const totalDistance = tripAgg._sum.distanceKm || 0;
  const totalExpenses = expenseAgg._sum.cost || 0;
  const totalMaintenanceCost = maintenanceAgg._sum.cost || 0;

  const activeFleetCount = totalVehicles - retiredVehicles;
  const utilizationRate = activeFleetCount > 0
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
    drivers: { totalDrivers, availableDrivers },
    trips: { totalTrips, completedTrips, activeTrips, totalDistanceKm: totalDistance },
    financials: {
      totalRevenue,
      totalExpenses,
      totalMaintenanceCost,
      netProfit: totalRevenue - totalExpenses - totalMaintenanceCost,
    },
  };
};

const getVehicleROI = async (vehicleId) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return null;

  const tripAgg = await prisma.trip.aggregate({
    where: { vehicleId, status: TRIP_STATUS.COMPLETED },
    _sum: { revenue: true, distanceKm: true },
    _count: true,
  });

  const expenseAgg = await prisma.expense.aggregate({
    where: { vehicleId },
    _sum: { cost: true },
  });

  const maintenanceAgg = await prisma.maintenanceLog.aggregate({
    where: { vehicleId },
    _sum: { cost: true },
  });

  const totalRevenue = tripAgg._sum.revenue || 0;
  const totalDistance = tripAgg._sum.distanceKm || 0;
  const tripCount = tripAgg._count || 0;
  const totalExpenses = expenseAgg._sum.cost || 0;
  const totalMaintenanceCost = maintenanceAgg._sum.cost || 0;
  const totalCosts = totalExpenses + totalMaintenanceCost;

  const acquisitionCost = vehicle.acquisitionCost || 0;
  const roi = acquisitionCost > 0
    ? (((totalRevenue - totalCosts) / acquisitionCost) * 100).toFixed(2)
    : 'N/A';

  return {
    vehicle: {
      id: vehicle.id,
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

const getFuelEfficiency = async (vehicleId) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return null;

  const tripAgg = await prisma.trip.aggregate({
    where: { vehicleId, status: TRIP_STATUS.COMPLETED },
    _sum: { distanceKm: true },
  });

  const fuelAgg = await prisma.expense.aggregate({
    where: { vehicleId, type: 'Fuel' },
    _sum: { liters: true, cost: true },
    _count: true,
  });

  const totalDistance = tripAgg._sum.distanceKm || 0;
  const totalLiters = fuelAgg._sum.liters || 0;
  const totalFuelCost = fuelAgg._sum.cost || 0;
  const refuelCount = fuelAgg._count || 0;

  const fuelEfficiency = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : 'N/A';
  const costPerKm = totalDistance > 0 ? (totalFuelCost / totalDistance).toFixed(2) : 'N/A';

  return {
    vehicle: {
      id: vehicle.id,
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

module.exports = { getDashboardMetrics, getVehicleROI, getFuelEfficiency };
