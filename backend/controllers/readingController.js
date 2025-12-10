const Reading = require('../models/Reading');
const Device = require('../models/Device');
const Home = require('../models/Home');
const { asyncHandler } = require('../middleware/error');
const {
    generateDeviceReading,
    generateHomeReadings,
    generateHistoricalData,
    simulateRealtimeReadings,
} = require('../utils/readingSimulator');

/**
 * @desc    Get readings for a specific device
 * @route   GET /api/readings/device/:deviceId
 * @access  Private
 */
const getDeviceReadings = asyncHandler(async (req, res) => {
    const { deviceId } = req.params;
    const { startDate, endDate, limit = 100, page = 1 } = req.query;

    // Verify device exists and user has access
    const device = await Device.findById(deviceId).populate('home', 'user');
    if (!device) {
        return res.status(404).json({
            success: false,
            message: 'Device not found',
        });
    }

    if (device.home.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to access this device',
        });
    }

    // Build query
    const query = { device: deviceId };

    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;
    const total = await Reading.countDocuments(query);

    const readings = await Reading.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(skip);

    // Calculate summary statistics
    const totalKWh = readings.reduce((sum, r) => sum + r.kWh, 0);
    const totalCost = readings.reduce((sum, r) => sum + (r.cost || 0), 0);
    const avgWatts = readings.length > 0
        ? readings.reduce((sum, r) => sum + r.watts, 0) / readings.length
        : 0;

    res.status(200).json({
        success: true,
        count: readings.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        summary: {
            totalKWh: parseFloat(totalKWh.toFixed(4)),
            totalCost: parseFloat(totalCost.toFixed(2)),
            avgWatts: parseFloat(avgWatts.toFixed(2)),
        },
        readings,
    });
});

/**
 * @desc    Get aggregated readings for a home
 * @route   GET /api/readings/home/:homeId
 * @access  Private
 */
const getHomeReadings = asyncHandler(async (req, res) => {
    const { homeId } = req.params;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Verify home exists and user has access
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

    // Build date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get aggregated data
    let groupFormat;
    switch (groupBy) {
        case 'hour':
            groupFormat = {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' },
                day: { $dayOfMonth: '$timestamp' },
                hour: { $hour: '$timestamp' },
            };
            break;
        case 'day':
            groupFormat = {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' },
                day: { $dayOfMonth: '$timestamp' },
            };
            break;
        case 'month':
            groupFormat = {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' },
            };
            break;
        default:
            groupFormat = {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' },
                day: { $dayOfMonth: '$timestamp' },
            };
    }

    const aggregatedData = await Reading.aggregate([
        {
            $match: {
                home: home._id,
                timestamp: { $gte: start, $lte: end },
            },
        },
        {
            $group: {
                _id: groupFormat,
                totalKWh: { $sum: '$kWh' },
                totalCost: { $sum: '$cost' },
                avgWatts: { $avg: '$watts' },
                maxWatts: { $max: '$watts' },
                readingCount: { $sum: 1 },
            },
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 },
        },
    ]);

    // Calculate total summary
    const totalKWh = aggregatedData.reduce((sum, d) => sum + d.totalKWh, 0);
    const totalCost = aggregatedData.reduce((sum, d) => sum + d.totalCost, 0);

    res.status(200).json({
        success: true,
        home: {
            id: home._id,
            name: home.name,
        },
        period: {
            startDate: start,
            endDate: end,
            groupBy,
        },
        summary: {
            totalKWh: parseFloat(totalKWh.toFixed(4)),
            totalCost: parseFloat(totalCost.toFixed(2)),
            dataPoints: aggregatedData.length,
        },
        data: aggregatedData.map(d => ({
            period: d._id,
            totalKWh: parseFloat(d.totalKWh.toFixed(4)),
            totalCost: parseFloat(d.totalCost.toFixed(2)),
            avgWatts: parseFloat(d.avgWatts.toFixed(2)),
            maxWatts: parseFloat(d.maxWatts.toFixed(2)),
            readingCount: d.readingCount,
        })),
    });
});

/**
 * @desc    Simulate readings for a device
 * @route   POST /api/readings/simulate
 * @access  Private
 */
