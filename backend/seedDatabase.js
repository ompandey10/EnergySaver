const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Home = require('./models/Home');
const Device = require('./models/Device');
const Reading = require('./models/Reading');
const Alert = require('./models/Alert');
const TriggeredAlert = require('./models/TriggeredAlert');
const DeviceTemplate = require('./models/DeviceTemplate');

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
};

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        log.success(`MongoDB Connected: ${mongoose.connection.host}`);
    } catch (error) {
        log.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

// Sample data
const sampleUsers = [
    {
        name: 'John Smith',
        email: 'john.smith@example.com',
        password: 'password123',
        role: 'user',
    },
    {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        password: 'password123',
        role: 'user',
    },
    {
        name: 'Michael Brown',
        email: 'michael.brown@example.com',
        password: 'password123',
        role: 'user',
    },
    {
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        password: 'password123',
        role: 'user',
    },
    {
        name: 'David Wilson',
        email: 'david.wilson@example.com',
        password: 'password123',
        role: 'user',
    },
    {
        name: 'Admin User',
        email: 'admin@cfa.com',
        password: 'admin123',
        role: 'admin',
    },
];

const sampleHomes = [
    {
        name: 'Main Residence',
        address: {
            street: '123 Oak Street',
            city: 'Springfield',
            state: 'IL',
        },
        zipCode: '62701',
        squareFootage: 2000,
        numberOfRooms: 4,
        homeType: 'house',
        electricityRate: 0.12,
    },
    {
        name: 'Downtown Apartment',
        address: {
            street: '456 Maple Avenue',
            city: 'Chicago',
            state: 'IL',
        },
        zipCode: '60601',
        squareFootage: 1200,
        numberOfRooms: 2,
        homeType: 'apartment',
        electricityRate: 0.15,
    },
    {
        name: 'Suburban Home',
        address: {
            street: '789 Pine Road',
            city: 'Naperville',
            state: 'IL',
        },
        zipCode: '60540',
        squareFootage: 2500,
        numberOfRooms: 5,
        homeType: 'house',
        electricityRate: 0.11,
    },
    {
        name: 'Beach Condo',
        address: {
            street: '321 Ocean Drive',
            city: 'Miami',
            state: 'FL',
        },
        zipCode: '33139',
        squareFootage: 1500,
        numberOfRooms: 3,
        homeType: 'condo',
        electricityRate: 0.13,
    },
    {
        name: 'Mountain Townhouse',
        address: {
            street: '654 Summit Lane',
            city: 'Denver',
            state: 'CO',
        },
        zipCode: '80202',
        squareFootage: 1800,
        numberOfRooms: 3,
        homeType: 'townhouse',
        electricityRate: 0.10,
    },
];

const deviceTemplates = [
    // HVAC
    { name: 'Central Air Conditioner', type: 'hvac', avgWattage: 3500, minWattage: 2800, maxWattage: 5000, category: 'heating_cooling', avgUsageHoursPerDay: 8, description: 'Standard central AC unit' },
    { name: 'Window AC Unit', type: 'hvac', avgWattage: 1200, minWattage: 900, maxWattage: 1500, category: 'heating_cooling', avgUsageHoursPerDay: 6, description: 'Window-mounted air conditioner' },
    { name: 'Space Heater', type: 'hvac', avgWattage: 1500, minWattage: 750, maxWattage: 1500, category: 'heating_cooling', avgUsageHoursPerDay: 4, description: 'Portable electric heater' },

    // Kitchen
    { name: 'Standard Refrigerator', type: 'refrigerator', avgWattage: 150, minWattage: 100, maxWattage: 200, category: 'kitchen', avgUsageHoursPerDay: 24, energyStarRated: true, description: 'Energy-efficient refrigerator' },
    { name: 'Large Refrigerator', type: 'refrigerator', avgWattage: 250, minWattage: 200, maxWattage: 300, category: 'kitchen', avgUsageHoursPerDay: 24, description: 'Side-by-side refrigerator' },
    { name: 'Dishwasher', type: 'dishwasher', avgWattage: 1800, minWattage: 1200, maxWattage: 2400, category: 'kitchen', avgUsageHoursPerDay: 1.5, description: 'Standard dishwasher' },
    { name: 'Electric Oven', type: 'oven', avgWattage: 2400, minWattage: 2000, maxWattage: 5000, category: 'kitchen', avgUsageHoursPerDay: 1, description: 'Electric range oven' },
    { name: 'Microwave Oven', type: 'microwave', avgWattage: 1200, minWattage: 800, maxWattage: 1500, category: 'kitchen', avgUsageHoursPerDay: 0.5, description: 'Standard microwave' },

    // Laundry
    { name: 'Washing Machine', type: 'washer', avgWattage: 500, minWattage: 350, maxWattage: 2000, category: 'laundry', avgUsageHoursPerDay: 1, description: 'Front-load washer' },
    { name: 'Electric Dryer', type: 'dryer', avgWattage: 3000, minWattage: 1800, maxWattage: 5000, category: 'laundry', avgUsageHoursPerDay: 1, description: 'Electric clothes dryer' },

    // Water Heating
    { name: 'Electric Water Heater', type: 'water_heater', avgWattage: 4500, minWattage: 3000, maxWattage: 5500, category: 'heating_cooling', avgUsageHoursPerDay: 3, description: 'Tank-style water heater' },

    // Entertainment
    { name: 'LED TV (55")', type: 'tv', avgWattage: 100, minWattage: 80, maxWattage: 150, category: 'entertainment', avgUsageHoursPerDay: 5, energyStarRated: true, description: 'Modern LED television' },
    { name: 'Desktop Computer', type: 'computer', avgWattage: 200, minWattage: 100, maxWattage: 500, category: 'entertainment', avgUsageHoursPerDay: 8, description: 'Desktop PC with monitor' },
    { name: 'Gaming Console', type: 'gaming_console', avgWattage: 150, minWattage: 50, maxWattage: 200, category: 'entertainment', avgUsageHoursPerDay: 3, description: 'Modern gaming console' },

    // Lighting
    { name: 'LED Lighting (per bulb)', type: 'lighting', avgWattage: 10, minWattage: 5, maxWattage: 15, category: 'lighting', avgUsageHoursPerDay: 5, energyStarRated: true, description: 'Energy-efficient LED bulb' },

    // Outdoor/EV
    { name: 'Pool Pump', type: 'pool_pump', avgWattage: 2000, minWattage: 1500, maxWattage: 2500, category: 'outdoor', avgUsageHoursPerDay: 6, description: 'Swimming pool circulation pump' },
    { name: 'EV Charger (Level 2)', type: 'ev_charger', avgWattage: 7200, minWattage: 3300, maxWattage: 19200, category: 'outdoor', avgUsageHoursPerDay: 3, description: 'Level 2 electric vehicle charger' },
];

const homeDeviceConfigs = [
    // Home 1: Suburban house with most appliances
    [
        { name: 'Central AC', type: 'hvac', wattage: 3500, location: 'Whole House', averageUsageHours: 8 },
        { name: 'Main Fridge', type: 'refrigerator', wattage: 180, location: 'Kitchen', averageUsageHours: 24 },
        { name: 'Electric Oven', type: 'oven', wattage: 2400, location: 'Kitchen', averageUsageHours: 1.5 },
        { name: 'Dishwasher', type: 'dishwasher', wattage: 1800, location: 'Kitchen', averageUsageHours: 1 },
        { name: 'Microwave', type: 'microwave', wattage: 1200, location: 'Kitchen', averageUsageHours: 0.5 },
        { name: 'Washing Machine', type: 'washer', wattage: 500, location: 'Laundry Room', averageUsageHours: 1 },
        { name: 'Dryer', type: 'dryer', wattage: 3000, location: 'Laundry Room', averageUsageHours: 1 },
        { name: 'Water Heater', type: 'water_heater', wattage: 4500, location: 'Basement', averageUsageHours: 3 },
        { name: 'Living Room TV', type: 'tv', wattage: 120, location: 'Living Room', averageUsageHours: 5 },
        { name: 'Home Office PC', type: 'computer', wattage: 200, location: 'Office', averageUsageHours: 8 },
        { name: 'LED Lights', type: 'lighting', wattage: 100, location: 'Whole House', averageUsageHours: 6 },
    ],
    // Home 2: Smaller apartment
    [
        { name: 'Window AC', type: 'hvac', wattage: 1200, location: 'Bedroom', averageUsageHours: 6 },
        { name: 'Compact Fridge', type: 'refrigerator', wattage: 150, location: 'Kitchen', averageUsageHours: 24 },
        { name: 'Microwave', type: 'microwave', wattage: 1100, location: 'Kitchen', averageUsageHours: 0.5 },
        { name: 'Portable Washer', type: 'washer', wattage: 400, location: 'Bathroom', averageUsageHours: 0.5 },
        { name: 'Living Room TV', type: 'tv', wattage: 100, location: 'Living Room', averageUsageHours: 4 },
        { name: 'Laptop', type: 'computer', wattage: 60, location: 'Bedroom', averageUsageHours: 6 },
        { name: 'LED Lights', type: 'lighting', wattage: 50, location: 'Whole House', averageUsageHours: 5 },
    ],
    // Home 3: Larger suburban home
    [
        { name: 'Central AC', type: 'hvac', wattage: 4000, location: 'Whole House', averageUsageHours: 10 },
        { name: 'Main Fridge', type: 'refrigerator', wattage: 200, location: 'Kitchen', averageUsageHours: 24 },
        { name: 'Garage Fridge', type: 'refrigerator', wattage: 180, location: 'Garage', averageUsageHours: 24 },
        { name: 'Electric Range', type: 'oven', wattage: 3000, location: 'Kitchen', averageUsageHours: 2 },
        { name: 'Dishwasher', type: 'dishwasher', wattage: 1800, location: 'Kitchen', averageUsageHours: 1 },
        { name: 'Washing Machine', type: 'washer', wattage: 600, location: 'Laundry', averageUsageHours: 1.5 },
        { name: 'Electric Dryer', type: 'dryer', wattage: 3500, location: 'Laundry', averageUsageHours: 1.5 },
        { name: 'Water Heater', type: 'water_heater', wattage: 5000, location: 'Utility Room', averageUsageHours: 4 },
        { name: 'Pool Pump', type: 'pool_pump', wattage: 2000, location: 'Backyard', averageUsageHours: 6 },
        { name: 'Living Room TV', type: 'tv', wattage: 150, location: 'Living Room', averageUsageHours: 6 },
        { name: 'Gaming Setup', type: 'gaming_console', wattage: 200, location: 'Game Room', averageUsageHours: 3 },
        { name: 'Office Computer', type: 'computer', wattage: 250, location: 'Office', averageUsageHours: 10 },
        { name: 'LED Lighting', type: 'lighting', wattage: 150, location: 'Whole House', averageUsageHours: 6 },
    ],
    // Home 4: Beach condo
    [
        { name: 'Central AC', type: 'hvac', wattage: 3000, location: 'Whole Unit', averageUsageHours: 12 },
        { name: 'Refrigerator', type: 'refrigerator', wattage: 170, location: 'Kitchen', averageUsageHours: 24 },
        { name: 'Microwave', type: 'microwave', wattage: 1200, location: 'Kitchen', averageUsageHours: 0.5 },
        { name: 'Dishwasher', type: 'dishwasher', wattage: 1500, location: 'Kitchen', averageUsageHours: 0.5 },
        { name: 'Washer/Dryer Combo', type: 'washer', wattage: 1500, location: 'Utility Closet', averageUsageHours: 1 },
        { name: 'Living Room TV', type: 'tv', wattage: 110, location: 'Living Room', averageUsageHours: 4 },
        { name: 'Master Bedroom TV', type: 'tv', wattage: 80, location: 'Bedroom', averageUsageHours: 2 },
        { name: 'LED Lights', type: 'lighting', wattage: 80, location: 'Whole Unit', averageUsageHours: 5 },
    ],
    // Home 5: Mountain townhouse
    [
        { name: 'Heat Pump', type: 'hvac', wattage: 3500, location: 'Whole House', averageUsageHours: 6 },
        { name: 'Space Heater', type: 'hvac', wattage: 1500, location: 'Basement', averageUsageHours: 4 },
        { name: 'Refrigerator', type: 'refrigerator', wattage: 160, location: 'Kitchen', averageUsageHours: 24 },
        { name: 'Electric Oven', type: 'oven', wattage: 2500, location: 'Kitchen', averageUsageHours: 1 },
        { name: 'Dishwasher', type: 'dishwasher', wattage: 1600, location: 'Kitchen', averageUsageHours: 1 },
        { name: 'Washing Machine', type: 'washer', wattage: 500, location: 'Laundry', averageUsageHours: 1 },
        { name: 'Gas Dryer (fan)', type: 'dryer', wattage: 500, location: 'Laundry', averageUsageHours: 1 },
        { name: 'Water Heater', type: 'water_heater', wattage: 4000, location: 'Garage', averageUsageHours: 3 },
        { name: 'TV', type: 'tv', wattage: 100, location: 'Living Room', averageUsageHours: 4 },
        { name: 'Work Computer', type: 'computer', wattage: 180, location: 'Office', averageUsageHours: 8 },
        { name: 'EV Charger', type: 'ev_charger', wattage: 7200, location: 'Garage', averageUsageHours: 2 },
        { name: 'LED Lights', type: 'lighting', wattage: 90, location: 'Whole House', averageUsageHours: 6 },
    ],
];

// Helper function to generate realistic readings
function generateReading(device, home, daysAgo, hour) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, 0, 0, 0);

    let wattage = device.wattage;
    let duration = 60; // minutes

    // Apply usage patterns based on device type
    if (device.type === 'refrigerator') {
        // Refrigerators run constantly with cycles
        wattage = device.wattage * (0.3 + Math.random() * 0.3); // 30-60% duty cycle
    } else if (device.type === 'hvac') {
        // HVAC varies by time of day and season
        const isActiveHour = hour >= 10 && hour <= 22;
        wattage = isActiveHour ? device.wattage * (0.6 + Math.random() * 0.4) : device.wattage * 0.1;
    } else if (device.type === 'lighting') {
        // Lights mostly at night
        const isEveningNight = hour >= 18 || hour <= 1;
        wattage = isEveningNight ? device.wattage : device.wattage * 0.1;
    } else if (device.type === 'tv' || device.type === 'computer' || device.type === 'gaming_console') {
        // Entertainment devices - evening usage
        const isActiveHour = (hour >= 18 && hour <= 23) || (hour >= 8 && hour <= 10);
        wattage = isActiveHour ? device.wattage * (0.8 + Math.random() * 0.2) : device.wattage * 0.05;
    } else if (device.type === 'washer' || device.type === 'dryer' || device.type === 'dishwasher') {
        // Appliances - sporadic usage, spikes
        const usageProbability = 0.05; // 5% chance per hour
        if (Math.random() < usageProbability && hour >= 8 && hour <= 22) {
            wattage = device.wattage * (0.9 + Math.random() * 0.1);
        } else {
            wattage = 0;
        }
    } else if (device.type === 'oven' || device.type === 'microwave') {
        // Cooking appliances - meal times
        const isMealTime = (hour >= 6 && hour <= 8) || (hour >= 11 && hour <= 13) || (hour >= 17 && hour <= 19);
        if (isMealTime && Math.random() < 0.3) {
            wattage = device.wattage * (0.8 + Math.random() * 0.2);
            duration = device.type === 'microwave' ? 10 : 45;
        } else {
            wattage = 0;
        }
    } else if (device.type === 'water_heater') {
        // Water heater - morning and evening peaks
        const isPeakHour = (hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 21);
        wattage = isPeakHour ? device.wattage * (0.5 + Math.random() * 0.3) : device.wattage * 0.2;
    } else if (device.type === 'pool_pump') {
        // Pool pump - scheduled runs
        const isRunning = hour >= 8 && hour <= 14;
        wattage = isRunning ? device.wattage : 0;
    } else if (device.type === 'ev_charger') {
        // EV charging - late night off-peak
        const isCharging = hour >= 23 || hour <= 6;
        wattage = isCharging ? device.wattage * (0.8 + Math.random() * 0.2) : 0;
    }

    const kWh = (wattage * duration) / (1000 * 60); // Convert to kWh
    const cost = kWh * home.electricityRate;

    return {
        device: device._id,
        home: home._id,
        kWh: parseFloat(kWh.toFixed(4)),
        watts: parseFloat(wattage.toFixed(2)),
        timestamp: date,
        duration,
        isSimulated: true,
        cost: parseFloat(cost.toFixed(4)),
    };
}

