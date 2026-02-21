module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'fleetflow_dev_secret_change_in_prod',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  PORT: process.env.PORT || 5001,
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
    ON_TRIP: 'On Trip',
    IN_SHOP: 'In Shop',
    RETIRED: 'Retired',
    OUT_OF_SERVICE: 'Out of Service',
  },
  DRIVER_STATUS: {
    AVAILABLE: 'Available',
    ON_TRIP: 'On Trip',
    OFF_DUTY: 'Off Duty',
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
