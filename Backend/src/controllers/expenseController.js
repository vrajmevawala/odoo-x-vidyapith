const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const { NotFoundError } = require('../utils/AppError');
const { buildQueryOptions, paginationMeta } = require('../utils/queryHelpers');

const EXP_INCLUDE = {
  vehicle: { select: { id: true, name: true, licensePlate: true } },
};

const getExpenses = asyncHandler(async (req, res) => {
  const { where, orderBy, skip, take, page } = buildQueryOptions(req.query, [
    'vehicleId', 'type',
  ]);

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({ where, orderBy, skip, take, include: EXP_INCLUDE }),
    prisma.expense.count({ where }),
  ]);

  sendResponse(res, 200, {
    results: expenses,
    pagination: paginationMeta(total, page, take),
  });
});

const createExpense = asyncHandler(async (req, res) => {
  const { vehicle: vehicleId, type, cost, liters, date } = req.body;

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  const expense = await prisma.expense.create({
    data: {
      vehicleId,
      type,
      cost: Number(cost),
      liters: liters ? Number(liters) : 0,
      date: date ? new Date(date) : new Date(),
    },
    include: EXP_INCLUDE,
  });

  sendResponse(res, 201, expense, 'Expense recorded successfully');
});

const getExpensesByVehicle = asyncHandler(async (req, res) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.vehicleId } });
  if (!vehicle) throw new NotFoundError('Vehicle not found');

  const { orderBy, skip, take, page } = buildQueryOptions(req.query, []);

  const where = { vehicleId: req.params.vehicleId };

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({ where, orderBy, skip, take, include: EXP_INCLUDE }),
    prisma.expense.count({ where }),
  ]);

  // Aggregate by type
  const aggregation = await prisma.expense.groupBy({
    by: ['type'],
    where: { vehicleId: req.params.vehicleId },
    _sum: { cost: true, liters: true },
    _count: true,
  });

  const byType = aggregation.map((g) => ({
    _id: g.type,
    totalCost: g._sum.cost || 0,
    totalLiters: g._sum.liters || 0,
    count: g._count,
  }));

  const totalOperationalCost = byType.reduce((sum, g) => sum + g.totalCost, 0);

  sendResponse(res, 200, {
    results: expenses,
    pagination: paginationMeta(total, page, take),
    summary: { totalOperationalCost, byType },
  });
});

module.exports = { getExpenses, createExpense, getExpensesByVehicle };
