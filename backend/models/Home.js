const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a home name'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    address: {
        street: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            trim: true,
            default: 'India',
        },
    },
    zipCode: {
        type: String,
        required: [true, 'Please provide a pin code'],
        trim: true,
        match: [/^\d{5,6}$/, 'Please provide a valid pin code'],
    },
    squareFootage: {
        type: Number,
        min: [0, 'Square footage cannot be negative'],
    },
    numberOfRooms: {
        type: Number,
        min: [1, 'Must have at least 1 room'],
        default: 1,
    },
    homeType: {
        type: String,
        enum: ['apartment', 'house', 'condo', 'townhouse', 'other'],
        default: 'house',
    },
    // Indian Electricity Tariff Configuration
    tariffType: {
        type: String,
        enum: ['domestic', 'commercial', 'industrial'],
        default: 'domestic',
    },
    // Tariff structure type (slab-based is standard in India)
    tariffStructure: {
        type: String,
        enum: ['slab', 'flat', 'tou'], // slab = slab-based, flat = fixed rate, tou = time-of-use
        default: 'slab',
    },
    // Slab-based tariff rates (Indian system)
    tariffSlabs: {
        type: [{
            minUnits: { type: Number, default: 0 },
            maxUnits: { type: Number, default: Infinity },
            rate: { type: Number, required: true }, // ₹ per kWh
        }],
        default: [
            { minUnits: 0, maxUnits: 100, rate: 3.00 },      // 0-100 units: ₹3.00/kWh
            { minUnits: 101, maxUnits: 300, rate: 5.50 },    // 101-300 units: ₹5.50/kWh
            { minUnits: 301, maxUnits: 500, rate: 7.00 },    // 301-500 units: ₹7.00/kWh
            { minUnits: 501, maxUnits: Infinity, rate: 8.50 } // Above 500 units: ₹8.50/kWh
        ],
    },
    // Fixed monthly charges in ₹
    fixedCharges: {
        type: Number,
        default: 50, // ₹50 per month base charge
        min: [0, 'Fixed charges cannot be negative'],
    },
    // Sanctioned load in kW (for fixed charge calculation)
    sanctionedLoad: {
        type: Number,
        default: 5, // 5 kW default
        min: [0, 'Sanctioned load cannot be negative'],
    },
    // Per kW charge
    perKWCharge: {
        type: Number,
        default: 20, // ₹20 per kW per month
        min: [0, 'Per kW charge cannot be negative'],
    },
    // Tax percentage (typically 5-18% GST)
    taxPercentage: {
        type: Number,
        default: 5, // 5% tax
        min: [0, 'Tax percentage cannot be negative'],
        max: [100, 'Tax percentage cannot exceed 100'],
    },
    // Simple flat rate (fallback if not using slabs)
    electricityRate: {
        type: Number,
        default: 6, // Default rate per kWh in INR (₹)
        min: [0, 'Rate cannot be negative'],
    },
    // Whether to use slab-based pricing
    useSlabPricing: {
        type: Boolean,
        default: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual for devices
homeSchema.virtual('devices', {
    ref: 'Device',
    localField: '_id',
    foreignField: 'home',
    justOne: false,
});

// Index for faster queries
homeSchema.index({ user: 1, isActive: 1 });
homeSchema.index({ zipCode: 1 });

module.exports = mongoose.model('Home', homeSchema);