const simulateReadings = asyncHandler(async (req, res) => {
    const { deviceId, daysBack = 30, intervalHours = 1 } = req.body;

    // Verify device exists and user has access
    const device = await Device.findById(deviceId).populate('home', 'user');
    if (!device) {
        return res.status(404).json({
            success: false,
            message: 'Device not found',
        });
    }

    if (device.home.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to simulate data for this device',
        });
    }

    // Generate historical data
    const readings = await generateHistoricalData(deviceId, daysBack, intervalHours);

    const totalKWh = readings.reduce((sum, r) => sum + r.kWh, 0);
    const totalCost = readings.reduce((sum, r) => sum + (r.cost || 0), 0);

    res.status(201).json({
        success: true,
        message: 'Simulated readings generated successfully',
        summary: {
            readingsGenerated: readings.length,
            daysBack,
            intervalHours,
            totalKWh: parseFloat(totalKWh.toFixed(4)),
            totalCost: parseFloat(totalCost.toFixed(2)),
        },
    });
});

/**
 * @desc    Get real-time consumption for a home
 * @route   GET /api/readings/realtime/:homeId
 * @access  Private
 */
const getRealtimeConsumption = asyncHandler(async (req, res) => {
    const { homeId } = req.params;

    // Verify home exists and user has access
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

    // Get latest readings for all devices (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const devices = await Device.find({ home: homeId, isActive: true });

    const realtimeData = await Promise.all(
        devices.map(async (device) => {
            const latestReading = await Reading.findOne({
                device: device._id,
                timestamp: { $gte: oneHourAgo },
            }).sort({ timestamp: -1 });

            return {
                deviceId: device._id,
                deviceName: device.name,
                deviceType: device.type,
                currentWatts: latestReading ? latestReading.watts : 0,
                currentKWh: latestReading ? latestReading.kWh : 0,
                lastUpdated: latestReading ? latestReading.timestamp : null,
                isOnline: !!latestReading,
            };
        })
    );

    // Calculate totals
    const totalWatts = realtimeData.reduce((sum, d) => sum + d.currentWatts, 0);
    const estimatedHourlyCost = (totalWatts / 1000) * home.electricityRate;

    res.status(200).json({
        success: true,
        home: {
            id: home._id,
            name: home.name,
        },
        realtime: {
            totalCurrentWatts: parseFloat(totalWatts.toFixed(2)),
            estimatedHourlyCost: parseFloat(estimatedHourlyCost.toFixed(4)),
            estimatedDailyCost: parseFloat((estimatedHourlyCost * 24).toFixed(2)),
            timestamp: new Date(),
        },
        devices: realtimeData,
    });
});

/**
 * @desc    Simulate readings for entire home
 * @route   POST /api/readings/simulate/home/:homeId
 * @access  Private
 */
const simulateHomeReadings = asyncHandler(async (req, res) => {
    const { homeId } = req.params;
    const { daysBack = 30, intervalHours = 1 } = req.body;

    // Verify home exists and user has access
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
            message: 'Not authorized to simulate data for this home',
        });
    }

    // Get all active devices
    const devices = await Device.find({ home: homeId, isActive: true });

    if (devices.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No active devices found in this home',
        });
    }

    // Generate historical data for each device
    let totalReadingsGenerated = 0;
    let totalKWh = 0;
    let totalCost = 0;

    for (const device of devices) {
        const readings = await generateHistoricalData(device._id, daysBack, intervalHours);
        totalReadingsGenerated += readings.length;
        totalKWh += readings.reduce((sum, r) => sum + r.kWh, 0);
        totalCost += readings.reduce((sum, r) => sum + (r.cost || 0), 0);
    }

    res.status(201).json({
        success: true,
        message: 'Simulated readings generated successfully for all devices',
        summary: {
            devicesProcessed: devices.length,
            readingsGenerated: totalReadingsGenerated,
            daysBack,
            intervalHours,
            totalKWh: parseFloat(totalKWh.toFixed(4)),
            totalCost: parseFloat(totalCost.toFixed(2)),
        },
    });
});

module.exports = {
    getDeviceReadings,
    getHomeReadings,
    simulateReadings,
    getRealtimeConsumption,
    simulateHomeReadings,
};