// Clear database
async function clearDatabase() {
    log.section('🗑️  Clearing Database...');
    await User.deleteMany({});
    await Home.deleteMany({});
    await Device.deleteMany({});
    await Reading.deleteMany({});
    await Alert.deleteMany({});
    await TriggeredAlert.deleteMany({});
    await DeviceTemplate.deleteMany({});
    log.success('Database cleared');
}

// Seed functions
async function seedDeviceTemplates() {
    log.section('📋 Seeding Device Templates...');
    
    const existingCount = await DeviceTemplate.countDocuments();
    if (existingCount > 0) {
        log.info(`Found ${existingCount} existing device templates, skipping...`);
        const templates = await DeviceTemplate.find();
        return templates;
    }
    
    const templates = await DeviceTemplate.insertMany(deviceTemplates);
    log.success(`Created ${templates.length} device templates`);
    return templates;
}

async function seedUsers() {
    log.section('👥 Seeding Users...');
    
    const existingCount = await User.countDocuments();
    if (existingCount > 0) {
        log.warning(`Found ${existingCount} existing users. Run with --clear to reset data.`);
        throw new Error('Users already exist. Use --clear flag to reset database.');
    }
    
    const users = await User.create(sampleUsers);
    log.success(`Created ${users.length} users`);
    return users;
}

