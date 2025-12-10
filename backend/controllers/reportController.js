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

module.exports = {
    getMonthlyReport,
    getNeighborhoodComparison,
    getSavingsTips,
    getCostAnalysis,
    getDashboardSummary,
};
