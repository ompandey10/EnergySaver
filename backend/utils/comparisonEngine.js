const Home = require('../models/Home');
const Reading = require('../models/Reading');
const Device = require('../models/Device');

/**
 * Comparison Engine - Aggregate and compare neighborhood data
 * Provides insights by comparing usage patterns across similar homes
 */

/**
 * Get neighborhood statistics by zip code
 * @param {String} zipCode - Zip code to analyze
 * @param {Date} startDate - Start date for analysis
 * @param {Date} endDate - End date for analysis
 * @returns {Object} Neighborhood statistics
 */
const getNeighborhoodStats = async (zipCode, startDate, endDate) => {
    // Find all homes in the same zip code
    const homes = await Home.find({ zipCode, isActive: true });

    if (homes.length === 0) {
        return {
            zipCode,
            homeCount: 0,
            message: 'No homes found in this zip code',
        };
    }

    const homeIds = homes.map(h => h._id);

    // Get all readings for these homes in the period
    const readings = await Reading.find({
        home: { $in: homeIds },
        timestamp: { $gte: startDate, $lte: endDate },
    });

    if (readings.length === 0) {
        return {
            zipCode,
            homeCount: homes.length,
            avgKWh: 0,
            avgCost: 0,
            message: 'No data available for this period',
        };
    }

    // Calculate aggregates by home
    const homeStats = {};
    readings.forEach(reading => {
        const homeId = reading.home.toString();
        if (!homeStats[homeId]) {
            homeStats[homeId] = { totalKWh: 0, totalCost: 0 };
        }
        homeStats[homeId].totalKWh += reading.kWh;
        homeStats[homeId].totalCost += reading.cost || 0;
    });

    // Calculate neighborhood averages
    const totalKWh = Object.values(homeStats).reduce((sum, h) => sum + h.totalKWh, 0);
    const totalCost = Object.values(homeStats).reduce((sum, h) => sum + h.totalCost, 0);
    const homesWithData = Object.keys(homeStats).length;

    const avgKWh = totalKWh / homesWithData;
    const avgCost = totalCost / homesWithData;

    // Calculate percentiles
    const kWhValues = Object.values(homeStats).map(h => h.totalKWh).sort((a, b) => a - b);
    const p25 = kWhValues[Math.floor(homesWithData * 0.25)];
    const p50 = kWhValues[Math.floor(homesWithData * 0.5)];
    const p75 = kWhValues[Math.floor(homesWithData * 0.75)];
    const p90 = kWhValues[Math.floor(homesWithData * 0.9)];

    return {
        zipCode,
        homeCount: homes.length,
        homesWithData,
        avgKWh: parseFloat(avgKWh.toFixed(4)),
        avgCost: parseFloat(avgCost.toFixed(2)),
        minKWh: parseFloat(Math.min(...kWhValues).toFixed(4)),
        maxKWh: parseFloat(Math.max(...kWhValues).toFixed(4)),
        percentiles: {
            p25: parseFloat(p25.toFixed(4)),
            p50: parseFloat(p50.toFixed(4)),
            p75: parseFloat(p75.toFixed(4)),
            p90: parseFloat(p90.toFixed(4)),
        },
        startDate,
        endDate,
    };
};

/**
 * Compare home to neighborhood average
 * @param {String} homeId - Home ID to compare
 * @param {Date} startDate - Start date for comparison
 * @param {Date} endDate - End date for comparison
 * @returns {Object} Comparison results
 */
