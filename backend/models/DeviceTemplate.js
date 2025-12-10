const mongoose = require('mongoose');

const deviceTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a template name'],
        trim: true,
        unique: true,
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
    avgWattage: {
        type: Number,
        required: [true, 'Please provide average wattage'],
        min: [0, 'Wattage cannot be negative'],
    },
    minWattage: {
        type: Number,
        min: [0, 'Wattage cannot be negative'],
    },
    maxWattage: {
        type: Number,
        min: [0, 'Wattage cannot be negative'],
    },
    description: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        enum: ['heating_cooling', 'kitchen', 'laundry', 'entertainment', 'lighting', 'outdoor', 'other'],
        default: 'other',
    },
    avgUsageHoursPerDay: {
        type: Number,
        min: [0, 'Hours cannot be negative'],
        max: [24, 'Hours cannot exceed 24'],
    },
    energyStarRated: {
        type: Boolean,
        default: false,
    },
    icon: {
        type: String,
        default: 'device',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Index for queries
deviceTemplateSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('DeviceTemplate', deviceTemplateSchema);
