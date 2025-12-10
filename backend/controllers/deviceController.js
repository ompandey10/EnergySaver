const Device = require('../models/Device');
const DeviceTemplate = require('../models/DeviceTemplate');
const Home = require('../models/Home');
const Reading = require('../models/Reading');
const { asyncHandler } = require('../middleware/error');

/**
 * @desc    Create a new device
 * @route   POST /api/devices
 * @access  Private
 */
const createDevice = asyncHandler(async (req, res) => {
    const {
        homeId,
        name,
        type,
        wattage,
        brand,
        model,
        location,
        isSmartDevice,
        averageUsageHours,
    } = req.body;

    // Verify home exists and user owns it
    const home = await Home.findById(homeId);
    if (!home) {
        return res.status(404).json({
            success: false,
            message: 'Home not found',
        });
    }

    if (home.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to add devices to this home',
        });
    }

    const device = await Device.create({
        home: homeId,
        name,
        type,
        wattage,
        brand,
        model,
        location,
        isSmartDevice,
        averageUsageHours,
    });

    res.status(201).json({
        success: true,
        message: 'Device created successfully',
        device,
    });
});

/**
 * @desc    Get all devices for a home
 * @route   GET /api/devices/home/:homeId
 * @access  Private
 */
const getHomeDevices = asyncHandler(async (req, res) => {
    const { homeId } = req.params;

    // Verify home exists and user owns it
    const home = await Home.findById(homeId);
    if (!home) {
        return res.status(404).json({
            success: false,
            message: 'Home not found',
        });
    }

    if (home.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to access this home',
        });
    }

    const devices = await Device.find({ home: homeId, isActive: true });

    res.status(200).json({
        success: true,
        count: devices.length,
        devices,
    });
});

/**
 * @desc    Get single device by ID
 * @route   GET /api/devices/:id
 * @access  Private
 */
const getDevice = asyncHandler(async (req, res) => {
    const device = await Device.findById(req.params.id).populate('home', 'name user');

    if (!device) {
        return res.status(404).json({
            success: false,
            message: 'Device not found',
        });
    }

    // Check ownership
    if (device.home.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to access this device',
        });
    }

    // Get recent readings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const readings = await Reading.find({
        device: device._id,
        timestamp: { $gte: sevenDaysAgo },
    }).sort({ timestamp: -1 }).limit(168); // 7 days of hourly readings

    const totalKWh = readings.reduce((sum, r) => sum + r.kWh, 0);
    const avgKWh = readings.length > 0 ? totalKWh / readings.length : 0;

    res.status(200).json({
        success: true,
        device: {
            ...device.toObject(),
            recentStats: {
                last7Days: {
                    totalKWh: parseFloat(totalKWh.toFixed(4)),
                    avgKWh: parseFloat(avgKWh.toFixed(4)),
                    readingCount: readings.length,
                },
                recentReadings: readings.slice(0, 24), // Last 24 hours
            },
        },
    });
});

/**
 * @desc    Update device
 * @route   PUT /api/devices/:id
 * @access  Private
 */
const updateDevice = asyncHandler(async (req, res) => {
    let device = await Device.findById(req.params.id).populate('home', 'user');

    if (!device) {
        return res.status(404).json({
            success: false,
            message: 'Device not found',
        });
    }

    // Check ownership
    if (device.home.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this device',
        });
    }

    const {
        name,
        type,
        wattage,
        brand,
        model,
        location,
        isSmartDevice,
        averageUsageHours,
        isActive,
    } = req.body;

    device = await Device.findByIdAndUpdate(
        req.params.id,
        {
            name,
            type,
            wattage,
            brand,
            model,
            location,
            isSmartDevice,
            averageUsageHours,
            isActive,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json({
        success: true,
        message: 'Device updated successfully',
        device,
    });
});

/**
 * @desc    Delete device (soft delete)
 * @route   DELETE /api/devices/:id
 * @access  Private
 */
const deleteDevice = asyncHandler(async (req, res) => {
    const device = await Device.findById(req.params.id).populate('home', 'user');

    if (!device) {
        return res.status(404).json({
            success: false,
            message: 'Device not found',
        });
    }

    // Check ownership
    if (device.home.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this device',
        });
    }

    // Soft delete
    device.isActive = false;
    await device.save();

    res.status(200).json({
        success: true,
        message: 'Device deleted successfully',
    });
});

/**
 * @desc    Get device templates
 * @route   GET /api/devices/templates
 * @access  Private
 */
const getDeviceTemplates = asyncHandler(async (req, res) => {
    const templates = await DeviceTemplate.find({ isActive: true }).sort({ type: 1, name: 1 });

    res.status(200).json({
        success: true,
        count: templates.length,
        templates,
    });
});

/**
 * @desc    Get device usage statistics
 * @route   GET /api/devices/:id/stats
 * @access  Private
 */
const getDeviceStats = asyncHandler(async (req, res) => {
    const device = await Device.findById(req.params.id).populate('home', 'name user electricityRate');

    if (!device) {
        return res.status(404).json({
            success: false,
            message: 'Device not found',
        });
    }

    // Check ownership
    if (device.home.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to access this device',
        });
    }

    // Get statistics for different time periods
    const now = new Date();
    const periods = {
        today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        thisWeek: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        thisMonth: new Date(now.getFullYear(), now.getMonth(), 1),
    };

    const stats = {};

    for (const [period, startDate] of Object.entries(periods)) {
        const readings = await Reading.find({
            device: device._id,
            timestamp: { $gte: startDate, $lte: now },
        });

        const totalKWh = readings.reduce((sum, r) => sum + r.kWh, 0);
        const totalCost = readings.reduce((sum, r) => sum + (r.cost || 0), 0);
        const activeReadings = readings.filter(r => r.watts > 0).length;

        stats[period] = {
            totalKWh: parseFloat(totalKWh.toFixed(4)),
            totalCost: parseFloat(totalCost.toFixed(2)),
            readingCount: readings.length,
            activeHours: activeReadings,
            utilizationRate: readings.length > 0
                ? parseFloat(((activeReadings / readings.length) * 100).toFixed(2))
                : 0,
        };
    }

    res.status(200).json({
        success: true,
        device: {
            id: device._id,
            name: device.name,
            type: device.type,
            wattage: device.wattage,
        },
        stats,
    });
});

module.exports = {
    createDevice,
    getHomeDevices,
    getDevice,
    updateDevice,
    deleteDevice,
    getDeviceTemplates,
    getDeviceStats,
};
