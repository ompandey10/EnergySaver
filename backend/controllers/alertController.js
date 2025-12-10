const Alert = require('../models/Alert');
const TriggeredAlert = require('../models/TriggeredAlert');
const Home = require('../models/Home');
const Device = require('../models/Device');
const { asyncHandler } = require('../middleware/error');
const {
    checkAlert,
    getUserTriggeredAlerts,
    markAlertAsRead,
    markAlertAsResolved,
} = require('../utils/alertChecker');

/**
 * @desc    Create a new alert rule
 * @route   POST /api/alerts
 * @access  Private
 */
const createAlert = asyncHandler(async (req, res) => {
    const {
        name,
        homeId,
        deviceId,
        type,
        limitKWh,
        limitCost,
        period,
        threshold,
        notificationMethods,
    } = req.body;

    // Verify home or device ownership
    if (homeId) {
        const home = await Home.findById(homeId);
        if (!home) {
            return res.status(404).json({
                success: false,
                message: 'Home not found',
            });
        }
        if (home.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to create alerts for this home',
            });
        }
    }

    if (deviceId) {
        const device = await Device.findById(deviceId).populate('home', 'user');
        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found',
            });
        }
        if (device.home.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to create alerts for this device',
            });
        }
    }

    const alert = await Alert.create({
        user: req.user._id,
        home: homeId,
        device: deviceId,
        name,
        type,
        limitKWh,
        limitCost,
        period,
        threshold,
        notificationMethods,
    });

    res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        alert,
    });
});

/**
 * @desc    Get all alerts for logged in user
 * @route   GET /api/alerts/user
 * @access  Private
 */
const getUserAlerts = asyncHandler(async (req, res) => {
    const { isEnabled, type } = req.query;

    const query = { user: req.user._id };
    if (typeof isEnabled !== 'undefined') {
        query.isEnabled = isEnabled === 'true';
    }
    if (type) {
        query.type = type;
    }

    const alerts = await Alert.find(query)
        .populate('home', 'name')
        .populate('device', 'name type')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: alerts.length,
        alerts,
    });
});

/**
 * @desc    Get single alert by ID
 * @route   GET /api/alerts/:id
 * @access  Private
 */
const getAlert = asyncHandler(async (req, res) => {
    const alert = await Alert.findById(req.params.id)
        .populate('home', 'name')
        .populate('device', 'name type');

    if (!alert) {
        return res.status(404).json({
            success: false,
            message: 'Alert not found',
        });
    }

    // Check ownership
    if (alert.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to access this alert',
        });
    }

    res.status(200).json({
        success: true,
        alert,
    });
});

/**
 * @desc    Update alert
 * @route   PUT /api/alerts/:id
 * @access  Private
 */
const updateAlert = asyncHandler(async (req, res) => {
    let alert = await Alert.findById(req.params.id);

    if (!alert) {
        return res.status(404).json({
            success: false,
            message: 'Alert not found',
        });
    }

    // Check ownership
    if (alert.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this alert',
        });
    }

    const {
        name,
        type,
        limitKWh,
        limitCost,
        period,
        threshold,
        isEnabled,
        notificationMethods,
    } = req.body;

    alert = await Alert.findByIdAndUpdate(
        req.params.id,
        {
            name,
            type,
            limitKWh,
            limitCost,
            period,
            threshold,
            isEnabled,
            notificationMethods,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json({
        success: true,
        message: 'Alert updated successfully',
        alert,
    });
});

/**
 * @desc    Delete alert
 * @route   DELETE /api/alerts/:id
 * @access  Private
 */
const deleteAlert = asyncHandler(async (req, res) => {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
        return res.status(404).json({
            success: false,
            message: 'Alert not found',
        });
    }

    // Check ownership
    if (alert.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this alert',
        });
    }

    await alert.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Alert deleted successfully',
    });
});

/**
 * @desc    Get triggered alerts for user
 * @route   GET /api/alerts/triggered
 * @access  Private
 */
const getTriggeredAlerts = asyncHandler(async (req, res) => {
    const { isRead, isResolved, limit = 50, page = 1 } = req.query;

    const options = {
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
    };

    if (typeof isRead !== 'undefined') {
        options.isRead = isRead === 'true';
    }
    if (typeof isResolved !== 'undefined') {
        options.isResolved = isResolved === 'true';
    }

    const triggeredAlerts = await getUserTriggeredAlerts(req.user._id, options);

    const total = await TriggeredAlert.countDocuments({
        user: req.user._id,
        ...(typeof isRead !== 'undefined' && { isRead: isRead === 'true' }),
        ...(typeof isResolved !== 'undefined' && { isResolved: isResolved === 'true' }),
    });

    res.status(200).json({
        success: true,
        count: triggeredAlerts.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        triggeredAlerts,
    });
});

/**
 * @desc    Mark triggered alert as read
 * @route   PUT /api/alerts/triggered/:id/read
 * @access  Private
 */
const markTriggeredAlertRead = asyncHandler(async (req, res) => {
    let triggeredAlert = await TriggeredAlert.findById(req.params.id);

    if (!triggeredAlert) {
        return res.status(404).json({
            success: false,
            message: 'Triggered alert not found',
        });
    }

    // Check ownership
    if (triggeredAlert.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this alert',
        });
    }

    triggeredAlert = await markAlertAsRead(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Alert marked as read',
        triggeredAlert,
    });
});

/**
 * @desc    Mark triggered alert as resolved
 * @route   PUT /api/alerts/triggered/:id/resolve
 * @access  Private
 */
const markTriggeredAlertResolved = asyncHandler(async (req, res) => {
    let triggeredAlert = await TriggeredAlert.findById(req.params.id);

    if (!triggeredAlert) {
        return res.status(404).json({
            success: false,
            message: 'Triggered alert not found',
        });
    }

    // Check ownership
    if (triggeredAlert.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this alert',
        });
    }

    triggeredAlert = await markAlertAsResolved(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Alert marked as resolved',
        triggeredAlert,
    });
});

/**
 * @desc    Test an alert (check if it would trigger now)
 * @route   POST /api/alerts/:id/test
 * @access  Private
 */
const testAlert = asyncHandler(async (req, res) => {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
        return res.status(404).json({
            success: false,
            message: 'Alert not found',
        });
    }

    // Check ownership
    if (alert.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to test this alert',
        });
    }

    // Temporarily enable alert for testing
    const wasEnabled = alert.isEnabled;
    alert.isEnabled = true;

    const result = await checkAlert(alert);

    // Restore original state
    alert.isEnabled = wasEnabled;

    if (result) {
        res.status(200).json({
            success: true,
            message: 'Alert would trigger',
            wouldTrigger: true,
            details: {
                currentValue: result.currentValue,
                limitValue: result.limitValue,
                percentageUsed: result.percentageUsed,
                severity: result.severity,
                message: result.message,
            },
        });
    } else {
        res.status(200).json({
            success: true,
            message: 'Alert would not trigger',
            wouldTrigger: false,
        });
    }
});

module.exports = {
    createAlert,
    getUserAlerts,
    getAlert,
    updateAlert,
    deleteAlert,
    getTriggeredAlerts,
    markTriggeredAlertRead,
    markTriggeredAlertResolved,
    testAlert,
};
