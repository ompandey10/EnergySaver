const Device = require('../models/Device');
const Reading = require('../models/Reading');

/**
 * Reading Simulator - Generates realistic energy consumption data
 * Simulates device usage patterns based on time of day, device type, and wattage
 */

// Device usage patterns by type (hourly usage probability 0-1)
const USAGE_PATTERNS = {
    hvac: {
        peak_hours: [0, 1, 2, 3, 4, 5, 6, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
        peak_probability: 0.8,
        off_peak_probability: 0.5,
        variance: 0.2,
    },
    water_heater: {
        peak_hours: [6, 7, 8, 18, 19, 20, 21],
        peak_probability: 0.7,
        off_peak_probability: 0.3,
        variance: 0.15,
    },
    refrigerator: {
        peak_hours: [], // Always on
        peak_probability: 0.9,
        off_peak_probability: 0.9,
        variance: 0.05,
    },
    washer: {
        peak_hours: [7, 8, 9, 18, 19, 20],
        peak_probability: 0.4,
        off_peak_probability: 0.1,
        variance: 0.3,
    },
    dryer: {
        peak_hours: [7, 8, 9, 18, 19, 20, 21],
        peak_probability: 0.4,
        off_peak_probability: 0.1,
        variance: 0.3,
    },
    dishwasher: {
        peak_hours: [20, 21, 22],
        peak_probability: 0.5,
        off_peak_probability: 0.1,
        variance: 0.25,
    },
    oven: {
        peak_hours: [11, 12, 17, 18, 19],
        peak_probability: 0.6,
        off_peak_probability: 0.15,
        variance: 0.35,
    },
    microwave: {
        peak_hours: [7, 8, 12, 13, 18, 19],
        peak_probability: 0.3,
        off_peak_probability: 0.1,
        variance: 0.4,
    },
    lighting: {
        peak_hours: [6, 7, 18, 19, 20, 21, 22, 23],
        peak_probability: 0.8,
        off_peak_probability: 0.2,
        variance: 0.15,
    },
    tv: {
        peak_hours: [18, 19, 20, 21, 22, 23],
        peak_probability: 0.7,
        off_peak_probability: 0.2,
        variance: 0.25,
    },
    computer: {
        peak_hours: [8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21],
        peak_probability: 0.6,
        off_peak_probability: 0.3,
        variance: 0.2,
    },
    gaming_console: {
        peak_hours: [15, 16, 17, 18, 19, 20, 21, 22],
        peak_probability: 0.5,
        off_peak_probability: 0.1,
        variance: 0.3,
    },
    ev_charger: {
        peak_hours: [0, 1, 2, 3, 4, 5, 22, 23],
        peak_probability: 0.8,
        off_peak_probability: 0.2,
        variance: 0.15,
    },
    pool_pump: {
        peak_hours: [10, 11, 12, 13, 14, 15],
        peak_probability: 0.9,
        off_peak_probability: 0.3,
        variance: 0.1,
    },
    other: {
        peak_hours: [],
        peak_probability: 0.5,
        off_peak_probability: 0.3,
        variance: 0.25,
    },
};

/**
 * Generate a reading for a device based on usage patterns
 * @param {Object} device - Device document
 * @param {Date} timestamp - Timestamp for the reading
 * @returns {Object} Reading data
 */
const generateDeviceReading = (device, timestamp = new Date()) => {
    const hour = timestamp.getHours();
    const pattern = USAGE_PATTERNS[device.type] || USAGE_PATTERNS.other;

    // Determine if device is in peak usage time
    const isPeakHour = pattern.peak_hours.includes(hour);
    const baseUsageProbability = isPeakHour
        ? pattern.peak_probability
        : pattern.off_peak_probability;

    // Add random variance
    const variance = (Math.random() - 0.5) * 2 * pattern.variance;
    const usageProbability = Math.max(0, Math.min(1, baseUsageProbability + variance));

    // Determine if device is currently on
    const isOn = Math.random() < usageProbability;

    if (!isOn) {
        return {
            device: device._id,
            home: device.home,
            kWh: 0,
            watts: 0,
            voltage: 0,
            current: 0,
            powerFactor: 0,
            duration: 60, // 1 hour in minutes
            timestamp,
            isSimulated: true,
        };
    }

    // Calculate power consumption with some variance
    const powerVariance = (Math.random() - 0.5) * 0.2; // ±10% variance
    const actualWattage = device.wattage * (1 + powerVariance);

    // Calculate kWh for 1 hour of usage
    const kWh = (actualWattage * 1) / 1000; // Wh to kWh

    // Simulate electrical parameters
    const voltage = 120 + (Math.random() - 0.5) * 10; // 115-125V
    const current = actualWattage / voltage;
    const powerFactor = 0.85 + Math.random() * 0.15; // 0.85-1.0

    return {
        device: device._id,
        home: device.home,
        kWh: parseFloat(kWh.toFixed(4)),
        watts: parseFloat(actualWattage.toFixed(2)),
        voltage: parseFloat(voltage.toFixed(2)),
        current: parseFloat(current.toFixed(2)),
        powerFactor: parseFloat(powerFactor.toFixed(2)),
        duration: 60,
        timestamp,
        isSimulated: true,
    };
};

/**
 * Generate readings for a device over a time period
 * @param {String} deviceId - Device ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Number} intervalHours - Interval between readings in hours (default: 1)
 * @returns {Array} Array of reading objects
 */
const generateReadingsForPeriod = async (deviceId, startDate, endDate, intervalHours = 1) => {
    const device = await Device.findById(deviceId);
    if (!device) {
        throw new Error('Device not found');
    }

    const readings = [];
    const currentTime = new Date(startDate);

    while (currentTime <= endDate) {
        const reading = generateDeviceReading(device, new Date(currentTime));
        readings.push(reading);
        currentTime.setHours(currentTime.getHours() + intervalHours);
    }

    return readings;
};

/**
 * Generate and save readings for all devices in a home
 * @param {String} homeId - Home ID
 * @param {Date} timestamp - Timestamp for readings
 * @returns {Array} Array of saved reading documents
 */
const generateHomeReadings = async (homeId, timestamp = new Date()) => {
    const devices = await Device.find({ home: homeId, isActive: true });

    const readingsData = devices.map(device =>
        generateDeviceReading(device, timestamp)
    );

    // Save all readings
    const readings = await Reading.insertMany(readingsData);
    return readings;
};

/**
 * Generate historical data for a device
 * @param {String} deviceId - Device ID
 * @param {Number} daysBack - Number of days to generate data for (default: 30)
 * @param {Number} intervalHours - Interval between readings in hours (default: 1)
 * @returns {Array} Array of saved reading documents
 */
const generateHistoricalData = async (deviceId, daysBack = 30, intervalHours = 1) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const readingsData = await generateReadingsForPeriod(
        deviceId,
        startDate,
        endDate,
        intervalHours
    );

    const readings = await Reading.insertMany(readingsData);
    return readings;
};

