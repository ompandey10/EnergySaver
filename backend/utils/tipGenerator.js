const Reading = require('../models/Reading');
const Device = require('../models/Device');
const Home = require('../models/Home');

/**
 * Tip Generator - Rule-based savings recommendations
 * Analyzes usage patterns and provides actionable energy-saving tips
 */

// Tip database with conditions and recommendations
const TIP_RULES = {
    // High usage patterns
    highOverallUsage: {
        condition: (data) => data.avgDailyKWh > 30,
        priority: 'high',
        category: 'general',
        tip: {
            title: 'High Energy Consumption Detected',
            description: 'Your home is using significantly more energy than average.',
            recommendations: [
                'Consider an energy audit to identify major energy consumers',
                'Check for devices left on unnecessarily',
                'Review your HVAC settings and usage patterns',
            ],
            potentialSavings: '₹4,000-8,000/month',
        },
    },

    // HVAC tips
    hvacHighUsage: {
        condition: (data) => {
            const hvac = data.deviceBreakdown.find(d => d.deviceType === 'hvac');
            return hvac && hvac.percentage > 50;
        },
        priority: 'high',
        category: 'hvac',
        tip: {
            title: 'HVAC System Using Too Much Energy',
            description: 'Your heating/cooling system accounts for over 50% of your energy usage.',
            recommendations: [
                'Set thermostat to 20°C in winter and 26°C in summer',
                'Use a programmable thermostat to reduce usage when away',
                'Replace air filters monthly',
                'Schedule annual HVAC maintenance',
                'Seal air leaks around windows and doors',
            ],
            potentialSavings: '₹2,500-5,000/month',
        },
    },

    hvacOffPeakShift: {
        condition: (data) => {
            const hvac = data.deviceBreakdown.find(d => d.deviceType === 'hvac');
            return hvac && data.peakHourPercentage > 40;
        },
        priority: 'medium',
        category: 'hvac',
        tip: {
            title: 'Shift HVAC Usage to Off-Peak Hours',
            description: 'Your HVAC runs heavily during peak electricity rate hours.',
            recommendations: [
                'Pre-cool or pre-heat your home during off-peak hours',
                'Use ceiling fans to extend comfort periods',
                'Close blinds during peak heat hours',
            ],
            potentialSavings: '₹1,600-3,300/month',
        },
    },

    // Water heater tips
    waterHeaterAlwaysOn: {
        condition: (data) => {
            const wh = data.deviceBreakdown.find(d => d.deviceType === 'water_heater');
            return wh && wh.utilizationRate > 80;
        },
        priority: 'medium',
        category: 'water_heating',
        tip: {
            title: 'Water Heater Running Constantly',
            description: 'Your water heater is on more than 80% of the time.',
            recommendations: [
                'Lower water heater temperature to 50°C',
                'Install a timer to heat water only when needed',
                'Consider a tankless water heater for long-term savings',
                'Check for leaks in hot water pipes',
                'Insulate your water heater tank',
            ],
            potentialSavings: '₹1,200-2,500/month',
        },
    },

    // Vampire power
    vampirePower: {
        condition: (data) => data.nighttimeUsagePercentage > 30,
        priority: 'medium',
        category: 'general',
        tip: {
            title: 'High Nighttime Energy Usage',
            description: 'Significant energy is being used while you sleep.',
            recommendations: [
                'Use power strips for electronics and turn them off at night',
                'Unplug chargers when not in use',
                'Enable power-saving modes on all devices',
                'Check for devices that don\'t need to run 24/7',
            ],
            potentialSavings: '₹800-1,600/month',
        },
    },

    // Appliance efficiency
    oldAppliances: {
        condition: (data) => {
            const inefficientDevices = data.deviceBreakdown.filter(
                d => ['refrigerator', 'washer', 'dryer'].includes(d.deviceType) && d.percentage > 15
            );
            return inefficientDevices.length > 0;
        },
        priority: 'low',
        category: 'appliances',
        tip: {
            title: 'Consider Energy-Efficient Appliances',
            description: 'Major appliances are using significant energy.',
            recommendations: [
                'Look for BEE 5-star rated appliances when replacing',
                'Run dishwasher and washing machine only with full loads',
                'Use cold water for laundry when possible',
                'Clean refrigerator coils regularly',
                'Keep freezer full to maintain efficiency',
            ],
            potentialSavings: '₹1,600-3,300/month',
        },
    },

    // Lighting
    highLightingUsage: {
        condition: (data) => {
            const lighting = data.deviceBreakdown.find(d => d.deviceType === 'lighting');
            return lighting && lighting.percentage > 15;
        },
        priority: 'low',
        category: 'lighting',
        tip: {
            title: 'Lighting Optimization',
            description: 'Lighting accounts for a large portion of your energy use.',
            recommendations: [
                'Replace incandescent bulbs with LED bulbs',
                'Use natural light during the day',
                'Install motion sensors in low-traffic areas',
                'Use dimmer switches where appropriate',
                'Turn off lights in unoccupied rooms',
            ],
            potentialSavings: '₹800-2,000/month',
        },
    },

    // EV Charging
    evPeakCharging: {
        condition: (data) => {
            const ev = data.deviceBreakdown.find(d => d.deviceType === 'ev_charger');
            return ev && data.peakHourPercentage > 30;
        },
        priority: 'high',
        category: 'ev_charging',
        tip: {
            title: 'Optimize EV Charging Schedule',
            description: 'Your EV is charging during expensive peak hours.',
            recommendations: [
                'Charge your EV between 12am-6am for lowest rates',
                'Use your EV\'s scheduled charging feature',
                'Consider a smart charger with time-of-use optimization',
            ],
            potentialSavings: '₹3,300-6,600/month',
        },
    },

    // Pool pump
    poolPumpSchedule: {
        condition: (data) => {
            const pool = data.deviceBreakdown.find(d => d.deviceType === 'pool_pump');
            return pool && pool.activeHours > 12;
        },
        priority: 'medium',
        category: 'outdoor',
        tip: {
            title: 'Reduce Pool Pump Runtime',
            description: 'Your pool pump is running more than necessary.',
            recommendations: [
                'Run pool pump 6-8 hours per day instead of 12+',
                'Run pump during off-peak hours',
                'Use a variable speed pump for better efficiency',
                'Keep filters clean to reduce runtime needed',
            ],
            potentialSavings: '₹2,000-4,000/month',
        },
    },

    // Seasonal tips
    summerCooling: {
        condition: (data) => {
            const month = data.currentMonth;
            return month >= 6 && month <= 8 && data.avgDailyKWh > 25;
        },
        priority: 'medium',
        category: 'seasonal',
        tip: {
            title: 'Summer Cooling Tips',
            description: 'Hot summer months are driving up your energy costs.',
            recommendations: [
                'Use ceiling fans to feel cooler at higher thermostat settings',
                'Close curtains during the hottest part of the day',
                'Avoid using heat-generating appliances during the day',
                'Ensure attic insulation is adequate',
                'Plant shade trees on south and west sides of home',
            ],
            potentialSavings: '₹2,500-5,800/month',
        },
    },

    winterHeating: {
        condition: (data) => {
            const month = data.currentMonth;
            return (month >= 11 || month <= 2) && data.avgDailyKWh > 25;
        },
        priority: 'medium',
        category: 'seasonal',
        tip: {
            title: 'Winter Heating Efficiency',
            description: 'Cold weather is increasing your heating costs.',
            recommendations: [
                'Lower thermostat to 20°C and use layers/blankets',
                'Reverse ceiling fans to circulate warm air downward',
                'Use door draft stoppers',
                'Open curtains during sunny days, close at night',
                'Check attic and wall insulation',
            ],
            potentialSavings: '₹2,000-5,000/month',
        },
    },
};

