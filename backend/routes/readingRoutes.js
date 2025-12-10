const express = require('express');
const router = express.Router();
const {
    getDeviceReadings,
    getHomeReadings,
    simulateReadings,
    getRealtimeConsumption,
    simulateHomeReadings,
} = require('../controllers/readingController');
const {
    protect,
    validateMongoId,
    validateDateRange,
    validatePagination,
} = require('../middleware');

// All routes require authentication
router.use(protect);

// Device readings
router.get(
    '/device/:deviceId',
    validateMongoId('deviceId'),
    validateDateRange,
    validatePagination,
    getDeviceReadings
);

// Home readings
router.get(
    '/home/:homeId',
    validateMongoId('homeId'),
    validateDateRange,
    getHomeReadings
);

// Real-time consumption
router.get(
    '/realtime/:homeId',
    validateMongoId('homeId'),
    getRealtimeConsumption
);

// Simulate readings
router.post('/simulate', simulateReadings);
router.post('/simulate/home/:homeId', validateMongoId('homeId'), simulateHomeReadings);

module.exports = router;
