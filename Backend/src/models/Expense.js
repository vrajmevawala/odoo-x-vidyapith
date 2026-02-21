const mongoose = require('mongoose');
const { EXPENSE_TYPES } = require('../config/constants');

const expenseSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    liters: {
      type: Number,
      min: [0, 'Liters must be positive'],
      default: 0,
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost must be positive'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: {
        values: EXPENSE_TYPES,
        message: 'Invalid expense type: {VALUE}',
      },
      required: [true, 'Expense type is required'],
    },
  },
  { timestamps: true }
);

// Indexes
expenseSchema.index({ vehicle: 1 });
expenseSchema.index({ type: 1 });
expenseSchema.index({ date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