const compareToNeighborhood = async (homeId, startDate, endDate) => {
    const home = await Home.findById(homeId);
    if (!home) {
        throw new Error('Home not found');
    }

    // Get neighborhood stats
    const neighborhoodStats = await getNeighborhoodStats(home.zipCode, startDate, endDate);

    if (neighborhoodStats.homeCount === 0) {
        return {
            message: 'No neighborhood data available for comparison',
        };
    }

    // Get home's usage
    const homeReadings = await Reading.find({
        home: homeId,
        timestamp: { $gte: startDate, $lte: endDate },
    });

    const homeKWh = homeReadings.reduce((sum, r) => sum + r.kWh, 0);
    const homeCost = homeReadings.reduce((sum, r) => sum + (r.cost || 0), 0);

    // Calculate differences
    const kWhDifference = homeKWh - neighborhoodStats.avgKWh;
    const kWhPercentage = (kWhDifference / neighborhoodStats.avgKWh) * 100;

    const costDifference = homeCost - neighborhoodStats.avgCost;
    const costPercentage = (costDifference / neighborhoodStats.avgCost) * 100;

    // Determine ranking
    let ranking;
    if (homeKWh <= neighborhoodStats.percentiles.p25) {
        ranking = 'Top 25% (Most Efficient)';
    } else if (homeKWh <= neighborhoodStats.percentiles.p50) {
        ranking = 'Top 50% (Above Average)';
    } else if (homeKWh <= neighborhoodStats.percentiles.p75) {
        ranking = 'Top 75% (Below Average)';
    } else {
        ranking = 'Bottom 25% (Least Efficient)';
    }

    // Generate message
    let message;
    if (kWhPercentage < -10) {
        message = `Great job! Your home uses ${Math.abs(kWhPercentage).toFixed(1)}% less energy than your neighbors.`;
    } else if (kWhPercentage < 10) {
        message = `Your usage is similar to your neighborhood average.`;
    } else {
        message = `Your home uses ${kWhPercentage.toFixed(1)}% more energy than your neighbors. Consider ways to reduce usage.`;
    }

    return {
        home: {
            id: home._id,
            name: home.name,
            zipCode: home.zipCode,
            totalKWh: parseFloat(homeKWh.toFixed(4)),
            totalCost: parseFloat(homeCost.toFixed(2)),
        },
        neighborhood: neighborhoodStats,
        comparison: {
            kWhDifference: parseFloat(kWhDifference.toFixed(4)),
            kWhPercentage: parseFloat(kWhPercentage.toFixed(2)),
            costDifference: parseFloat(costDifference.toFixed(2)),
            costPercentage: parseFloat(costPercentage.toFixed(2)),
            ranking,
            message,
        },
        startDate,
        endDate,
    };
};

/**
 * Compare homes by size (square footage)
 * @param {String} homeId - Home ID to compare
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Size-based comparison
 */
const compareBySimilarSize = async (homeId, startDate, endDate) => {
    const home = await Home.findById(homeId);
    if (!home || !home.squareFootage) {
        throw new Error('Home not found or square footage not set');
    }

    // Find homes with similar square footage (±20%)
    const minSqFt = home.squareFootage * 0.8;
    const maxSqFt = home.squareFootage * 1.2;

    const similarHomes = await Home.find({
        zipCode: home.zipCode,
        squareFootage: { $gte: minSqFt, $lte: maxSqFt },
        isActive: true,
        _id: { $ne: homeId },
    });

    if (similarHomes.length === 0) {
        return {
            message: 'No similar-sized homes found for comparison',
        };
    }

    const similarHomeIds = similarHomes.map(h => h._id);

    // Get readings for similar homes
    const readings = await Reading.find({
        home: { $in: similarHomeIds },
        timestamp: { $gte: startDate, $lte: endDate },
    });

    // Calculate per-square-foot metrics
    const homeReadings = await Reading.find({
        home: homeId,
        timestamp: { $gte: startDate, $lte: endDate },
    });

    const homeKWh = homeReadings.reduce((sum, r) => sum + r.kWh, 0);
    const homeKWhPerSqFt = homeKWh / home.squareFootage;

    // Calculate similar homes average
    const homeStats = {};
    readings.forEach(reading => {
        const hId = reading.home.toString();
        if (!homeStats[hId]) {
            homeStats[hId] = 0;
        }
        homeStats[hId] += reading.kWh;
    });

    const perSqFtValues = [];
    for (const [hId, kWh] of Object.entries(homeStats)) {
        const h = similarHomes.find(home => home._id.toString() === hId);
        if (h && h.squareFootage) {
            perSqFtValues.push(kWh / h.squareFootage);
        }
    }

    const avgKWhPerSqFt = perSqFtValues.reduce((sum, v) => sum + v, 0) / perSqFtValues.length;
    const difference = homeKWhPerSqFt - avgKWhPerSqFt;
    const percentage = (difference / avgKWhPerSqFt) * 100;

    return {
        home: {
            id: home._id,
            name: home.name,
            squareFootage: home.squareFootage,
            totalKWh: parseFloat(homeKWh.toFixed(4)),
            kWhPerSqFt: parseFloat(homeKWhPerSqFt.toFixed(4)),
        },
        similarHomes: {
            count: similarHomes.length,
            avgSquareFootage: Math.round(
                similarHomes.reduce((sum, h) => sum + (h.squareFootage || 0), 0) / similarHomes.length
            ),
            avgKWhPerSqFt: parseFloat(avgKWhPerSqFt.toFixed(4)),
        },
        comparison: {
            difference: parseFloat(difference.toFixed(4)),
            percentage: parseFloat(percentage.toFixed(2)),
            message: percentage < 0
                ? `Your home is ${Math.abs(percentage).toFixed(1)}% more efficient per square foot than similar-sized homes.`
                : `Your home uses ${percentage.toFixed(1)}% more energy per square foot than similar-sized homes.`,
        },
        startDate,
        endDate,
    };
};

