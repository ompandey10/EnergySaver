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
    validateMongoId,
    validatePagination,
} = require('../middleware');

// All routes require authentication
router.use(protect);

// Alert CRUD routes
router.route('/')
    .post(validateAlert, createAlert);

router.get('/user', getUserAlerts);

router.route('/:id')
    .get(validateMongoId('id'), getAlert)
    .put(validateMongoId('id'), validateAlert, updateAlert)
    .delete(validateMongoId('id'), deleteAlert);

// Test alert
router.post('/:id/test', validateMongoId('id'), testAlert);

// Triggered alerts
router.get('/triggered', validatePagination, getTriggeredAlerts);
router.put('/triggered/:id/read', validateMongoId('id'), markTriggeredAlertRead);
router.put('/triggered/:id/resolve', validateMongoId('id'), markTriggeredAlertResolved);

module.exports = router;