async function seedHomes(users) {
    log.section('🏠 Seeding Homes...');
    const homes = [];
    for (let i = 0; i < sampleHomes.length; i++) {
        const homeData = { ...sampleHomes[i], user: users[i]._id };
        const home = await Home.create(homeData);
        homes.push(home);
    }
    log.success(`Created ${homes.length} homes`);
    return homes;
}

async function seedDevices(homes) {
    log.section('⚡ Seeding Devices...');
    const allDevices = [];
    for (let i = 0; i < homes.length; i++) {
        const deviceConfigs = homeDeviceConfigs[i];
        for (const config of deviceConfigs) {
            const device = await Device.create({
                ...config,
                home: homes[i]._id,
                brand: ['Samsung', 'LG', 'Whirlpool', 'GE', 'Bosch'][Math.floor(Math.random() * 5)],
                isSmartDevice: Math.random() > 0.7,
            });
            allDevices.push(device);
        }
    }
    log.success(`Created ${allDevices.length} devices across ${homes.length} homes`);
    return allDevices;
}

async function seedReadings(devices, homes) {
    log.section('📊 Seeding Energy Readings...');
    const DAYS_BACK = 30;
    const HOURS_PER_DAY = 24;
    let readingCount = 0;
    const batchSize = 1000;
    let batch = [];

    for (const device of devices) {
        const home = homes.find(h => h._id.equals(device.home));

        for (let day = 0; day < DAYS_BACK; day++) {
            for (let hour = 0; hour < HOURS_PER_DAY; hour++) {
                const reading = generateReading(device, home, day, hour);
                batch.push(reading);
                readingCount++;

                // Insert in batches for better performance
                if (batch.length >= batchSize) {
                    await Reading.insertMany(batch);
                    log.info(`Inserted ${readingCount} readings...`);
                    batch = [];
                }
            }
        }
    }

    // Insert remaining readings
    if (batch.length > 0) {
        await Reading.insertMany(batch);
    }

    log.success(`Created ${readingCount} energy readings over ${DAYS_BACK} days`);
    return readingCount;
}

