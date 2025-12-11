const express = require('express');
const router = express.Router();
const {
    createDevice,
    getHomeDevices,
    getDevice,
    updateDevice,
    deleteDevice,
    getDeviceTemplates,
    getDeviceStats,
    toggleDevice,
    getCurrentConsumption,
} = require('../controllers/deviceController');
const { protect, validateDevice, validateMongoId } = require('../middleware');

// All routes require authentication
router.use(protect);

// Device templates (public for authenticated users)
router.get('/templates', getDeviceTemplates);

// Device CRUD routes
router.post('/', validateDevice, createDevice);

router.get('/home/:homeId', validateMongoId('homeId'), getHomeDevices);

router.route('/:id')
    .get(validateMongoId('id'), getDevice)
    .put(validateMongoId('id'), validateDevice, updateDevice)
    .delete(validateMongoId('id'), deleteDevice);

// Device statistics
router.get('/:id/stats', validateMongoId('id'), getDeviceStats);

// Device toggle and consumption
router.put('/:id/toggle', validateMongoId('id'), toggleDevice);
router.get('/:id/consumption', validateMongoId('id'), getCurrentConsumption);

module.exports = router;
