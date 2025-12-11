const Reading = require('../models/Reading');
const Home = require('../models/Home');
const Device = require('../models/Device');

/**
 * Cost Calculator - Calculate electricity costs based on Indian tariff system
 * Supports slab-based pricing, fixed charges, and taxes
 */

// Default Indian tariff slabs (can be overridden per home)
const DEFAULT_TARIFF_SLABS = [
    { minUnits: 0, maxUnits: 100, rate: 3.00 },      // 0-100 units: ₹3.00/kWh
    { minUnits: 101, maxUnits: 300, rate: 5.50 },    // 101-300 units: ₹5.50/kWh
    { minUnits: 301, maxUnits: 500, rate: 7.00 },    // 301-500 units: ₹7.00/kWh
    { minUnits: 501, maxUnits: Infinity, rate: 8.50 } // Above 500 units: ₹8.50/kWh
];

/**
 * Calculate cost using Indian slab-based tariff
 * @param {Number} totalKWh - Total energy consumption in kWh (units)
 * @param {Array} slabs - Array of slab objects with {minUnits, maxUnits, rate}
 * @returns {Object} Cost breakdown by slab
 */
const calculateSlabCost = (totalKWh, slabs = DEFAULT_TARIFF_SLABS) => {
    let totalCost = 0;
    let remainingUnits = totalKWh;
    const slabBreakdown = [];

    // Sort slabs by minUnits
    const sortedSlabs = [...slabs].sort((a, b) => a.minUnits - b.minUnits);

    for (const slab of sortedSlabs) {
        if (remainingUnits <= 0) break;

        const slabMin = slab.minUnits;
        const slabMax = slab.maxUnits || Infinity;
        const slabRange = slabMax - slabMin + 1;

        // Calculate units in this slab
        let unitsInSlab = 0;
        if (totalKWh > slabMin) {
            unitsInSlab = Math.min(remainingUnits, slabRange);
            if (totalKWh <= slabMax) {
                unitsInSlab = totalKWh - slabMin;
                if (slabMin === 0) unitsInSlab = Math.min(totalKWh, slabMax);
            }
        }

        // Recalculate for first slab
        if (slabMin === 0) {
            unitsInSlab = Math.min(totalKWh, slabMax);
        } else if (totalKWh > slabMin) {
            const prevMax = sortedSlabs[sortedSlabs.indexOf(slab) - 1]?.maxUnits || 0;
            unitsInSlab = Math.min(totalKWh - prevMax, slabMax - slabMin);
        } else {
            unitsInSlab = 0;
        }

        if (unitsInSlab > 0) {
            const slabCost = unitsInSlab * slab.rate;
            totalCost += slabCost;
            slabBreakdown.push({
                slab: `${slabMin}-${slabMax === Infinity ? '∞' : slabMax} units`,
                units: parseFloat(unitsInSlab.toFixed(4)),
                rate: slab.rate,
                cost: parseFloat(slabCost.toFixed(2)),
            });
        }
    }

    return {
        totalCost: parseFloat(totalCost.toFixed(2)),
        slabBreakdown,
    };
};

/**
 * Calculate simple slab cost (simplified version)
 * @param {Number} units - Total units consumed
 * @param {Array} slabs - Tariff slabs
 * @returns {Object} Total cost and effective rate
 */
const calculateSimpleSlabCost = (units, slabs = DEFAULT_TARIFF_SLABS) => {
    if (units <= 0) {
        return { totalCost: 0, effectiveRate: slabs[0]?.rate || 3 };
    }

    let cost = 0;
    let remaining = units;

    const sortedSlabs = [...slabs].sort((a, b) => (a.minUnits || 0) - (b.minUnits || 0));

    for (let i = 0; i < sortedSlabs.length && remaining > 0; i++) {
        const slab = sortedSlabs[i];
        const slabLimit = slab.limit || slab.maxUnits || (sortedSlabs[i + 1]?.minUnits - 1) || Infinity;
        const slabMin = slab.minUnits || (i === 0 ? 0 : sortedSlabs[i - 1]?.limit || sortedSlabs[i - 1]?.maxUnits || 0);
        const slabRange = slabLimit === Infinity ? remaining : (slabLimit - slabMin);
        const unitsInSlab = Math.min(remaining, slabRange);

        cost += unitsInSlab * slab.rate;
        remaining -= unitsInSlab;
    }

    const totalCost = parseFloat(cost.toFixed(2));
    const effectiveRate = units > 0 ? parseFloat((totalCost / units).toFixed(2)) : slabs[0]?.rate || 3;

    return { totalCost, effectiveRate };
};

/**
 * Calculate complete monthly bill (Indian format)
 * @param {Number} totalKWh - Total energy consumption in kWh
 * @param {Object} home - Home document with tariff configuration
 * @returns {Object} Complete bill breakdown
 */