async function seedAlerts(users, homes, devices) {
    log.section('🔔 Seeding Alerts...');
    const alerts = [];

    for (let i = 0; i < users.length - 1; i++) { // Exclude admin
        const user = users[i];
        const home = homes[i];
        const homeDevices = devices.filter(d => d.home.equals(home._id));

        // Daily usage limit alert
        alerts.push({
            user: user._id,
            home: home._id,
            name: 'Daily Usage Alert',
            type: 'usage_limit',
            limitKWh: 50,
            period: 'daily',
            threshold: 80,
            isEnabled: true,
            notificationMethods: ['email', 'in_app'],
        });

        // Monthly cost limit alert
        alerts.push({
            user: user._id,
            home: home._id,
            name: 'Monthly Budget Alert',
            type: 'cost_limit',
            limitCost: 200,
            period: 'monthly',
            threshold: 90,
            isEnabled: true,
            notificationMethods: ['email', 'in_app'],
        });

        // Device-specific alert (for HVAC if exists)
        const hvacDevice = homeDevices.find(d => d.type === 'hvac');
        if (hvacDevice) {
            alerts.push({
                user: user._id,
                home: home._id,
                device: hvacDevice._id,
                name: 'AC High Usage',
                type: 'usage_limit',
                limitKWh: 30,
                period: 'daily',
                threshold: 85,
                isEnabled: true,
                notificationMethods: ['in_app'],
            });
        }
    }

    const createdAlerts = await Alert.insertMany(alerts);
    log.success(`Created ${createdAlerts.length} alerts`);
    return createdAlerts;
}

