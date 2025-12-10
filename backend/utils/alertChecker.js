const cron = require('node-cron');
const Alert = require('../models/Alert');
const TriggeredAlert = require('../models/TriggeredAlert');
const Reading = require('../models/Reading');
const Device = require('../models/Device');
const Home = require('../models/Home');

/**
 * Alert Checker - Cron job to check usage against limits and trigger alerts
 * Monitors energy consumption and triggers alerts when thresholds are exceeded
 */

/**
 * Get usage for a specific period
 * @param {String} entityId - Home or Device ID
 * @param {String} entityType - 'home' or 'device'
 * @param {String} period - 'hourly', 'daily', 'weekly', 'monthly'
 * @returns {Object} Usage data with kWh and cost
 */
const getUsageForPeriod = async (entityId, entityType, period) => {
    const now = new Date();
    let startDate = new Date();

    // Calculate start date based on period
    switch (period) {
        case 'hourly':
            startDate.setHours(now.getHours() - 1);
            break;
        case 'daily':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'weekly':
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'monthly':
            startDate.setMonth(now.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        default:
            startDate.setHours(0, 0, 0, 0);
    }

    // Build query based on entity type
    const query = {
        timestamp: { $gte: startDate, $lte: now },
    };

    if (entityType === 'home') {
        query.home = entityId;
    } else {
        query.device = entityId;
    }

    // Get readings and calculate totals
    const readings = await Reading.find(query);
    const totalKWh = readings.reduce((sum, r) => sum + r.kWh, 0);
    const totalCost = readings.reduce((sum, r) => sum + (r.cost || 0), 0);

    return {
        totalKWh: parseFloat(totalKWh.toFixed(4)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        readingCount: readings.length,
        startDate,
        endDate: now,
    };
};

/**
 * Check a single alert and trigger if threshold exceeded
 * @param {Object} alert - Alert document
 * @returns {Object|null} Triggered alert if threshold exceeded, null otherwise
 */
const checkAlert = async (alert) => {
    try {
        if (!alert.isEnabled) {
            return null;
        }

        // Determine entity type and ID
        const entityType = alert.device ? 'device' : 'home';
        const entityId = alert.device || alert.home;

        if (!entityId) {
            return null;
        }

        // Get current usage for the period
        const usage = await getUsageForPeriod(entityId, entityType, alert.period);

        // Determine which limit to check
        let currentValue, limitValue, metricType;

        if (alert.limitKWh) {
            currentValue = usage.totalKWh;
            limitValue = alert.limitKWh;
            metricType = 'kWh';
        } else if (alert.limitCost) {
            currentValue = usage.totalCost;
            limitValue = alert.limitCost;
            metricType = 'cost';
        } else {
            return null;
        }

        // Calculate percentage used
        const percentageUsed = (currentValue / limitValue) * 100;

        // Check if threshold exceeded
        if (percentageUsed < alert.threshold) {
            return null;
        }

        // Check if alert was recently triggered (avoid duplicate alerts within period)
        const recentTrigger = await TriggeredAlert.findOne({
            alert: alert._id,
            triggeredAt: { $gte: usage.startDate },
        });

        if (recentTrigger) {
            return null; // Already triggered for this period
        }

        // Determine severity based on percentage
        let severity;
        if (percentageUsed >= 100) {
            severity = 'critical';
        } else if (percentageUsed >= 90) {
            severity = 'high';
        } else if (percentageUsed >= 80) {
            severity = 'medium';
        } else {
            severity = 'low';
        }

        // Get entity name for message
        let entityName;
        if (entityType === 'device') {
            const device = await Device.findById(entityId);
            entityName = device ? device.name : 'Unknown Device';
        } else {
            const home = await Home.findById(entityId);
            entityName = home ? home.name : 'Your Home';
        }

        // Create message
        const message = `Alert: ${alert.name} - ${entityName} has used ${currentValue.toFixed(2)} ${metricType} (${percentageUsed.toFixed(1)}% of ${limitValue} ${metricType} limit) in the ${alert.period} period.`;

        // Create triggered alert
        const triggeredAlert = await TriggeredAlert.create({
            alert: alert._id,
            user: alert.user,
            home: alert.home,
            device: alert.device,
            message,
            currentValue,
            limitValue,
            percentageUsed: parseFloat(percentageUsed.toFixed(2)),
            severity,
            triggeredAt: new Date(),
        });

        // Update alert's last triggered time and count
        alert.lastTriggered = new Date();
        alert.triggerCount += 1;
        await alert.save();

        return triggeredAlert;
    } catch (error) {
        console.error(`Error checking alert ${alert._id}:`, error);
        return null;
    }
};

/**
 * Check all active alerts
 * @returns {Object} Summary of alerts checked and triggered
 */
const checkAllAlerts = async () => {
    try {
        const startTime = Date.now();
        
        // Get all enabled alerts
        const alerts = await Alert.find({ isEnabled: true });

        console.log(`[Alert Checker] Checking ${alerts.length} alerts...`);

        const results = {
            totalChecked: alerts.length,
            triggered: [],
            errors: [],
        };

        // Check each alert
        for (const alert of alerts) {
            try {
                const triggeredAlert = await checkAlert(alert);
                if (triggeredAlert) {
                    results.triggered.push({
                        alertId: alert._id,
                        alertName: alert.name,
                        triggeredAlertId: triggeredAlert._id,
                        severity: triggeredAlert.severity,
                    });
                }
            } catch (error) {
                results.errors.push({
                    alertId: alert._id,
                    error: error.message,
                });
            }
        }

        const duration = Date.now() - startTime;

        console.log(
            `[Alert Checker] Completed in ${duration}ms. Triggered: ${results.triggered.length}, Errors: ${results.errors.length}`
        );

        return {
            success: true,
            timestamp: new Date(),
            duration: `${duration}ms`,
            ...results,
        };
    } catch (error) {
        console.error('[Alert Checker] Error checking alerts:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date(),
        };
    }
};

/**
 * Check unusual activity (spike detection)
 * @param {String} homeId - Home ID
 * @param {Number} threshold - Percentage increase to trigger alert (default: 50)
 * @returns {Object|null} Alert info if unusual activity detected
 */
const checkUnusualActivity = async (homeId, threshold = 50) => {
    try {
        // Get today's usage
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayUsage = await getUsageForPeriod(homeId, 'home', 'daily');

        // Get average of last 7 days (excluding today)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const historicalReadings = await Reading.find({
            home: homeId,
            timestamp: { $gte: sevenDaysAgo, $lt: today },
        });

        if (historicalReadings.length === 0) {
            return null; // Not enough historical data
        }

        // Calculate daily average from historical data
        const historicalKWh = historicalReadings.reduce((sum, r) => sum + r.kWh, 0);
        const avgDailyKWh = historicalKWh / 7;

        // Check if today's usage is significantly higher
        const percentageIncrease = ((todayUsage.totalKWh - avgDailyKWh) / avgDailyKWh) * 100;

        if (percentageIncrease >= threshold) {
            return {
                detected: true,
                todayUsage: todayUsage.totalKWh,
                avgUsage: avgDailyKWh,
                percentageIncrease: parseFloat(percentageIncrease.toFixed(2)),
                message: `Unusual activity detected: Today's usage (${todayUsage.totalKWh.toFixed(2)} kWh) is ${percentageIncrease.toFixed(1)}% higher than your 7-day average (${avgDailyKWh.toFixed(2)} kWh).`,
            };
        }

        return null;
    } catch (error) {
        console.error('Error checking unusual activity:', error);
        return null;
    }
};

