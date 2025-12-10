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
            default: 'USA',
        },
    },
    zipCode: {
        type: String,
        required: [true, 'Please provide a zip code'],
        trim: true,
        match: [/^\d{5}(-\d{4})?$/, 'Please provide a valid zip code'],
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
    electricityRate: {
        type: Number,
        default: 0.12, // Default rate per kWh in dollars
        min: [0, 'Rate cannot be negative'],
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