/**
 * Compare by home type
 * @param {String} homeId - Home ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Home type comparison
 */
const compareByHomeType = async (homeId, startDate, endDate) => {
    const home = await Home.findById(homeId);
    if (!home) {
        throw new Error('Home not found');
    }

    // Find homes of same type in same zip code
    const similarHomes = await Home.find({
        homeType: home.homeType,
        zipCode: home.zipCode,
        isActive: true,
        _id: { $ne: homeId },
    });

    if (similarHomes.length === 0) {
        return {
            message: `No other ${home.homeType}s found in your area for comparison`,
        };
    }

    const similarHomeIds = similarHomes.map(h => h._id);

    // Get usage data
    const [homeReadings, similarReadings] = await Promise.all([
        Reading.find({
            home: homeId,
            timestamp: { $gte: startDate, $lte: endDate },
        }),
        Reading.find({
            home: { $in: similarHomeIds },
            timestamp: { $gte: startDate, $lte: endDate },
        }),
    ]);

    const homeKWh = homeReadings.reduce((sum, r) => sum + r.kWh, 0);
    const homeCost = homeReadings.reduce((sum, r) => sum + (r.cost || 0), 0);

    // Calculate similar homes stats
    const homeStats = {};
    similarReadings.forEach(reading => {
        const hId = reading.home.toString();
        if (!homeStats[hId]) {
            homeStats[hId] = { kWh: 0, cost: 0 };
        }
        homeStats[hId].kWh += reading.kWh;
        homeStats[hId].cost += reading.cost || 0;
    });

    const avgKWh = Object.values(homeStats).reduce((sum, h) => sum + h.kWh, 0) / Object.keys(homeStats).length;
    const avgCost = Object.values(homeStats).reduce((sum, h) => sum + h.cost, 0) / Object.keys(homeStats).length;

    const kWhDifference = homeKWh - avgKWh;
    const percentage = (kWhDifference / avgKWh) * 100;

    return {
        home: {
            id: home._id,
            name: home.name,
            type: home.homeType,
            totalKWh: parseFloat(homeKWh.toFixed(4)),
            totalCost: parseFloat(homeCost.toFixed(2)),
        },
        similarHomes: {
            type: home.homeType,
            count: similarHomes.length,
            avgKWh: parseFloat(avgKWh.toFixed(4)),
            avgCost: parseFloat(avgCost.toFixed(2)),
        },
        comparison: {
            kWhDifference: parseFloat(kWhDifference.toFixed(4)),
            percentage: parseFloat(percentage.toFixed(2)),
            message: percentage < 0
                ? `Your ${home.homeType} uses ${Math.abs(percentage).toFixed(1)}% less energy than similar homes.`
                : `Your ${home.homeType} uses ${percentage.toFixed(1)}% more energy than similar homes.`,
        },
        startDate,
        endDate,
    };
};

