const User = require('../models/User');
const Home = require('../models/Home');
const Device = require('../models/Device');
const DeviceTemplate = require('../models/DeviceTemplate');
const Reading = require('../models/Reading');
const { asyncHandler } = require('../middleware/error');
const { getNeighborhoodStats } = require('../utils/comparisonEngine');

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, role, isActive, search } = req.query;

    const query = {};

    if (role) query.role = role;
    if (typeof isActive !== 'undefined') query.isActive = isActive === 'true';
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);

    const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
        users.map(async (user) => {
            const homeCount = await Home.countDocuments({ user: user._id, isActive: true });
            const deviceCount = await Device.countDocuments({
                home: { $in: await Home.find({ user: user._id }).distinct('_id') },
                isActive: true,
            });

            return {
                ...user.toObject(),
                stats: {
                    homeCount,
                    deviceCount,
                },
            };
        })
    );

    res.status(200).json({
        success: true,
        count: users.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        users: usersWithStats,
    });
});

/**
 * @desc    Get single user by ID (Admin only)
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    // Get user's homes and devices
    const homes = await Home.find({ user: user._id, isActive: true });
    const homeIds = homes.map(h => h._id);
    const devices = await Device.find({ home: { $in: homeIds }, isActive: true });

    // Get usage statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const readings = await Reading.find({
        home: { $in: homeIds },
        timestamp: { $gte: thirtyDaysAgo },
    });

    const totalKWh = readings.reduce((sum, r) => sum + r.kWh, 0);
    const totalCost = readings.reduce((sum, r) => sum + (r.cost || 0), 0);

    res.status(200).json({
        success: true,
        user: {
            ...user.toObject(),
            stats: {
                homeCount: homes.length,
                deviceCount: devices.length,
                last30Days: {
                    totalKWh: parseFloat(totalKWh.toFixed(4)),
                    totalCost: parseFloat(totalCost.toFixed(2)),
                },
            },
            homes: homes.map(h => ({
                id: h._id,
                name: h.name,
                zipCode: h.zipCode,
                homeType: h.homeType,
            })),
        },
    });
});

/**
 * @desc    Update user (Admin only)
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
    const { name, email, role, isActive } = req.body;

    let user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    user = await User.findByIdAndUpdate(
        req.params.id,
        { name, email, role, isActive },
        { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
        success: true,
        message: 'User updated successfully',
        user,
    });
});

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    // Soft delete: deactivate user
    user.isActive = false;
    await user.save();

    // Also deactivate user's homes
    await Home.updateMany({ user: user._id }, { isActive: false });

    res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
    });
});

/**
 * @desc    Create device template (Admin only)
 * @route   POST /api/admin/devices/templates
 * @access  Private/Admin
 */
const createDeviceTemplate = asyncHandler(async (req, res) => {
    const { name, type, avgWattage, minWattage, maxWattage, category, description } = req.body;

    const template = await DeviceTemplate.create({
        name,
        type,
        avgWattage,
        minWattage,
        maxWattage,
        category,
        description,
    });

    res.status(201).json({
        success: true,
        message: 'Device template created successfully',
        template,
    });
});

/**
 * @desc    Update device template (Admin only)
 * @route   PUT /api/admin/devices/templates/:id
 * @access  Private/Admin
 */
const updateDeviceTemplate = asyncHandler(async (req, res) => {
    const { name, type, avgWattage, minWattage, maxWattage, category, description, isActive } = req.body;

    let template = await DeviceTemplate.findById(req.params.id);

    if (!template) {
        return res.status(404).json({
            success: false,
            message: 'Device template not found',
        });
    }

    template = await DeviceTemplate.findByIdAndUpdate(
        req.params.id,
        { name, type, avgWattage, minWattage, maxWattage, category, description, isActive },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Device template updated successfully',
        template,
    });
});

/**
 * @desc    Delete device template (Admin only)
 * @route   DELETE /api/admin/devices/templates/:id
 * @access  Private/Admin
 */
const deleteDeviceTemplate = asyncHandler(async (req, res) => {
    const template = await DeviceTemplate.findById(req.params.id);

    if (!template) {
        return res.status(404).json({
            success: false,
            message: 'Device template not found',
        });
    }

    template.isActive = false;
    await template.save();

    res.status(200).json({
        success: true,
        message: 'Device template deleted successfully',
    });
});

/**
 * @desc    Get community insights (Admin only)
 * @route   GET /api/admin/insights
 * @access  Private/Admin
 */
