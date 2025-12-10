const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    home: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Home',
    },
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
    },
    name: {
        type: String,
        required: [true, 'Please provide an alert name'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    type: {
        type: String,
        enum: ['usage_limit', 'cost_limit', 'unusual_activity', 'device_offline'],
        default: 'usage_limit',
    },
    limitKWh: {
        type: Number,
        min: [0, 'Limit cannot be negative'],
    },
    limitCost: {
        type: Number,
        min: [0, 'Cost limit cannot be negative'],
    },
    period: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'monthly'],
        default: 'daily',
    },
    threshold: {
        type: Number,
        min: [0, 'Threshold cannot be negative'],
        max: [100, 'Threshold cannot exceed 100'],
        default: 80, // Alert when 80% of limit is reached
    },
    isEnabled: {
        type: Boolean,
        default: true,
    },
    notificationMethods: [{
        type: String,
        enum: ['email', 'push', 'sms', 'in_app'],
        default: 'in_app',
    }],
    lastTriggered: {
        type: Date,
    },
    triggerCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// At least one of home or device must be specified
alertSchema.pre('save', function (next) {
    if (!this.home && !this.device) {
        next(new Error('Alert must be associated with either a home or a device'));
    }
    next();
});

// Index for efficient queries
alertSchema.index({ user: 1, isEnabled: 1 });
alertSchema.index({ home: 1 });
alertSchema.index({ device: 1 });

module.exports = mongoose.model('Alert', alertSchema);
