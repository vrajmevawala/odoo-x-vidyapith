const prisma = require('../config/prisma');
const { DRIVER_STATUS, VEHICLE_STATUS } = require('../config/constants');

const getExpiredLicenseDrivers = async () => {
  const now = new Date();
  return prisma.driver.findMany({
    where: {
      licenseExpiryDate: { lt: now },
      status: { not: DRIVER_STATUS.SUSPENDED },
    },
  });
};

const getExpiringLicenseDrivers = async (days = 30) => {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  return prisma.driver.findMany({
    where: {
      licenseExpiryDate: { gte: now, lte: future },
    },
  });
};

const getVehiclesNeedingAttention = async (odometerThreshold = 100000) => {
  return prisma.vehicle.findMany({
    where: {
      status: { not: VEHICLE_STATUS.RETIRED },
      odometer: { gte: odometerThreshold },
    },
  });
};

const getLowSafetyScoreDrivers = async (threshold = 50) => {
  return prisma.driver.findMany({
    where: {
      safetyScore: { lte: threshold },
      status: { not: DRIVER_STATUS.SUSPENDED },
    },
  });
};

const getComplianceReport = async () => {
  const [expiredLicenses, expiringLicenses, highMileageVehicles, lowSafetyDrivers] =
    await Promise.all([
      getExpiredLicenseDrivers(),
      getExpiringLicenseDrivers(30),
      getVehiclesNeedingAttention(100000),
      getLowSafetyScoreDrivers(70),
    ]);

  return {
    expiredLicenses: {
      count: expiredLicenses.length,
      drivers: expiredLicenses.map((d) => ({
        id: d.id, name: d.name, licenseExpiryDate: d.licenseExpiryDate, status: d.status,
      })),
    },
    expiringLicensesNext30Days: {
      count: expiringLicenses.length,
      drivers: expiringLicenses.map((d) => ({
        id: d.id, name: d.name, licenseExpiryDate: d.licenseExpiryDate,
      })),
    },
    highMileageVehicles: {
      count: highMileageVehicles.length,
      vehicles: highMileageVehicles.map((v) => ({
        id: v.id, name: v.name, licensePlate: v.licensePlate, odometer: v.odometer,
      })),
    },
    lowSafetyScoreDrivers: {
      count: lowSafetyDrivers.length,
      drivers: lowSafetyDrivers.map((d) => ({
        id: d.id, name: d.name, email: d.email, safetyScore: d.safetyScore,
      })),
    },
  };
};

module.exports = {
  getExpiredLicenseDrivers,
  getExpiringLicenseDrivers,
  getVehiclesNeedingAttention,
  getLowSafetyScoreDrivers,
  getComplianceReport,
};
