const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const { NotFoundError } = require('../utils/AppError');
const { buildQueryOptions, paginationMeta } = require('../utils/queryHelpers');

/**
 * @desc    Get all expenses
 * @route   GET /api/expenses
 * @access  Private
 */
const getExpenses = asyncHandler(async (req, res) => {
  const { filter, sort, skip, limit, page } = buildQueryOptions(req.query, [
    'vehicle',
    'type',
  ]);

  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .populate('vehicle', 'name licensePlate')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Expense.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    results: expenses,
    pagination: paginationMeta(total, page, limit),
  });
});

/**
 * @desc    Create expense
 * @route   POST /api/expenses
 * @access  Private (fleet_manager, financial_analyst)
 */
const createExpense = asyncHandler(async (req, res) => {
  const { vehicle: vehicleId } = req.body;

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  const expense = await Expense.create(req.body);
  const populated = await Expense.findById(expense._id).populate(
    'vehicle',
    'name licensePlate'
  );

  sendResponse(res, 201, populated, 'Expense recorded successfully');
});

/**
 * @desc    Get expenses for a specific vehicle
 * @route   GET /api/expenses/vehicle/:vehicleId
 * @access  Private
 */
const getExpensesByVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.vehicleId);
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  const { sort, skip, limit, page } = buildQueryOptions(req.query, []);

  const filter = { vehicle: req.params.vehicleId };

  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .populate('vehicle', 'name licensePlate')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Expense.countDocuments(filter),
  ]);

  // Aggregate total cost
  const aggregation = await Expense.aggregate([
    { $match: { vehicle: vehicle._id } },
    {
      $group: {
        _id: '$type',
        totalCost: { $sum: '$cost' },
        totalLiters: { $sum: '$liters' },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalOperationalCost = aggregation.reduce((sum, g) => sum + g.totalCost, 0);

  sendResponse(res, 200, {
    results: expenses,
    pagination: paginationMeta(total, page, limit),
    summary: {
      totalOperationalCost,
      byType: aggregation,
    },
  });
});

module.exports = {
  getExpenses,
  createExpense,
  getExpensesByVehicle,
};
