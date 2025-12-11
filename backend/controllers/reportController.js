const Home = require('../models/Home');
const { asyncHandler } = require('../middleware/error');
const { generateMonthlyReport } = require('../utils/pdfGenerator');
const {
    compareToNeighborhood,
    compareBySimilarSize,
    compareByHomeType,
} = require('../utils/comparisonEngine');
const {
    generateTips,
    getHighPriorityTips,
    getTipsByCategory,
    calculatePotentialSavings,
} = require('../utils/tipGenerator');
const {
    calculateMonthlyCost,
    calculatePeriodCost,
    calculateMonthlyProjection,
    comparePeriodCosts,
} = require('../utils/costCalculator');

/**
 * @desc    Generate monthly report PDF
 * @route   GET /api/reports/monthly
 * @access  Private
 */
const getMonthlyReport = asyncHandler(async (req, res) => {
    const { homeId, month, year } = req.query;

    if (!homeId || !month || !year) {
        return res.status(400).json({
            success: false,
            message: 'Please provide homeId, month, and year',
        });
    }

    // Verify home ownership
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

    // Check if requested period is before account creation
    const accountCreatedAt = req.user.createdAt;
    if (accountCreatedAt) {
        const requestedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const accountMonth = new Date(accountCreatedAt.getFullYear(), accountCreatedAt.getMonth(), 1);
        if (requestedDate < accountMonth) {
            return res.status(400).json({
                success: false,
                message: `Cannot generate reports before your account was created (${accountCreatedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`,
            });
        }
    }

    // Generate PDF report
    const pdfPath = await generateMonthlyReport(homeId, parseInt(year), parseInt(month));

    // Send file
    res.download(pdfPath, `energy-report-${month}-${year}.pdf`, (err) => {
        if (err) {
            console.error('Error sending PDF:', err);
            res.status(500).json({
                success: false,
                message: 'Error generating report',
            });
        }
    });
});

/**
 * @desc    Get neighborhood comparison
 * @route   GET /api/reports/comparison
 * @access  Private
 */
const getNeighborhoodComparison = asyncHandler(async (req, res) => {
    const { homeId, startDate, endDate, comparisonType = 'neighborhood' } = req.query;

    if (!homeId) {
        return res.status(400).json({
            success: false,
            message: 'Please provide homeId',
        });
    }

    // Verify home ownership
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

    // Set default date range (last 30 days)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    let comparisonData;

    try {
        switch (comparisonType) {
            case 'size':
                comparisonData = await compareBySimilarSize(homeId, start, end);
                break;
            case 'type':
                comparisonData = await compareByHomeType(homeId, start, end);
                break;
            case 'neighborhood':
            default:
                comparisonData = await compareToNeighborhood(homeId, start, end);
                break;
        }

        res.status(200).json({
            success: true,
            comparisonType,
            data: comparisonData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating comparison',
        });
    }
});

/**
 * @desc    Get personalized savings tips
 * @route   GET /api/reports/savings-tips
 * @access  Private
 */
const getSavingsTips = asyncHandler(async (req, res) => {
    const { homeId, category, priority } = req.query;

    if (!homeId) {
        return res.status(400).json({
            success: false,
            message: 'Please provide homeId',
        });
    }

    // Verify home ownership
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

    // Analyze last 30 days
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    let tips;

    if (category) {
        tips = await getTipsByCategory(homeId, category, startDate, endDate);
    } else if (priority === 'high') {
        tips = await getHighPriorityTips(homeId, startDate, endDate);
    } else {
        tips = await generateTips(homeId, startDate, endDate);
    }

    const potentialSavings = calculatePotentialSavings(tips);

    res.status(200).json({
        success: true,
        home: {
            id: home._id,
            name: home.name,
        },
        count: tips.length,
        potentialSavings,
        tips,
    });
});

/**
 * @desc    Get cost analysis and breakdown
 * @route   GET /api/reports/cost-analysis
 * @access  Private
 */
const getCostAnalysis = asyncHandler(async (req, res) => {
    const { homeId, startDate, endDate, analysisType = 'period' } = req.query;

    if (!homeId) {
        return res.status(400).json({
            success: false,
            message: 'Please provide homeId',
        });
    }

    // Verify home ownership
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

    let analysisData;

    try {
        switch (analysisType) {
            case 'monthly':
                const now = new Date();
                analysisData = await calculateMonthlyCost(
                    homeId,
                    now.getFullYear(),
                    now.getMonth() + 1
                );
                break;

            case 'projection':
                analysisData = await calculateMonthlyProjection(homeId);
                break;

            case 'comparison':
                // Compare current month vs last month
                const currentMonth = new Date();
                const lastMonth = new Date(currentMonth);
                lastMonth.setMonth(lastMonth.getMonth() - 1);

                const periods = [
                    {
                        label: 'Last Month',
                        startDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
                        endDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0, 23, 59, 59),
                    },
                    {
                        label: 'Current Month',
                        startDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
                        endDate: currentMonth,
                    },
                ];

                analysisData = await comparePeriodCosts(homeId, periods);
                break;

            case 'period':
            default:
                const end = endDate ? new Date(endDate) : new Date();
                const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
                analysisData = await calculatePeriodCost(homeId, start, end);
                break;
        }

        res.status(200).json({
            success: true,
            analysisType,
            home: {
                id: home._id,
                name: home.name,
            },
            data: analysisData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating cost analysis',
        });
    }
});

