const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const { DRIVER_STATUS, VEHICLE_STATUS } = require('../config/constants');

/**
 * Get drivers with expired licenses.
 */
const getExpiredLicenseDrivers = async () => {
  const now = new Date();
  return Driver.find({
    licenseExpiryDate: { $lt: now },
    status: { $ne: DRIVER_STATUS.SUSPENDED },
  });
};

/**
 * Get drivers whose license expires within N days.
 */
const getExpiringLicenseDrivers = async (days = 30) => {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  return Driver.find({
    licenseExpiryDate: { $gte: now, $lte: future },
  });
};

/**
 * Get vehicles that may need attention (low safety / high mileage).
 */
const getVehiclesNeedingAttention = async (odometerThreshold = 100000) => {
  return Vehicle.find({
    status: { $ne: VEHICLE_STATUS.RETIRED },
    odometer: { $gte: odometerThreshold },
  });
};

/**
 * Get drivers with low safety scores.
 */
const getLowSafetyScoreDrivers = async (threshold = 50) => {
  return Driver.find({
    safetyScore: { $lte: threshold },
    status: { $ne: DRIVER_STATUS.SUSPENDED },
  });
};

/**
 * Full compliance report.
 */
const getComplianceReport = async () => {
  const [
    expiredLicenses,
    expiringLicenses,
    highMileageVehicles,
    lowSafetyDrivers,
  ] = await Promise.all([
    getExpiredLicenseDrivers(),
    getExpiringLicenseDrivers(30),
    getVehiclesNeedingAttention(100000),
    getLowSafetyScoreDrivers(50),
  ]);

  return {
    expiredLicenses: {
      count: expiredLicenses.length,
      drivers: expiredLicenses.map((d) => ({
        _id: d._id,
        name: d.name,
        licenseExpiryDate: d.licenseExpiryDate,
        status: d.status,
      })),
    },
    expiringLicensesNext30Days: {
      count: expiringLicenses.length,
      drivers: expiringLicenses.map((d) => ({
        _id: d._id,
        name: d.name,
        licenseExpiryDate: d.licenseExpiryDate,
      })),
    },
    highMileageVehicles: {
      count: highMileageVehicles.length,
      vehicles: highMileageVehicles.map((v) => ({
        _id: v._id,
        name: v.name,
        licensePlate: v.licensePlate,
        odometer: v.odometer,
      })),
    },
    lowSafetyScoreDrivers: {
      count: lowSafetyDrivers.length,
      drivers: lowSafetyDrivers.map((d) => ({
        _id: d._id,
        name: d.name,
        safetyScore: d.safetyScore,
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
