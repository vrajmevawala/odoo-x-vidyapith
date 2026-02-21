const mongoose = require('mongoose');
const { DRIVER_STATUS } = require('../config/constants');

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      trim: true,
    },
    licenseExpiryDate: {
      type: Date,
      required: [true, 'License expiry date is required'],
    },
    licenseCategory: {
      type: String,
      trim: true,
    },
    safetyScore: {
      type: Number,
      default: 100,
      min: [0, 'Safety score cannot be below 0'],
      max: [100, 'Safety score cannot exceed 100'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(DRIVER_STATUS),
        message: 'Invalid driver status: {VALUE}',
      },
      default: DRIVER_STATUS.AVAILABLE,
    },
  },
  { timestamps: true }
);

// Indexes
driverSchema.index({ status: 1 });
driverSchema.index({ licenseExpiryDate: 1 });

// Virtual: check if license is expired
driverSchema.virtual('isLicenseExpired').get(function () {
  return this.licenseExpiryDate < new Date();
});

// Ensure virtuals are included in JSON
driverSchema.set('toJSON', { virtuals: true });
driverSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Driver', driverSchema);
