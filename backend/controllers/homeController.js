const Home = require('../models/Home');
const Device = require('../models/Device');
const Reading = require('../models/Reading');
const { asyncHandler } = require('../middleware/error');

/**
 * @desc    Create a new home
 * @route   POST /api/homes
 * @access  Private
 */
const createHome = asyncHandler(async (req, res) => {
    const {
        name,
        address,
        zipCode,
        squareFootage,
        numberOfRooms,
        homeType,
        electricityRate,
        country,
        tariffStructure,
        tariffSlabs,
        fixedCharges,
    } = req.body;

    const home = await Home.create({
        user: req.user._id,
        name,
        address,
        zipCode,
        squareFootage,
        numberOfRooms,
        homeType,
        electricityRate,
        country,
        tariffStructure,
        tariffSlabs,
        fixedCharges,
    });

    res.status(201).json({
        success: true,
        message: 'Home created successfully',
        home,
    });
});

/**
 * @desc    Get all homes for logged in user
 * @route   GET /api/homes
 * @access  Private
 */
const getHomes = asyncHandler(async (req, res) => {
    const homes = await Home.find({ user: req.user._id, isActive: true });

    res.status(200).json({
        success: true,
        count: homes.length,
        homes,
    });
});

/**
 * @desc    Get single home by ID
 * @route   GET /api/homes/:id
 * @access  Private
 */
const getHome = asyncHandler(async (req, res) => {
    const home = await Home.findById(req.params.id);

    if (!home) {
        return res.status(404).json({
            success: false,
            message: 'Home not found',
        });
    }

    // Check ownership (unless admin)
    if (home.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to access this home',
        });
    }

    // Get device count
    const deviceCount = await Device.countDocuments({ home: home._id, isActive: true });

    res.status(200).json({
        success: true,
        home: {
            ...home.toObject(),
            deviceCount,
        },
    });
});

/**
 * @desc    Update home
 * @route   PUT /api/homes/:id
 * @access  Private
 */
const updateHome = asyncHandler(async (req, res) => {
    let home = await Home.findById(req.params.id);

    if (!home) {
        return res.status(404).json({
            success: false,
            message: 'Home not found',
        });
    }

    // Check ownership (unless admin)
    if (home.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this home',
        });
    }

    const {
        name,
        address,
        zipCode,
        squareFootage,
        numberOfRooms,
        homeType,
        electricityRate,
    } = req.body;

    home = await Home.findByIdAndUpdate(
        req.params.id,
        {
            name,
            address,
            zipCode,
            squareFootage,
            numberOfRooms,
            homeType,
            electricityRate,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json({
        success: true,
        message: 'Home updated successfully',
        home,
    });
});

/**
 * @desc    Delete home (soft delete)
 * @route   DELETE /api/homes/:id
 * @access  Private
 */
const deleteHome = asyncHandler(async (req, res) => {
    const home = await Home.findById(req.params.id);

    if (!home) {
        return res.status(404).json({
            success: false,
            message: 'Home not found',
        });
    }

    // Check ownership (unless admin)
    if (home.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this home',
        });
    }

    // Soft delete
    home.isActive = false;
    await home.save();

    // Also deactivate all devices in this home
    await Device.updateMany({ home: home._id }, { isActive: false });

    res.status(200).json({
        success: true,
        message: 'Home deleted successfully',
    });
});

/**
 * @desc    Get home statistics
 * @route   GET /api/homes/:id/stats
 * @access  Private
 */
const getHomeStats = asyncHandler(async (req, res) => {
    const home = await Home.findById(req.params.id);

    if (!home) {
        return res.status(404).json({
            success: false,
            message: 'Home not found',
        });
    }

    // Check ownership (unless admin)
    if (home.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to access this home',
        });
    }

    // Get device statistics
    const devices = await Device.find({ home: home._id, isActive: true });
    const deviceCount = devices.length;

    // Get total wattage
    const totalWattage = devices.reduce((sum, device) => sum + device.wattage, 0);

    // Get reading statistics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const readings = await Reading.find({
        home: home._id,
        timestamp: { $gte: thirtyDaysAgo },
    });

    const totalKWh = readings.reduce((sum, reading) => sum + reading.kWh, 0);
    const totalCost = readings.reduce((sum, reading) => sum + (reading.cost || 0), 0);

    // Calculate daily averages
    const avgDailyKWh = totalKWh / 30;
    const avgDailyCost = totalCost / 30;

    res.status(200).json({
        success: true,
        stats: {
            home: {
                id: home._id,
                name: home.name,
                zipCode: home.zipCode,
                squareFootage: home.squareFootage,
                homeType: home.homeType,
            },
            devices: {
                count: deviceCount,
                totalWattage: parseFloat(totalWattage.toFixed(2)),
            },
            usage: {
                last30Days: {
                    totalKWh: parseFloat(totalKWh.toFixed(4)),
                    totalCost: parseFloat(totalCost.toFixed(2)),
                    avgDailyKWh: parseFloat(avgDailyKWh.toFixed(4)),
                    avgDailyCost: parseFloat(avgDailyCost.toFixed(2)),
                },
            },
        },
    });
});

module.exports = {
    createHome,
    getHomes,
    getHome,
    updateHome,
    deleteHome,
    getHomeStats,
};
