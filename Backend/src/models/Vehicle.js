const mongoose = require('mongoose');
const { VEHICLE_STATUS } = require('../config/constants');

const vehicleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    model: {
      type: String,
      trim: true,
      maxlength: [120, 'Model cannot exceed 120 characters'],
    },
    vehicleType: {
      type: String,
      enum: ['Truck', 'Van', 'Trailer', 'Bus', 'Pickup', 'Tanker', 'Flatbed', 'Refrigerated'],
      default: 'Truck',
    },
    licensePlate: {
      type: String,
      required: [true, 'License plate is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    maxLoadCapacity: {
      type: Number,
      required: [true, 'Max load capacity is required'],
      min: [0, 'Max load capacity must be positive'],
    },
    odometer: {
      type: Number,
      default: 0,
      min: [0, 'Odometer cannot be negative'],
    },
    acquisitionCost: {
      type: Number,
      default: 0,
      min: [0, 'Acquisition cost cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(VEHICLE_STATUS),
        message: 'Invalid vehicle status: {VALUE}',
      },
      default: VEHICLE_STATUS.AVAILABLE,
    },
  },
  { timestamps: true }
);

// Indexes
vehicleSchema.index({ status: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
