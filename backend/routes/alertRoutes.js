const express = require('express');
const router = express.Router();
const {
    createAlert,
    getUserAlerts,
    getAlert,
    updateAlert,
    deleteAlert,
    getTriggeredAlerts,
    markTriggeredAlertRead,
    markTriggeredAlertResolved,
    testAlert,
} = require('../controllers/alertController');
const {
    protect,
    validateAlert,
    validateAlertCreate,
    validateMongoId,
    validatePagination,
} = require('../middleware');

// All routes require authentication
router.use(protect);

// Specific routes MUST come before parameterized routes
router.get('/user', getUserAlerts);

// Triggered alerts (must come before /:id routes)
router.get('/triggered', validatePagination, getTriggeredAlerts);
router.put('/triggered/:id/read', validateMongoId('id'), markTriggeredAlertRead);
router.put('/triggered/:id/resolve', validateMongoId('id'), markTriggeredAlertResolved);

// Alert CRUD routes
router.route('/')
    .post(validateAlertCreate, createAlert);

router.route('/:id')
    .get(validateMongoId('id'), getAlert)
    .put(validateMongoId('id'), validateAlert, updateAlert)
    .delete(validateMongoId('id'), deleteAlert);

// Test alert
router.post('/:id/test', validateMongoId('id'), testAlert);

module.exports = router;