async function seedTriggeredAlerts(alerts, users) {
    log.section('🚨 Seeding Triggered Alerts...');
    const triggeredAlerts = [];

    // Create some triggered alerts for the first 3 users
    for (let i = 0; i < Math.min(3, alerts.length); i++) {
        const alert = alerts[i];
        const limitValue = alert.limitKWh || alert.limitCost || 100;
        const currentValue = limitValue * (0.85 + Math.random() * 0.1); // 85-95% of limit

        triggeredAlerts.push({
            alert: alert._id,
            user: alert.user,
            home: alert.home,
            device: alert.device,
            message: `Your energy usage has exceeded ${alert.threshold}% of your ${alert.period} limit`,
            currentValue: parseFloat(currentValue.toFixed(2)),
            limitValue: parseFloat(limitValue.toFixed(2)),
            percentageUsed: parseFloat(((currentValue / limitValue) * 100).toFixed(1)),
            severity: currentValue / limitValue > 0.95 ? 'high' : 'medium',
            isRead: i % 2 === 0, // Mark some as read
            isResolved: i % 3 === 0, // Mark some as resolved
            triggeredAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        });
    }

    if (triggeredAlerts.length > 0) {
        const created = await TriggeredAlert.insertMany(triggeredAlerts);
        log.success(`Created ${created.length} triggered alerts`);
        return created;
    }
    return [];
}// Main seeder function
async function seed() {
    try {
        await connectDB();

        const shouldClear = process.argv.includes('--clear') || process.argv.includes('-c');

        if (shouldClear) {
            await clearDatabase();
        } else {
            log.warning('⚠️  Running seed without clearing. Use --clear or -c to clear database first.');
        }

        // Seed in order due to dependencies
        const templates = await seedDeviceTemplates();
        const users = await seedUsers();
        const homes = await seedHomes(users);
        const devices = await seedDevices(homes);
        await seedReadings(devices, homes);
        const alerts = await seedAlerts(users, homes, devices);
        await seedTriggeredAlerts(alerts, users);

        log.section('✅ Database Seeding Complete!');
        console.log('\n📝 Login Credentials:');
        console.log('━'.repeat(50));
        console.log('Regular Users:');
        sampleUsers.slice(0, -1).forEach(u => {
            console.log(`  ${u.email} / password123`);
        });
        console.log('\nAdmin User:');
        console.log(`  ${sampleUsers[sampleUsers.length - 1].email} / admin123`);
        console.log('━'.repeat(50));

        console.log('\n📊 Summary:');
        console.log(`  Users: ${users.length}`);
        console.log(`  Homes: ${homes.length}`);
        console.log(`  Devices: ${devices.length}`);
        console.log(`  Device Templates: ${templates.length}`);
        console.log(`  Alerts: ${alerts.length}`);
        console.log(`  Total Energy Readings: ~${devices.length * 30 * 24} (30 days × 24 hours)`);

        process.exit(0);
    } catch (error) {
        log.error(`Seeding failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run seeder
seed();