/**
 * Start the alert checker cron job
 * Runs every hour by default
 * @param {String} schedule - Cron schedule (default: '0 * * * *' - every hour)
 * @returns {Object} Cron task
 */
const startAlertChecker = (schedule = '0 * * * *') => {
    console.log(`[Alert Checker] Starting cron job with schedule: ${schedule}`);

    const task = cron.schedule(schedule, async () => {
        console.log(`[Alert Checker] Running at ${new Date().toISOString()}`);
        await checkAllAlerts();
    });

    console.log('[Alert Checker] Cron job started successfully');
    return task;
};

/**
 * Stop the alert checker cron job
 * @param {Object} task - Cron task to stop
 */
const stopAlertChecker = (task) => {
    if (task) {
        task.stop();
        console.log('[Alert Checker] Cron job stopped');
    }
};

/**
 * Get triggered alerts for a user
 * @param {String} userId - User ID
 * @param {Object} options - Query options (limit, skip, isRead)
 * @returns {Array} Triggered alerts
 */
const getUserTriggeredAlerts = async (userId, options = {}) => {
    const { limit = 50, skip = 0, isRead } = options;

    const query = { user: userId };
    if (typeof isRead === 'boolean') {
        query.isRead = isRead;
    }

    const alerts = await TriggeredAlert.find(query)
        .populate('alert', 'name type')
        .populate('home', 'name')
        .populate('device', 'name type')
        .sort({ triggeredAt: -1 })
        .limit(limit)
        .skip(skip);

    return alerts;
};

/**
 * Mark triggered alert as read
 * @param {String} triggeredAlertId - Triggered alert ID
 * @returns {Object} Updated triggered alert
 */
const markAlertAsRead = async (triggeredAlertId) => {
    const alert = await TriggeredAlert.findByIdAndUpdate(
        triggeredAlertId,
        { isRead: true },
        { new: true }
    );
    return alert;
};

/**
 * Mark triggered alert as resolved
 * @param {String} triggeredAlertId - Triggered alert ID
 * @returns {Object} Updated triggered alert
 */
const markAlertAsResolved = async (triggeredAlertId) => {
    const alert = await TriggeredAlert.findByIdAndUpdate(
        triggeredAlertId,
        { isResolved: true, resolvedAt: new Date() },
        { new: true }
    );
    return alert;
};

module.exports = {
    getUsageForPeriod,
    checkAlert,
    checkAllAlerts,
    checkUnusualActivity,
    startAlertChecker,
    stopAlertChecker,
    getUserTriggeredAlerts,
    markAlertAsRead,
    markAlertAsResolved,
};
