const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    home: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Home',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a device name'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    type: {
        type: String,
        required: [true, 'Please provide a device type'],
        enum: [
            'hvac',
            'water_heater',
            'refrigerator',
            'washer',
            'dryer',
            'dishwasher',
            'oven',
            'microwave',
            'lighting',
            'tv',
            'computer',
            'gaming_console',
            'ev_charger',
            'pool_pump',
            'other',
        ],
    },
    wattage: {
        type: Number,
        required: [true, 'Please provide device wattage'],
        min: [0, 'Wattage cannot be negative'],
    },
    brand: {
        type: String,
        trim: true,
    },
    model: {
        type: String,
        trim: true,
    },
    location: {
        type: String,
        trim: true, // e.g., "Living Room", "Kitchen"
    },
    isSmartDevice: {
        type: Boolean,
        default: false,
    },
    averageUsageHours: {
        type: Number,
        default: 0, // Average hours used per day
        min: [0, 'Usage hours cannot be negative'],
        max: [24, 'Usage hours cannot exceed 24'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    installedDate: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual for readings
deviceSchema.virtual('readings', {
    ref: 'Reading',
    localField: '_id',
    foreignField: 'device',
    justOne: false,
});

// Calculate estimated daily consumption in kWh
deviceSchema.virtual('estimatedDailyKWh').get(function () {
    return (this.wattage * this.averageUsageHours) / 1000;
});

// Index for faster queries
deviceSchema.index({ home: 1, isActive: 1 });
deviceSchema.index({ type: 1 });

module.exports = mongoose.model('Device', deviceSchema);