/**
 * Get device comparison across neighborhood
 * @param {String} deviceType - Device type to compare
 * @param {String} zipCode - Zip code
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Device comparison
 */
const compareDeviceTypeInNeighborhood = async (deviceType, zipCode, startDate, endDate) => {
    // Find homes in zip code
    const homes = await Home.find({ zipCode, isActive: true });
    const homeIds = homes.map(h => h._id);

    // Find devices of this type
    const devices = await Device.find({
        home: { $in: homeIds },
        type: deviceType,
        isActive: true,
    });

    if (devices.length === 0) {
        return {
            message: `No ${deviceType} devices found in this neighborhood`,
        };
    }

    const deviceIds = devices.map(d => d._id);

    // Get readings
    const readings = await Reading.find({
        device: { $in: deviceIds },
        timestamp: { $gte: startDate, $lte: endDate },
    });

    // Calculate per-device stats
    const deviceStats = {};
    readings.forEach(reading => {
        const devId = reading.device.toString();
        if (!deviceStats[devId]) {
            deviceStats[devId] = { kWh: 0, cost: 0, count: 0 };
        }
        deviceStats[devId].kWh += reading.kWh;
        deviceStats[devId].cost += reading.cost || 0;
        deviceStats[devId].count += 1;
    });

    const kWhValues = Object.values(deviceStats).map(d => d.kWh);
    const avgKWh = kWhValues.reduce((sum, v) => sum + v, 0) / kWhValues.length;
    const minKWh = Math.min(...kWhValues);
    const maxKWh = Math.max(...kWhValues);

    return {
        deviceType,
        zipCode,
        deviceCount: devices.length,
        avgKWh: parseFloat(avgKWh.toFixed(4)),
        minKWh: parseFloat(minKWh.toFixed(4)),
        maxKWh: parseFloat(maxKWh.toFixed(4)),
        range: parseFloat((maxKWh - minKWh).toFixed(4)),
        startDate,
        endDate,
    };
};

/**
 * Get leaderboard of most efficient homes
 * @param {String} zipCode - Zip code
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Number} limit - Number of homes to return
 * @returns {Array} Leaderboard
 */
const getEfficiencyLeaderboard = async (zipCode, startDate, endDate, limit = 10) => {
    const homes = await Home.find({ zipCode, isActive: true });
    const homeIds = homes.map(h => h._id);

    const readings = await Reading.find({
        home: { $in: homeIds },
        timestamp: { $gte: startDate, $lte: endDate },
    });

    // Calculate per-home stats
    const homeStats = {};
    readings.forEach(reading => {
        const hId = reading.home.toString();
        if (!homeStats[hId]) {
            homeStats[hId] = { kWh: 0, cost: 0 };
        }
        homeStats[hId].kWh += reading.kWh;
        homeStats[hId].cost += reading.cost || 0;
    });

    // Build leaderboard
    const leaderboard = [];
    for (const [homeId, stats] of Object.entries(homeStats)) {
        const home = homes.find(h => h._id.toString() === homeId);
        if (home && home.squareFootage) {
            leaderboard.push({
                homeId,
                homeName: home.name,
                homeType: home.homeType,
                squareFootage: home.squareFootage,
                totalKWh: parseFloat(stats.kWh.toFixed(4)),
                kWhPerSqFt: parseFloat((stats.kWh / home.squareFootage).toFixed(4)),
            });
        }
    }

    // Sort by kWh per square foot (ascending)
    leaderboard.sort((a, b) => a.kWhPerSqFt - b.kWhPerSqFt);

    return leaderboard.slice(0, limit);
};

module.exports = {
    getNeighborhoodStats,
    compareToNeighborhood,
    compareBySimilarSize,
    compareByHomeType,
    compareDeviceTypeInNeighborhood,
    getEfficiencyLeaderboard,
};
