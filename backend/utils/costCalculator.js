const Reading = require('../models/Reading');
const Home = require('../models/Home');
const Device = require('../models/Device');

/**
 * Cost Calculator - Calculate electricity costs based on readings and rates
 * Handles various pricing structures and provides detailed cost breakdowns
 */

/**
 * Calculate cost for a single reading
 * @param {Number} kWh - Energy consumption in kWh
 * @param {Number} rate - Rate per kWh in dollars
 * @returns {Number} Cost in dollars
 */
const calculateReadingCost = (kWh, rate) => {
    return parseFloat((kWh * rate).toFixed(4));
};

/**
 * Calculate cost with time-of-use rates
 * @param {Number} kWh - Energy consumption in kWh
 * @param {Date} timestamp - Timestamp of reading
 * @param {Object} rateStructure - TOU rate structure
 * @returns {Number} Cost in dollars
 */
const calculateTOUCost = (kWh, timestamp, rateStructure) => {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let rate;

    // Determine rate based on time and day
    if (isWeekend && rateStructure.weekend) {
        rate = rateStructure.weekend;
    } else if (hour >= 0 && hour < 6) {
        // Off-peak: 12am-6am
        rate = rateStructure.offPeak || rateStructure.base;
    } else if (hour >= 6 && hour < 10) {
        // Mid-peak: 6am-10am
        rate = rateStructure.midPeak || rateStructure.base;
    } else if (hour >= 10 && hour < 18) {
        // Peak: 10am-6pm
        rate = rateStructure.peak || rateStructure.base;
    } else if (hour >= 18 && hour < 22) {
        // Mid-peak: 6pm-10pm
        rate = rateStructure.midPeak || rateStructure.base;
    } else {
        // Off-peak: 10pm-12am
        rate = rateStructure.offPeak || rateStructure.base;
    }

    return calculateReadingCost(kWh, rate);
};

/**
 * Calculate cost with tiered pricing
 * @param {Number} totalKWh - Total energy consumption in kWh
 * @param {Array} tiers - Array of tier objects with {limit, rate}
 * @returns {Number} Cost in dollars
 */
const calculateTieredCost = (totalKWh, tiers) => {
    let cost = 0;
    let remainingKWh = totalKWh;

    for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        const tierLimit = tier.limit || Infinity;
        const tierRate = tier.rate;

        if (remainingKWh <= 0) break;

        const kWhInTier = Math.min(remainingKWh, tierLimit);
        cost += calculateReadingCost(kWhInTier, tierRate);
        remainingKWh -= kWhInTier;
    }

    return parseFloat(cost.toFixed(2));
};

/**
 * Calculate total cost for a period
 * @param {String} homeId - Home ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} options - Calculation options
 * @returns {Object} Cost breakdown
 */
