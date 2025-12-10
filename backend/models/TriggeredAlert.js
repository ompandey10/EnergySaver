const mongoose = require('mongoose');

const triggeredAlertSchema = new mongoose.Schema({
    alert: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alert',
        required: true,
    },
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
    message: {
        type: String,
        required: true,
    },
    currentValue: {
        type: Number,
        required: true,
    },
    limitValue: {
        type: Number,
        required: true,
    },
    percentageUsed: {
        type: Number,
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    isResolved: {
        type: Boolean,
        default: false,
    },
    resolvedAt: {
        type: Date,
    },
    triggeredAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Index for efficient queries
triggeredAlertSchema.index({ user: 1, isRead: 1, triggeredAt: -1 });
triggeredAlertSchema.index({ alert: 1, triggeredAt: -1 });

module.exports = mongoose.model('TriggeredAlert', triggeredAlertSchema);