/**
 * Analyze home usage and generate personalized tips
 * @param {String} homeId - Home ID
 * @param {Date} startDate - Start date for analysis
 * @param {Date} endDate - End date for analysis
 * @returns {Array} Array of tips
 */
const generateTips = async (homeId, startDate, endDate) => {
    // Gather usage data
    const analysisData = await analyzeUsagePatterns(homeId, startDate, endDate);

    // Evaluate all tip rules
    const tips = [];
    for (const [ruleId, rule] of Object.entries(TIP_RULES)) {
        try {
            if (rule.condition(analysisData)) {
                tips.push({
                    id: ruleId,
                    priority: rule.priority,
                    category: rule.category,
                    ...rule.tip,
                });
            }
        } catch (error) {
            console.error(`Error evaluating rule ${ruleId}:`, error);
        }
    }

    // Sort by priority
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return tips;
};

/**
 * Analyze usage patterns for tip generation
 * @param {String} homeId - Home ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Analysis data
 */
const analyzeUsagePatterns = async (homeId, startDate, endDate) => {
    const [home, readings, devices] = await Promise.all([
        Home.findById(homeId),
        Reading.find({
            home: homeId,
            timestamp: { $gte: startDate, $lte: endDate },
        }),
        Device.find({ home: homeId, isActive: true }),
    ]);

    if (!home || readings.length === 0) {
        return {
            avgDailyKWh: 0,
            deviceBreakdown: [],
            peakHourPercentage: 0,
            nighttimeUsagePercentage: 0,
            currentMonth: new Date().getMonth() + 1,
        };
    }

    // Calculate total usage
    const totalKWh = readings.reduce((sum, r) => sum + r.kWh, 0);
    const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const avgDailyKWh = totalKWh / days;

    // Device breakdown
    const deviceMap = {};
    readings.forEach(reading => {
        const deviceId = reading.device.toString();
        if (!deviceMap[deviceId]) {
            const device = devices.find(d => d._id.toString() === deviceId);
            deviceMap[deviceId] = {
                deviceType: device ? device.type : 'unknown',
                totalKWh: 0,
                activeReadings: 0,
                totalReadings: 0,
            };
        }
        deviceMap[deviceId].totalKWh += reading.kWh;
        deviceMap[deviceId].totalReadings += 1;
        if (reading.watts > 0) {
            deviceMap[deviceId].activeReadings += 1;
        }
    });

    const deviceBreakdown = Object.values(deviceMap).map(d => ({
        deviceType: d.deviceType,
        totalKWh: d.totalKWh,
        percentage: (d.totalKWh / totalKWh) * 100,
        utilizationRate: (d.activeReadings / d.totalReadings) * 100,
        activeHours: d.activeReadings,
    }));

    // Peak hour analysis (10am-6pm weekdays)
    const peakReadings = readings.filter(r => {
        const hour = r.timestamp.getHours();
        const day = r.timestamp.getDay();
        const isWeekday = day >= 1 && day <= 5;
        const isPeakHour = hour >= 10 && hour < 18;
        return isWeekday && isPeakHour;
    });
    const peakKWh = peakReadings.reduce((sum, r) => sum + r.kWh, 0);
    const peakHourPercentage = (peakKWh / totalKWh) * 100;

    // Nighttime usage analysis (10pm-6am)
    const nightReadings = readings.filter(r => {
        const hour = r.timestamp.getHours();
        return hour >= 22 || hour < 6;
    });
    const nightKWh = nightReadings.reduce((sum, r) => sum + r.kWh, 0);
    const nighttimeUsagePercentage = (nightKWh / totalKWh) * 100;

    return {
        avgDailyKWh: parseFloat(avgDailyKWh.toFixed(4)),
        totalKWh: parseFloat(totalKWh.toFixed(4)),
        deviceBreakdown,
        peakHourPercentage: parseFloat(peakHourPercentage.toFixed(2)),
        nighttimeUsagePercentage: parseFloat(nighttimeUsagePercentage.toFixed(2)),
        currentMonth: new Date().getMonth() + 1,
    };
};