const calculatePeriodCost = async (homeId, startDate, endDate, options = {}) => {
    const home = await Home.findById(homeId);
    if (!home) {
        throw new Error('Home not found');
    }

    const readings = await Reading.find({
        home: homeId,
        timestamp: { $gte: startDate, $lte: endDate },
    }).populate('device', 'name type');

    if (readings.length === 0) {
        return {
            totalKWh: 0,
            totalCost: 0,
            avgRate: home.electricityRate,
            readingCount: 0,
            deviceBreakdown: [],
            dailyBreakdown: [],
        };
    }

    // Calculate totals
    const totalKWh = readings.reduce((sum, r) => sum + r.kWh, 0);
    let totalCost;

    // Use different pricing methods if specified
    if (options.rateStructure === 'TOU' && options.touRates) {
        totalCost = readings.reduce(
            (sum, r) => sum + calculateTOUCost(r.kWh, r.timestamp, options.touRates),
            0
        );
    } else if (options.rateStructure === 'tiered' && options.tiers) {
        totalCost = calculateTieredCost(totalKWh, options.tiers);
    } else {
        // Simple flat rate
        totalCost = readings.reduce(
            (sum, r) => sum + calculateReadingCost(r.kWh, home.electricityRate),
            0
        );
    }

    // Device breakdown
    const deviceMap = {};
    readings.forEach(reading => {
        const deviceId = reading.device._id.toString();
        if (!deviceMap[deviceId]) {
            deviceMap[deviceId] = {
                deviceId,
                deviceName: reading.device.name,
                deviceType: reading.device.type,
                totalKWh: 0,
                totalCost: 0,
                readingCount: 0,
            };
        }
        deviceMap[deviceId].totalKWh += reading.kWh;
        deviceMap[deviceId].totalCost += calculateReadingCost(reading.kWh, home.electricityRate);
        deviceMap[deviceId].readingCount += 1;
    });

    const deviceBreakdown = Object.values(deviceMap)
        .map(d => ({
            ...d,
            totalKWh: parseFloat(d.totalKWh.toFixed(4)),
            totalCost: parseFloat(d.totalCost.toFixed(2)),
            percentage: parseFloat(((d.totalKWh / totalKWh) * 100).toFixed(2)),
        }))
        .sort((a, b) => b.totalCost - a.totalCost);

    // Daily breakdown
    const dailyMap = {};
    readings.forEach(reading => {
        const date = reading.timestamp.toISOString().split('T')[0];
        if (!dailyMap[date]) {
            dailyMap[date] = {
                date,
                totalKWh: 0,
                totalCost: 0,
                readingCount: 0,
            };
        }
        dailyMap[date].totalKWh += reading.kWh;
        dailyMap[date].totalCost += calculateReadingCost(reading.kWh, home.electricityRate);
        dailyMap[date].readingCount += 1;
    });

    const dailyBreakdown = Object.values(dailyMap)
        .map(d => ({
            ...d,
            totalKWh: parseFloat(d.totalKWh.toFixed(4)),
            totalCost: parseFloat(d.totalCost.toFixed(2)),
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
        totalKWh: parseFloat(totalKWh.toFixed(4)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        avgRate: home.electricityRate,
        avgDailyCost: parseFloat((totalCost / dailyBreakdown.length).toFixed(2)),
        avgDailyKWh: parseFloat((totalKWh / dailyBreakdown.length).toFixed(4)),
        readingCount: readings.length,
        deviceBreakdown,
        dailyBreakdown,
        startDate,
        endDate,
    };
};

/**
 * Calculate monthly cost
 * @param {String} homeId - Home ID
 * @param {Number} year - Year
 * @param {Number} month - Month (1-12)
 * @returns {Object} Monthly cost breakdown
 */
const calculateMonthlyCost = async (homeId, year, month) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return await calculatePeriodCost(homeId, startDate, endDate);
};

/**
 * Calculate cost projection for the rest of the month
 * @param {String} homeId - Home ID
 * @returns {Object} Projected cost for current month
 */
const calculateMonthlyProjection = async (homeId) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get actual usage so far this month
    const actualCost = await calculatePeriodCost(homeId, monthStart, now);

    // Calculate daily average
    const daysElapsed = now.getDate();
    const avgDailyCost = actualCost.totalCost / daysElapsed;

    // Project for remaining days
    const daysInMonth = monthEnd.getDate();
    const daysRemaining = daysInMonth - daysElapsed;
    const projectedRemainingCost = avgDailyCost * daysRemaining;
    const projectedTotalCost = actualCost.totalCost + projectedRemainingCost;

    return {
        currentMonth: {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
        },
        daysElapsed,
        daysRemaining,
        daysInMonth,
        actualCost: parseFloat(actualCost.totalCost.toFixed(2)),
        actualKWh: actualCost.totalKWh,
        avgDailyCost: parseFloat(avgDailyCost.toFixed(2)),
        projectedRemainingCost: parseFloat(projectedRemainingCost.toFixed(2)),
        projectedTotalCost: parseFloat(projectedTotalCost.toFixed(2)),
        projectedTotalKWh: parseFloat(
            (actualCost.totalKWh * (daysInMonth / daysElapsed)).toFixed(4)
        ),
    };
};

/**
 * Compare costs across multiple periods
 * @param {String} homeId - Home ID
 * @param {Array} periods - Array of {startDate, endDate, label}
 * @returns {Object} Comparison data
 */
const comparePeriodCosts = async (homeId, periods) => {
    const comparisons = [];

    for (const period of periods) {
        const cost = await calculatePeriodCost(homeId, period.startDate, period.endDate);
        comparisons.push({
            label: period.label,
            startDate: period.startDate,
            endDate: period.endDate,
            totalKWh: cost.totalKWh,
            totalCost: cost.totalCost,
            avgDailyCost: cost.avgDailyCost,
        });
    }

    // Calculate percentage changes
    for (let i = 1; i < comparisons.length; i++) {
        const current = comparisons[i];
        const previous = comparisons[i - 1];

        current.kWhChange = parseFloat(
            (((current.totalKWh - previous.totalKWh) / previous.totalKWh) * 100).toFixed(2)
        );
        current.costChange = parseFloat(
            (((current.totalCost - previous.totalCost) / previous.totalCost) * 100).toFixed(2)
        );
    }

    return comparisons;
};

/**
 * Calculate device efficiency (cost per operation/hour)
 * @param {String} deviceId - Device ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Efficiency metrics
 */
const calculateDeviceEfficiency = async (deviceId, startDate, endDate) => {
    const device = await Device.findById(deviceId).populate('home');
    if (!device) {
        throw new Error('Device not found');
    }

    const readings = await Reading.find({
        device: deviceId,
        timestamp: { $gte: startDate, $lte: endDate },
    });

    const totalKWh = readings.reduce((sum, r) => sum + r.kWh, 0);
    const totalCost = readings.reduce(
        (sum, r) => sum + calculateReadingCost(r.kWh, device.home.electricityRate),
        0
    );
    const activeReadings = readings.filter(r => r.watts > 0);
    const activeHours = activeReadings.length;

    return {
        deviceId: device._id,
        deviceName: device.name,
        deviceType: device.type,
        totalKWh: parseFloat(totalKWh.toFixed(4)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        activeHours,
        costPerHour: activeHours > 0 ? parseFloat((totalCost / activeHours).toFixed(4)) : 0,
        kWhPerHour: activeHours > 0 ? parseFloat((totalKWh / activeHours).toFixed(4)) : 0,
        estimatedMonthlyCost: parseFloat(((totalCost / activeHours) * 24 * 30).toFixed(2)),
    };
};

/**
 * Calculate potential savings from rate optimization
 * @param {String} homeId - Home ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} touRates - Time-of-use rates to compare
 * @returns {Object} Savings analysis
 */
const calculateRateSavings = async (homeId, startDate, endDate, touRates) => {
    const home = await Home.findById(homeId);
    if (!home) {
        throw new Error('Home not found');
    }

    const readings = await Reading.find({
        home: homeId,
        timestamp: { $gte: startDate, $lte: endDate },
    });

    // Current flat rate cost
    const flatRateCost = readings.reduce(
        (sum, r) => sum + calculateReadingCost(r.kWh, home.electricityRate),
        0
    );

    // TOU rate cost
    const touCost = readings.reduce(
        (sum, r) => sum + calculateTOUCost(r.kWh, r.timestamp, touRates),
        0
    );

    const savings = flatRateCost - touCost;
    const savingsPercentage = (savings / flatRateCost) * 100;

    return {
        currentRate: home.electricityRate,
        flatRateCost: parseFloat(flatRateCost.toFixed(2)),
        touCost: parseFloat(touCost.toFixed(2)),
        savings: parseFloat(savings.toFixed(2)),
        savingsPercentage: parseFloat(savingsPercentage.toFixed(2)),
        recommendation: savings > 0 ? 'Switch to TOU rates' : 'Keep flat rate',
    };
};

module.exports = {
    calculateReadingCost,
    calculateTOUCost,
    calculateTieredCost,
    calculatePeriodCost,
    calculateMonthlyCost,
    calculateMonthlyProjection,
    comparePeriodCosts,
    calculateDeviceEfficiency,
    calculateRateSavings,
};