/**
 * @desc    Get dashboard summary
 * @route   GET /api/reports/dashboard
 * @access  Private
 */
const getDashboardSummary = asyncHandler(async (req, res) => {
    const { homeId } = req.query;

    if (!homeId) {
        return res.status(400).json({
            success: false,
            message: 'Please provide homeId',
        });
    }

    // Verify home ownership
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

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all dashboard data in parallel
    const [
        currentMonthCost,
        projection,
        tips,
        comparison,
    ] = await Promise.all([
        calculateMonthlyCost(homeId, endDate.getFullYear(), endDate.getMonth() + 1),
        calculateMonthlyProjection(homeId),
        generateTips(homeId, startDate, endDate),
        compareToNeighborhood(homeId, startDate, endDate).catch(() => null),
    ]);

    const highPriorityTips = tips.filter(t => t.priority === 'high');
    const potentialSavings = calculatePotentialSavings(tips);

    res.status(200).json({
        success: true,
        home: {
            id: home._id,
            name: home.name,
        },
        summary: {
            currentMonth: {
                totalCost: currentMonthCost.totalCost,
                totalKWh: currentMonthCost.totalKWh,
                avgDailyCost: currentMonthCost.avgDailyCost,
            },
            projection: {
                projectedTotalCost: projection.projectedTotalCost,
                daysRemaining: projection.daysRemaining,
            },
            tips: {
                totalTips: tips.length,
                highPriorityCount: highPriorityTips.length,
                potentialMonthlySavings: potentialSavings.monthly.average,
            },
            comparison: comparison ? {
                ranking: comparison.comparison.ranking,
                percentageDifference: comparison.comparison.kWhPercentage,
            } : null,
        },
        details: {
            topDevices: currentMonthCost.deviceBreakdown.slice(0, 5),
            topTips: highPriorityTips.slice(0, 3),
        },
    });
});

/**
 * @desc    Get consumption report for a home
 * @route   GET /api/reports/consumption/:homeId
 * @access  Private
 */