const calculateMonthlyBill = (totalKWh, home) => {
    const slabs = home.tariffSlabs || DEFAULT_TARIFF_SLABS;
    const useSlabs = home.useSlabPricing !== false;

    // Energy charges
    let energyCharges;
    let slabBreakdown = [];

    if (useSlabs) {
        const slabResult = calculateSlabCost(totalKWh, slabs);
        energyCharges = slabResult.totalCost;
        slabBreakdown = slabResult.slabBreakdown;
    } else {
        energyCharges = totalKWh * (home.electricityRate || 6);
    }

    // Fixed charges
    const fixedCharges = home.fixedCharges || 50;
    const loadCharges = (home.sanctionedLoad || 5) * (home.perKWCharge || 20);
    const totalFixedCharges = fixedCharges + loadCharges;

    // Subtotal before tax
    const subtotal = energyCharges + totalFixedCharges;

    // Tax calculation
    const taxPercentage = home.taxPercentage || 5;
    const taxAmount = (subtotal * taxPercentage) / 100;

    // Total bill
    const totalBill = subtotal + taxAmount;

    // Calculate effective rate (average cost per unit)
    const effectiveRate = totalKWh > 0 ? totalBill / totalKWh : 0;

    return {
        unitsConsumed: parseFloat(totalKWh.toFixed(4)),
        energyCharges: parseFloat(energyCharges.toFixed(2)),
        slabBreakdown,
        fixedCharges: parseFloat(totalFixedCharges.toFixed(2)),
        fixedChargesBreakdown: {
            baseCharge: fixedCharges,
            loadCharge: loadCharges,
            sanctionedLoad: home.sanctionedLoad || 5,
            perKWCharge: home.perKWCharge || 20,
        },
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxPercentage,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        totalBill: parseFloat(totalBill.toFixed(2)),
        effectiveRate: parseFloat(effectiveRate.toFixed(2)),
        currency: 'INR',
        currencySymbol: '₹',
    };
};

/**
 * Calculate cost for a single reading (using effective rate or slab)
 * @param {Number} kWh - Energy consumption in kWh
 * @param {Number} rate - Rate per kWh in INR
 * @returns {Number} Cost in INR
 */
const calculateReadingCost = (kWh, rate) => {
    return parseFloat((kWh * rate).toFixed(4));
};

/**
 * Get effective rate for a given consumption level
 * @param {Number} totalKWh - Monthly consumption
 * @param {Array} slabs - Tariff slabs
 * @returns {Number} Effective rate per kWh
 */
const getEffectiveRate = (totalKWh, slabs = DEFAULT_TARIFF_SLABS) => {
    if (totalKWh <= 0) return slabs[0]?.rate || 6;
    const cost = calculateSimpleSlabCost(totalKWh, slabs);
    return parseFloat((cost / totalKWh).toFixed(2));
};

/**
 * Calculate cost with time-of-use rates
 * @param {Number} kWh - Energy consumption in kWh
 * @param {Date} timestamp - Timestamp of reading
 * @param {Object} rateStructure - TOU rate structure
 * @returns {Number} Cost in INR
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
 * Calculate cost with tiered pricing (legacy support)
 * @param {Number} totalKWh - Total energy consumption in kWh
 * @param {Array} tiers - Array of tier objects with {limit, rate}
 * @returns {Number} Cost in INR
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
 * Calculate total cost for a period using Indian slab-based tariff
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

    // Get effective rate for cost calculation
    const effectiveRate = home.useSlabPricing !== false
        ? getEffectiveRate(100, home.tariffSlabs || DEFAULT_TARIFF_SLABS) // Use rate for ~100 units as estimate
        : (home.electricityRate || 6);

    if (readings.length === 0) {
        return {
            totalKWh: 0,
            totalCost: 0,
            avgRate: effectiveRate,
            readingCount: 0,
            deviceBreakdown: [],
            dailyBreakdown: [],
            billBreakdown: null,
            currency: 'INR',
            currencySymbol: '₹',
        };
    }

    // Calculate total kWh
    const totalKWh = readings.reduce((sum, r) => sum + r.kWh, 0);

    // Calculate total cost using slab-based pricing
    let totalCost;
    let billBreakdown = null;

    if (home.useSlabPricing !== false) {
        // Use Indian slab-based tariff
        billBreakdown = calculateMonthlyBill(totalKWh, home);
        totalCost = billBreakdown.energyCharges; // Just energy charges for period cost (fixed charges added at month level)
    } else if (options.rateStructure === 'TOU' && options.touRates) {
        totalCost = readings.reduce(
            (sum, r) => sum + calculateTOUCost(r.kWh, r.timestamp, options.touRates),
            0
        );
    } else if (options.rateStructure === 'tiered' && options.tiers) {
        totalCost = calculateTieredCost(totalKWh, options.tiers);
    } else {
        // Simple flat rate
        totalCost = totalKWh * (home.electricityRate || 6);
    }

    // Calculate effective rate for this consumption
    const actualEffectiveRate = totalKWh > 0 ? totalCost / totalKWh : effectiveRate;

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
        // Use effective rate for device cost calculation
        deviceMap[deviceId].totalCost += reading.kWh * actualEffectiveRate;
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
        dailyMap[date].totalCost += reading.kWh * actualEffectiveRate;
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
        avgRate: parseFloat(actualEffectiveRate.toFixed(2)),
        avgDailyCost: parseFloat((totalCost / Math.max(dailyBreakdown.length, 1)).toFixed(2)),
        avgDailyKWh: parseFloat((totalKWh / Math.max(dailyBreakdown.length, 1)).toFixed(4)),
        readingCount: readings.length,
        deviceBreakdown,
        dailyBreakdown,
        billBreakdown,
        startDate,
        endDate,
        currency: 'INR',
        currencySymbol: '₹',
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
    // Indian tariff slab functions
    calculateSlabCost,
    calculateSimpleSlabCost,
    calculateMonthlyBill,
    getEffectiveRate,
    DEFAULT_TARIFF_SLABS,
};
