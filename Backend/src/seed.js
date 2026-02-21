/**
 * 🌱 FleetFlow Database Seeder
 *
 * Seeds the database with realistic sample data:
 *   - 4 Users (one per role)
 *   - 10 Vehicles (various statuses)
 *   - 8 Drivers (various statuses & safety scores)
 *   - 12 Trips (mix of Draft, Dispatched, Completed, Cancelled)
 *   - 6 Maintenance Logs
 *   - 15 Expenses (Fuel, Toll, Misc)
 *
 * Usage:
 *   node src/seed.js          → seed the database
 *   node src/seed.js --clear  → clear all collections only
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Driver = require('./models/Driver');
const Trip = require('./models/Trip');
const MaintenanceLog = require('./models/MaintenanceLog');
const Expense = require('./models/Expense');

const MONGO_URI = process.env.MONGO_URI;

// ───────────────────── USERS ─────────────────────
const users = [
  {
    name: 'John Admin',
    email: 'admin@fleetflow.com',
    password: 'securePass123',
    role: 'fleet_manager',
  },
  {
    name: 'Sarah Dispatcher',
    email: 'dispatcher@fleetflow.com',
    password: 'securePass123',
    role: 'dispatcher',
  },
  {
    name: 'Tom SafetyOfficer',
    email: 'safety@fleetflow.com',
    password: 'securePass123',
    role: 'safety_officer',
  },
  {
    name: 'Lisa Analyst',
    email: 'analyst@fleetflow.com',
    password: 'securePass123',
    role: 'financial_analyst',
  },
];

// ───────────────────── VEHICLES ─────────────────────
const vehicles = [
  { name: 'Volvo FH16', model: 'FH16 2024', licensePlate: 'FL-1001', vehicleType: 'Truck', maxLoadCapacity: 25000, odometer: 45230, acquisitionCost: 120000, status: 'Available' },
  { name: 'Scania R500', model: 'R500 Next Gen', licensePlate: 'FL-1002', vehicleType: 'Truck', maxLoadCapacity: 22000, odometer: 78500, acquisitionCost: 115000, status: 'Available' },
  { name: 'Mercedes Actros', model: 'Actros 2653', licensePlate: 'FL-1003', vehicleType: 'Refrigerated', maxLoadCapacity: 28000, odometer: 32100, acquisitionCost: 135000, status: 'Available' },
  { name: 'MAN TGX', model: 'TGX 18.510', licensePlate: 'FL-1004', vehicleType: 'Flatbed', maxLoadCapacity: 20000, odometer: 91200, acquisitionCost: 105000, status: 'On Trip' },
  { name: 'DAF XF', model: 'XF 480', licensePlate: 'FL-1005', vehicleType: 'Truck', maxLoadCapacity: 24000, odometer: 55400, acquisitionCost: 110000, status: 'On Trip' },
  { name: 'Iveco S-Way', model: 'S-Way AS440', licensePlate: 'FL-1006', vehicleType: 'Tanker', maxLoadCapacity: 19000, odometer: 120800, acquisitionCost: 98000, status: 'In Shop' },
  { name: 'Kenworth T680', model: 'T680 Next Gen', licensePlate: 'FL-1007', vehicleType: 'Trailer', maxLoadCapacity: 30000, odometer: 67300, acquisitionCost: 145000, status: 'Available' },
  { name: 'Peterbilt 579', model: '579 UltraLoft', licensePlate: 'FL-1008', vehicleType: 'Truck', maxLoadCapacity: 27000, odometer: 152000, acquisitionCost: 140000, status: 'Out of Service' },
  { name: 'Freightliner Cascadia', model: 'Cascadia 2025', licensePlate: 'FL-1009', vehicleType: 'Van', maxLoadCapacity: 26000, odometer: 8900, acquisitionCost: 130000, status: 'Available' },
  { name: 'International LT', model: 'LT Series', licensePlate: 'FL-1010', vehicleType: 'Pickup', maxLoadCapacity: 23000, odometer: 185000, acquisitionCost: 95000, status: 'Retired' },
];

// ───────────────────── DRIVERS ─────────────────────
// ───────────────────── DRIVERS ─────────────────────
const drivers = [
  { name: 'Mike Johnson', email: 'mike@fleetflow.com', phone: '+1-555-0101', licenseNumber: 'DL-2024-1001', licenseExpiryDate: '2027-08-15', licenseCategory: 'Class A CDL', safetyScore: 95, performance: 'Excellent', status: 'Available' },
  { name: 'Carlos Rivera', email: 'carlos@fleetflow.com', phone: '+1-555-0102', licenseNumber: 'DL-2024-1002', licenseExpiryDate: '2028-03-22', licenseCategory: 'Class A CDL', safetyScore: 88, performance: 'Good', status: 'Available' },
  { name: 'James O\'Brien', email: 'james@fleetflow.com', phone: '+1-555-0103', licenseNumber: 'DL-2024-1003', licenseExpiryDate: '2027-11-30', licenseCategory: 'Class B CDL', safetyScore: 72, performance: 'Average', status: 'On Trip' },
  { name: 'David Chen', email: 'david@fleetflow.com', phone: '+1-555-0104', licenseNumber: 'DL-2024-1004', licenseExpiryDate: '2026-12-01', licenseCategory: 'Class A CDL', safetyScore: 91, performance: 'Excellent', status: 'On Trip' },
  { name: 'Ahmed Hassan', email: 'ahmed@fleetflow.com', phone: '+1-555-0105', licenseNumber: 'DL-2024-1005', licenseExpiryDate: '2026-05-10', licenseCategory: 'Class A CDL', safetyScore: 65, performance: 'Below Average', status: 'Available' },
  { name: 'Bob Wilson', email: 'bob@fleetflow.com', phone: '+1-555-0106', licenseNumber: 'DL-2024-1006', licenseExpiryDate: '2025-11-20', licenseCategory: 'Class B CDL', safetyScore: 38, performance: 'Poor', status: 'Suspended' },
  { name: 'Elena Volkov', email: 'elena@fleetflow.com', phone: '+1-555-0107', licenseNumber: 'DL-2024-1007', licenseExpiryDate: '2028-07-05', licenseCategory: 'Class A CDL', safetyScore: 97, performance: 'Excellent', status: 'Off Duty' },
  { name: 'Ryan Patel', email: 'ryan@fleetflow.com', phone: '+1-555-0108', licenseNumber: 'DL-2024-1008', licenseExpiryDate: '2026-03-15', licenseCategory: 'Class A CDL', safetyScore: 82, performance: 'Good', status: 'Available' },
  { name: 'Marcus Thompson', email: 'marcus@fleetflow.com', phone: '+1-555-0109', licenseNumber: 'DL-2024-1009', licenseExpiryDate: '2024-12-15', licenseCategory: 'Class A CDL', safetyScore: 90, status: 'Available' },
];

// ───────────────────── SEED FUNCTION ─────────────────────
const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('📦 Connected to MongoDB');

    // ── Clear existing data ──
    await Promise.all([
      User.deleteMany({}),
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      Trip.deleteMany({}),
      MaintenanceLog.deleteMany({}),
      Expense.deleteMany({}),
    ]);
    console.log('🗑️  Cleared all collections');

    if (process.argv.includes('--clear')) {
      console.log('✅ Database cleared. Exiting.');
      process.exit(0);
    }

    // ── Seed Users ──
    const createdUsers = await User.create(users);
    console.log(`👤 Seeded ${createdUsers.length} users`);

    // ── Seed Vehicles ──
    const createdVehicles = await Vehicle.insertMany(vehicles);
    console.log(`🚛 Seeded ${createdVehicles.length} vehicles`);

    // ── Seed Drivers ──
    const createdDrivers = await Driver.insertMany(drivers);
    console.log(`🧑‍✈️ Seeded ${createdDrivers.length} drivers`);

    // ── Map for easy reference ──
    const v = (plate) => createdVehicles.find((v) => v.licensePlate === plate)._id;
    const d = (name) => createdDrivers.find((dr) => dr.name === name)._id;

    // ── Seed Trips ──
    const now = new Date();
    const daysAgo = (n) => new Date(now.getTime() - n * 86400000);

    const trips = [
      // Completed trips
      { vehicle: v('FL-1001'), driver: d('Mike Johnson'), cargoWeight: 18000, origin: 'Chicago, IL', destination: 'Detroit, MI', distanceKm: 450, revenue: 3200, status: 'Completed', dispatchedAt: daysAgo(15), completedAt: daysAgo(14), createdAt: daysAgo(16) },
      { vehicle: v('FL-1002'), driver: d('Carlos Rivera'), cargoWeight: 15500, origin: 'Los Angeles, CA', destination: 'Phoenix, AZ', distanceKm: 600, revenue: 4100, status: 'Completed', dispatchedAt: daysAgo(12), completedAt: daysAgo(11), createdAt: daysAgo(13) },
      { vehicle: v('FL-1003'), driver: d('Mike Johnson'), cargoWeight: 22000, origin: 'Houston, TX', destination: 'Dallas, TX', distanceKm: 380, revenue: 2800, status: 'Completed', dispatchedAt: daysAgo(10), completedAt: daysAgo(9), createdAt: daysAgo(11) },
      { vehicle: v('FL-1007'), driver: d('Ahmed Hassan'), cargoWeight: 12000, origin: 'Seattle, WA', destination: 'Portland, OR', distanceKm: 280, revenue: 1950, status: 'Completed', dispatchedAt: daysAgo(8), completedAt: daysAgo(7), createdAt: daysAgo(9) },
      { vehicle: v('FL-1009'), driver: d('Carlos Rivera'), cargoWeight: 20000, origin: 'Atlanta, GA', destination: 'Nashville, TN', distanceKm: 400, revenue: 3500, status: 'Completed', dispatchedAt: daysAgo(6), completedAt: daysAgo(5), createdAt: daysAgo(7) },
      { vehicle: v('FL-1001'), driver: d('Ryan Patel'), cargoWeight: 16000, origin: 'Denver, CO', destination: 'Salt Lake City, UT', distanceKm: 820, revenue: 5600, status: 'Completed', dispatchedAt: daysAgo(4), completedAt: daysAgo(3), createdAt: daysAgo(5) },

      // Dispatched (active) trips — these match the On Trip vehicles & drivers
      { vehicle: v('FL-1004'), driver: d('James O\'Brien'), cargoWeight: 14000, origin: 'Miami, FL', destination: 'Orlando, FL', distanceKm: 380, revenue: 2600, status: 'Dispatched', dispatchedAt: daysAgo(1), createdAt: daysAgo(2) },
      { vehicle: v('FL-1005'), driver: d('David Chen'), cargoWeight: 19500, origin: 'San Francisco, CA', destination: 'Sacramento, CA', distanceKm: 150, revenue: 1200, status: 'Dispatched', dispatchedAt: daysAgo(0), createdAt: daysAgo(1) },

      // Draft trips
      { vehicle: v('FL-1001'), driver: d('Mike Johnson'), cargoWeight: 17000, origin: 'Boston, MA', destination: 'New York, NY', distanceKm: 340, revenue: 2400, status: 'Draft', createdAt: daysAgo(0) },
      { vehicle: v('FL-1002'), driver: d('Carlos Rivera'), cargoWeight: 21000, origin: 'Philadelphia, PA', destination: 'Washington, DC', distanceKm: 225, revenue: 1800, status: 'Draft', createdAt: daysAgo(0) },

      // Cancelled trips
      { vehicle: v('FL-1003'), driver: d('Ahmed Hassan'), cargoWeight: 25000, origin: 'Minneapolis, MN', destination: 'Milwaukee, WI', distanceKm: 540, revenue: 3800, status: 'Cancelled', cancelledAt: daysAgo(3), createdAt: daysAgo(5) },
      { vehicle: v('FL-1007'), driver: d('Ryan Patel'), cargoWeight: 10000, origin: 'Columbus, OH', destination: 'Pittsburgh, PA', distanceKm: 260, revenue: 1600, status: 'Cancelled', cancelledAt: daysAgo(1), createdAt: daysAgo(2) },
    ];

    const createdTrips = await Trip.insertMany(trips);
    console.log(`🗺️  Seeded ${createdTrips.length} trips`);

    // ── Seed Maintenance Logs ──
    const maintenanceLogs = [
      // Open log for the In Shop vehicle (FL-1006)
      { vehicle: v('FL-1006'), type: 'Engine Overhaul', cost: 4500, date: daysAgo(3), notes: 'Major engine rebuild at 120k km', isCompleted: false },
      { vehicle: v('FL-1006'), type: 'Brake System Inspection', cost: 800, date: daysAgo(2), notes: 'Front and rear brake pad replacement', isCompleted: false },

      // Completed logs
      { vehicle: v('FL-1001'), type: 'Oil Change', cost: 350, date: daysAgo(20), notes: 'Routine 10k km oil service', isCompleted: true, completedAt: daysAgo(19) },
      { vehicle: v('FL-1002'), type: 'Tire Rotation', cost: 600, date: daysAgo(18), notes: 'All 18 tires inspected and rotated', isCompleted: true, completedAt: daysAgo(17) },
      { vehicle: v('FL-1003'), type: 'Transmission Service', cost: 2200, date: daysAgo(25), notes: 'Fluid flush and filter replacement', isCompleted: true, completedAt: daysAgo(23) },
      { vehicle: v('FL-1007'), type: 'AC System Repair', cost: 950, date: daysAgo(30), notes: 'Compressor replacement and recharge', isCompleted: true, completedAt: daysAgo(28) },
    ];

    const createdMaintenance = await MaintenanceLog.insertMany(maintenanceLogs);
    console.log(`🔧 Seeded ${createdMaintenance.length} maintenance logs`);

    // ── Seed Expenses ──
    const expenses = [
      // Fuel expenses
      { vehicle: v('FL-1001'), liters: 120, cost: 210, date: daysAgo(14), type: 'Fuel' },
      { vehicle: v('FL-1001'), liters: 135, cost: 236, date: daysAgo(3), type: 'Fuel' },
      { vehicle: v('FL-1002'), liters: 110, cost: 192, date: daysAgo(11), type: 'Fuel' },
      { vehicle: v('FL-1003'), liters: 145, cost: 254, date: daysAgo(9), type: 'Fuel' },
      { vehicle: v('FL-1004'), liters: 100, cost: 175, date: daysAgo(1), type: 'Fuel' },
      { vehicle: v('FL-1005'), liters: 95, cost: 166, date: daysAgo(0), type: 'Fuel' },
      { vehicle: v('FL-1007'), liters: 155, cost: 271, date: daysAgo(7), type: 'Fuel' },
      { vehicle: v('FL-1009'), liters: 130, cost: 228, date: daysAgo(5), type: 'Fuel' },

      // Toll expenses
      { vehicle: v('FL-1001'), liters: 0, cost: 45, date: daysAgo(14), type: 'Toll' },
      { vehicle: v('FL-1002'), liters: 0, cost: 62, date: daysAgo(11), type: 'Toll' },
      { vehicle: v('FL-1003'), liters: 0, cost: 38, date: daysAgo(9), type: 'Toll' },
      { vehicle: v('FL-1009'), liters: 0, cost: 55, date: daysAgo(5), type: 'Toll' },

      // Misc expenses
      { vehicle: v('FL-1004'), liters: 0, cost: 120, date: daysAgo(6), type: 'Misc' },
      { vehicle: v('FL-1008'), liters: 0, cost: 350, date: daysAgo(10), type: 'Misc' },
      { vehicle: v('FL-1001'), liters: 0, cost: 85, date: daysAgo(2), type: 'Misc' },
    ];

    const createdExpenses = await Expense.insertMany(expenses);
    console.log(`💰 Seeded ${createdExpenses.length} expenses`);

    // ── Summary ──
    console.log('\n═══════════════════════════════════════');
    console.log('  ✅ Database seeded successfully!');
    console.log('═══════════════════════════════════════');
    console.log('\n📋 Login credentials (all passwords: securePass123):');
    console.log('┌────────────────────────┬──────────────────────────┬────────────────────┐');
    console.log('│ Name                   │ Email                    │ Role               │');
    console.log('├────────────────────────┼──────────────────────────┼────────────────────┤');
    console.log('│ John Admin             │ admin@fleetflow.com      │ fleet_manager      │');
    console.log('│ Sarah Dispatcher       │ dispatcher@fleetflow.com │ dispatcher         │');
    console.log('│ Tom SafetyOfficer      │ safety@fleetflow.com     │ safety_officer     │');
    console.log('│ Lisa Analyst           │ analyst@fleetflow.com    │ financial_analyst  │');
    console.log('└────────────────────────┴──────────────────────────┴────────────────────┘');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
