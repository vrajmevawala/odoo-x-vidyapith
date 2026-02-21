const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    type: {
      type: String,
      required: [true, 'Maintenance type is required'],
      trim: true,
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
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
  },
  { timestamps: true }
);

// Indexes
maintenanceLogSchema.index({ vehicle: 1 });
maintenanceLogSchema.index({ isCompleted: 1 });
maintenanceLogSchema.index({ date: -1 });

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