const getCommunityInsights = asyncHandler(async (req, res) => {
    const { zipCode } = req.query;

    // Get platform-wide or zip-code specific statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let homeQuery = { isActive: true };
    if (zipCode) {
        homeQuery.zipCode = zipCode;
    }

    const homes = await Home.find(homeQuery);
    const homeIds = homes.map(h => h._id);

    // Device statistics
    const devices = await Device.find({ home: { $in: homeIds }, isActive: true });
    const deviceTypeBreakdown = devices.reduce((acc, device) => {
        acc[device.type] = (acc[device.type] || 0) + 1;
        return acc;
    }, {});

    // Usage statistics
    const readings = await Reading.find({
        home: { $in: homeIds },
        timestamp: { $gte: thirtyDaysAgo },
    });

    const totalKWh = readings.reduce((sum, r) => sum + r.kWh, 0);
    const totalCost = readings.reduce((sum, r) => sum + (r.cost || 0), 0);
    const avgKWhPerHome = homes.length > 0 ? totalKWh / homes.length : 0;
    const avgCostPerHome = homes.length > 0 ? totalCost / homes.length : 0;

    // Get neighborhood data if zip code provided
    let neighborhoodData = null;
    if (zipCode) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        neighborhoodData = await getNeighborhoodStats(zipCode, startDate, endDate);
    }

    res.status(200).json({
        success: true,
        insights: {
            scope: zipCode ? `Zip Code: ${zipCode}` : 'Platform-wide',
            summary: {
                totalHomes: homes.length,
                totalDevices: devices.length,
                avgDevicesPerHome: homes.length > 0 ? parseFloat((devices.length / homes.length).toFixed(2)) : 0,
            },
            deviceBreakdown: deviceTypeBreakdown,
            usage: {
                period: 'Last 30 Days',
                totalKWh: parseFloat(totalKWh.toFixed(4)),
                totalCost: parseFloat(totalCost.toFixed(2)),
                avgKWhPerHome: parseFloat(avgKWhPerHome.toFixed(4)),
                avgCostPerHome: parseFloat(avgCostPerHome.toFixed(2)),
            },
            neighborhood: neighborhoodData,
        },
    });
});

/**
 * @desc    Get platform analytics (Admin only)
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
const getPlatformAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User statistics
    const totalUsers = await User.countDocuments({ isActive: true });
    const newUsers = await User.countDocuments({
        createdAt: { $gte: start, $lte: end },
    });

    // Home and device statistics
    const totalHomes = await Home.countDocuments({ isActive: true });
    const totalDevices = await Device.countDocuments({ isActive: true });

    // Reading statistics
    const readings = await Reading.find({
        timestamp: { $gte: start, $lte: end },
    });

    const totalKWh = readings.reduce((sum, r) => sum + r.kWh, 0);
    const totalCost = readings.reduce((sum, r) => sum + (r.cost || 0), 0);

    // Daily breakdown
    const dailyData = await Reading.aggregate([
        {
            $match: {
                timestamp: { $gte: start, $lte: end },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: '$timestamp' },
                    month: { $month: '$timestamp' },
                    day: { $dayOfMonth: '$timestamp' },
                },
                totalKWh: { $sum: '$kWh' },
                totalCost: { $sum: '$cost' },
                readingCount: { $sum: 1 },
            },
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
        },
    ]);

    // Top zip codes
    const topZipCodes = await Home.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$zipCode', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]);

    res.status(200).json({
        success: true,
        period: {
            startDate: start,
            endDate: end,
        },
        analytics: {
            users: {
                total: totalUsers,
                newInPeriod: newUsers,
            },
            homes: {
                total: totalHomes,
                avgDevicesPerHome: totalHomes > 0 ? parseFloat((totalDevices / totalHomes).toFixed(2)) : 0,
            },
            devices: {
                total: totalDevices,
            },
            usage: {
                totalKWh: parseFloat(totalKWh.toFixed(4)),
                totalCost: parseFloat(totalCost.toFixed(2)),
                totalReadings: readings.length,
                avgKWhPerReading: readings.length > 0 ? parseFloat((totalKWh / readings.length).toFixed(4)) : 0,
            },
            dailyTrend: dailyData.map(d => ({
                date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
                totalKWh: parseFloat(d.totalKWh.toFixed(4)),
                totalCost: parseFloat(d.totalCost.toFixed(2)),
                readingCount: d.readingCount,
            })),
            topZipCodes: topZipCodes.map(z => ({
                zipCode: z._id,
                homeCount: z.count,
            })),
        },
    });
});

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    createDeviceTemplate,
    updateDeviceTemplate,
    deleteDeviceTemplate,
    getCommunityInsights,
    getPlatformAnalytics,
};