/**
 * Generate historical data for all devices in a home
 * @param {String} homeId - Home ID
 * @param {Number} daysBack - Number of days to generate data for (default: 30)
 * @param {Number} intervalHours - Interval between readings in hours (default: 1)
 * @returns {Array} Array of saved reading documents
 */
const generateHomeHistoricalData = async (homeId, daysBack = 30, intervalHours = 1) => {
    const devices = await Device.find({ home: homeId, isActive: true });
    const allReadings = [];

    for (const device of devices) {
        const readings = await generateHistoricalData(device._id, daysBack, intervalHours);
        allReadings.push(...readings);
    }

    return allReadings;
};

/**
 * Simulate real-time readings (to be called periodically via cron)
 * @param {Number} intervalHours - Hours between readings (default: 1)
 * @returns {Object} Summary of generated readings
 */
const simulateRealtimeReadings = async (intervalHours = 1) => {
    try {
        const devices = await Device.find({ isActive: true }).populate('home');
        const timestamp = new Date();

        const readingsData = devices.map(device =>
            generateDeviceReading(device, timestamp)
        );

        const readings = await Reading.insertMany(readingsData);

        return {
            success: true,
            timestamp,
            totalDevices: devices.length,
            readingsGenerated: readings.length,
        };
    } catch (error) {
        console.error('Error simulating realtime readings:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Get device usage statistics
 * @param {String} deviceId - Device ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Usage statistics
 */
const getDeviceUsageStats = async (deviceId, startDate, endDate) => {
    const readings = await Reading.find({
        device: deviceId,
        timestamp: { $gte: startDate, $lte: endDate },
    });

    const totalKWh = readings.reduce((sum, r) => sum + r.kWh, 0);
    const totalCost = readings.reduce((sum, r) => sum + (r.cost || 0), 0);
    const avgWatts = readings.reduce((sum, r) => sum + r.watts, 0) / readings.length;
    const maxWatts = Math.max(...readings.map(r => r.watts));
    const activeHours = readings.filter(r => r.watts > 0).length;

    return {
        totalKWh: parseFloat(totalKWh.toFixed(4)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        avgWatts: parseFloat(avgWatts.toFixed(2)),
        maxWatts: parseFloat(maxWatts.toFixed(2)),
        activeHours,
        totalReadings: readings.length,
        utilizationRate: parseFloat((activeHours / readings.length * 100).toFixed(2)),
    };
};

module.exports = {
    generateDeviceReading,
    generateReadingsForPeriod,
    generateHomeReadings,
    generateHistoricalData,
    generateHomeHistoricalData,
    simulateRealtimeReadings,
    getDeviceUsageStats,
    USAGE_PATTERNS,
};