/**
 * Get tips by category
 * @param {String} homeId - Home ID
 * @param {String} category - Category to filter by
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Filtered tips
 */
const getTipsByCategory = async (homeId, category, startDate, endDate) => {
    const allTips = await generateTips(homeId, startDate, endDate);
    return allTips.filter(tip => tip.category === category);
};

/**
 * Get high priority tips only
 * @param {String} homeId - Home ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} High priority tips
 */
const getHighPriorityTips = async (homeId, startDate, endDate) => {
    const allTips = await generateTips(homeId, startDate, endDate);
    return allTips.filter(tip => tip.priority === 'high');
};

/**
 * Calculate potential savings from all tips
 * @param {Array} tips - Array of tips
 * @returns {Object} Savings estimate
 */
const calculatePotentialSavings = (tips) => {
    let minSavings = 0;
    let maxSavings = 0;

    tips.forEach(tip => {
        const savingsStr = tip.potentialSavings;
        // Match both ₹X,XXX-Y,YYY and $X-Y formats
        const inrMatches = savingsStr.match(/₹([\d,]+)-([\d,]+)/);
        const usdMatches = savingsStr.match(/\$(\d+)-(\d+)/);

        if (inrMatches) {
            minSavings += parseInt(inrMatches[1].replace(/,/g, ''));
            maxSavings += parseInt(inrMatches[2].replace(/,/g, ''));
        } else if (usdMatches) {
            // Convert USD to INR (approx 83x)
            minSavings += parseInt(usdMatches[1]) * 83;
            maxSavings += parseInt(usdMatches[2]) * 83;
        }
    });

    return {
        monthly: {
            min: minSavings,
            max: maxSavings,
            average: Math.round((minSavings + maxSavings) / 2),
        },
        yearly: {
            min: minSavings * 12,
            max: maxSavings * 12,
            average: Math.round(((minSavings + maxSavings) / 2) * 12),
        },
        currency: 'INR',
    };
};