const getConsumptionReport = asyncHandler(async (req, res) => {
    const { homeId } = req.params;
    const { month, year, startDate, endDate } = req.query;

    // Verify home ownership
    const home = await Home.findById(homeId).populate('devices');
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

    // Determine date range
    let start, end;
    if (month && year) {
        start = new Date(parseInt(year), parseInt(month) - 1, 1);
        end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    } else if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
    } else {
        // Default to current month
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Check if requested period is before account creation
    const accountCreatedAt = req.user.createdAt;
    if (accountCreatedAt) {
        const accountMonth = new Date(accountCreatedAt.getFullYear(), accountCreatedAt.getMonth(), 1);
        if (start < accountMonth) {
            return res.status(400).json({
                success: false,
                message: `Cannot generate reports before your account was created (${accountCreatedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`,
                accountCreatedAt: accountCreatedAt,
            });
        }
    }

    // Get readings for the period
    const Reading = require('../models/Reading');
    const Device = require('../models/Device');

    const devices = await Device.find({ home: homeId });
    const deviceIds = devices.map(d => d._id);

    const readings = await Reading.find({
        device: { $in: deviceIds },
        timestamp: { $gte: start, $lte: end },
    }).populate('device', 'name type wattage location');

    // Calculate totals
    let totalKWh = 0;
    let totalCost = 0;
    const deviceBreakdown = {};
    const dailyData = {};

    readings.forEach(reading => {
        totalKWh += reading.kWh || 0;
        totalCost += reading.cost || 0;

        // Device breakdown
        const deviceId = reading.device?._id?.toString();
        if (deviceId) {
            if (!deviceBreakdown[deviceId]) {
                deviceBreakdown[deviceId] = {
                    deviceId,
                    name: reading.device.name,
                    type: reading.device.type,
                    totalKWh: 0,
                    totalCost: 0,
                    readingCount: 0,
                };
            }
            deviceBreakdown[deviceId].totalKWh += reading.kWh || 0;
            deviceBreakdown[deviceId].totalCost += reading.cost || 0;
            deviceBreakdown[deviceId].readingCount++;
        }

        // Daily breakdown
        const day = reading.timestamp.toISOString().split('T')[0];
        if (!dailyData[day]) {
            dailyData[day] = { date: day, kWh: 0, cost: 0 };
        }
        dailyData[day].kWh += reading.kWh || 0;
        dailyData[day].cost += reading.cost || 0;
    });

    // Convert to arrays and sort
    const deviceStats = Object.values(deviceBreakdown).sort((a, b) => b.totalKWh - a.totalKWh);
    const dailyStats = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate averages
    const daysInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const avgDailyKWh = daysInPeriod > 0 ? totalKWh / daysInPeriod : 0;
    const avgDailyCost = daysInPeriod > 0 ? totalCost / daysInPeriod : 0;

    // Check if this is the current month - add live consumption from active devices
    const now = new Date();
    const isCurrentMonth = (
        start.getMonth() === now.getMonth() &&
        start.getFullYear() === now.getFullYear()
    );

    let liveConsumption = null;
    if (isCurrentMonth) {
        const activeDevices = devices.filter(d => d.isActive && d.lastTurnedOn);
        let liveTotalKWh = 0;
        let liveTotalCost = 0;
        let liveTotalWatts = 0;
        const liveDevices = [];

        for (const device of activeDevices) {
            const sessionStart = device.lastTurnedOn;
            const sessionDuration = (now - sessionStart) / (1000 * 60 * 60); // hours
            const sessionKWh = (device.wattage * sessionDuration) / 1000;
            const sessionCost = sessionKWh * (home.electricityRate || 0.12);

            liveTotalKWh += sessionKWh;
            liveTotalCost += sessionCost;
            liveTotalWatts += device.wattage || 0;

            liveDevices.push({
                deviceId: device._id,
                name: device.name,
                type: device.type,
                wattage: device.wattage,
                location: device.location,
                sessionStart: sessionStart,
                sessionDuration: parseFloat((sessionDuration * 60).toFixed(2)), // minutes
                sessionKWh: parseFloat(sessionKWh.toFixed(4)),
                sessionCost: parseFloat(sessionCost.toFixed(4)),
            });

            // Add live consumption to device breakdown
            const deviceId = device._id.toString();
            if (deviceBreakdown[deviceId]) {
                deviceBreakdown[deviceId].liveKWh = parseFloat(sessionKWh.toFixed(4));
                deviceBreakdown[deviceId].liveCost = parseFloat(sessionCost.toFixed(4));
                deviceBreakdown[deviceId].totalKWh += sessionKWh;
                deviceBreakdown[deviceId].totalCost += sessionCost;
            } else {
                deviceBreakdown[deviceId] = {
                    deviceId,
                    name: device.name,
                    type: device.type,
                    totalKWh: parseFloat(sessionKWh.toFixed(4)),
                    totalCost: parseFloat(sessionCost.toFixed(4)),
                    liveKWh: parseFloat(sessionKWh.toFixed(4)),
                    liveCost: parseFloat(sessionCost.toFixed(4)),
                    readingCount: 0,
                    isLiveOnly: true,
                };
            }
        }

        liveConsumption = {
            activeDeviceCount: activeDevices.length,
            totalWatts: liveTotalWatts,
            totalKWh: parseFloat(liveTotalKWh.toFixed(4)),
            totalCost: parseFloat(liveTotalCost.toFixed(4)),
            devices: liveDevices,
        };

        // Add live consumption to totals
        totalKWh += liveTotalKWh;
        totalCost += liveTotalCost;

        // Add today's live data to daily breakdown
        const today = now.toISOString().split('T')[0];
        if (dailyData[today]) {
            dailyData[today].kWh += liveTotalKWh;
            dailyData[today].cost += liveTotalCost;
            dailyData[today].liveKWh = liveTotalKWh;
            dailyData[today].liveCost = liveTotalCost;
        } else {
            dailyData[today] = {
                date: today,
                kWh: liveTotalKWh,
                cost: liveTotalCost,
                liveKWh: liveTotalKWh,
                liveCost: liveTotalCost,
            };
        }
    }

    // Recalculate device stats with live data
    const finalDeviceStats = Object.values(deviceBreakdown).sort((a, b) => b.totalKWh - a.totalKWh);
    const finalDailyStats = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
        success: true,
        report: {
            home: {
                _id: home._id,
                name: home.name,
                electricityRate: home.electricityRate || 0.12,
            },
            period: {
                start: start.toISOString(),
                end: end.toISOString(),
                days: daysInPeriod,
                isCurrentMonth,
            },
            summary: {
                totalKWh: parseFloat(totalKWh.toFixed(4)),
                totalCost: parseFloat(totalCost.toFixed(2)),
                avgDailyKWh: parseFloat(avgDailyKWh.toFixed(4)),
                avgDailyCost: parseFloat(avgDailyCost.toFixed(2)),
                totalReadings: readings.length,
                totalDevices: devices.length,
                activeDevices: devices.filter(d => d.isActive).length,
            },
            liveConsumption,
            deviceBreakdown: finalDeviceStats,
            dailyBreakdown: finalDailyStats,
        },
    });
});

module.exports = {
    getMonthlyReport,
    getNeighborhoodComparison,
    getSavingsTips,
    getCostAnalysis,
    getDashboardSummary,
    getConsumptionReport,
};
