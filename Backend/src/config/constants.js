module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'fleetflow_dev_secret_change_in_prod',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  BCRYPT_SALT_ROUNDS: 12,
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  ROLES: {
    FLEET_MANAGER: 'fleet_manager',
    DISPATCHER: 'dispatcher',
    SAFETY_OFFICER: 'safety_officer',
    FINANCIAL_ANALYST: 'financial_analyst',
  },
  VEHICLE_STATUS: {
    AVAILABLE: 'Available',
    ON_TRIP: 'OnTrip',
    IN_SHOP: 'InShop',
    RETIRED: 'Retired',
    OUT_OF_SERVICE: 'OutOfService',
  },
  DRIVER_STATUS: {
    AVAILABLE: 'Available',
    ON_TRIP: 'OnTrip',
    OFF_DUTY: 'OffDuty',
    SUSPENDED: 'Suspended',
  },
  TRIP_STATUS: {
    DRAFT: 'Draft',
    DISPATCHED: 'Dispatched',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  },
  EXPENSE_TYPES: ['Fuel', 'Toll', 'Misc'],
};