/**
 * Generate quick wins - easy tips with good impact
 * @param {String} homeId - Home ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Quick win tips
 */
const getQuickWins = async (homeId, startDate, endDate) => {
    const allTips = await generateTips(homeId, startDate, endDate);

    // Filter for medium/high priority tips in easy categories
    const quickWinCategories = ['lighting', 'general', 'appliances'];
    return allTips.filter(
        tip => quickWinCategories.includes(tip.category) &&
            (tip.priority === 'high' || tip.priority === 'medium')
    );
};

/**
 * Generate device-specific tips
 * @param {String} deviceId - Device ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Device-specific tips
 */
const getDeviceTips = async (deviceId, startDate, endDate) => {
    const device = await Device.findById(deviceId).populate('home');
    if (!device) {
        throw new Error('Device not found');
    }

    const readings = await Reading.find({
        device: deviceId,
        timestamp: { $gte: startDate, $lte: endDate },
    });

    const tips = [];
    const totalKWh = readings.reduce((sum, r) => sum + r.kWh, 0);
    const activeReadings = readings.filter(r => r.watts > 0);
    const utilizationRate = (activeReadings.length / readings.length) * 100;

    // Generate device-specific tips based on type and usage
    switch (device.type) {
        case 'hvac':
            if (utilizationRate > 70) {
                tips.push({
                    title: `${device.name} Running Frequently`,
                    description: 'This HVAC system is running over 70% of the time.',
                    recommendations: [
                        'Increase thermostat temperature by 2-3 degrees',
                        'Check air filter and replace if dirty',
                        'Ensure vents are not blocked',
                    ],
                });
            }
            break;

        case 'refrigerator':
            if (totalKWh > 40) { // Over 40 kWh per month is high
                tips.push({
                    title: `${device.name} Using Excess Energy`,
                    description: 'This refrigerator is using more energy than typical.',
                    recommendations: [
                        'Check door seals for leaks',
                        'Set temperature to 37-40°F (3-4°C)',
                        'Clean condenser coils',
                        'Ensure adequate airflow around unit',
                    ],
                });
            }
            break;

        case 'water_heater':
            if (utilizationRate > 60) {
                tips.push({
                    title: `${device.name} Always Running`,
                    description: 'Water heater is on more than 60% of the time.',
                    recommendations: [
                        'Lower temperature to 120°F',
                        'Add insulation blanket',
                        'Check for leaking faucets',
                        'Install low-flow showerheads',
                    ],
                });
            }
            break;

        case 'pool_pump':
            if (activeReadings.length > 360) { // More than 15 days worth at 24hrs
                tips.push({
                    title: `${device.name} Running Too Long`,
                    description: 'Pool pump is running more than recommended.',
                    recommendations: [
                        'Reduce runtime to 6-8 hours per day',
                        'Run during off-peak hours',
                        'Clean filter regularly',
                        'Consider variable speed pump',
                    ],
                });
            }
            break;
    }

    return tips;
};

module.exports = {
    generateTips,
    analyzeUsagePatterns,
    getTipsByCategory,
    getHighPriorityTips,
    calculatePotentialSavings,
    getQuickWins,
    getDeviceTips,
    TIP_RULES,
};
