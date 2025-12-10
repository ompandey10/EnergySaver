const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    createDeviceTemplate,
    updateDeviceTemplate,
    deleteDeviceTemplate,
    getCommunityInsights,
    getPlatformAnalytics,
} = require('../controllers/adminController');
const {
    protect,
    isAdmin,
    validateMongoId,
    validateDeviceTemplate,
    validateDateRange,
    validatePagination,
} = require('../middleware');

// All routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

// User management
router.get('/users', validatePagination, getAllUsers);
router.route('/users/:id')
    .get(validateMongoId('id'), getUserById)
    .put(validateMongoId('id'), updateUser)
    .delete(validateMongoId('id'), deleteUser);

// Device template management
router.post('/devices/templates', validateDeviceTemplate, createDeviceTemplate);
router.route('/devices/templates/:id')
    .put(validateMongoId('id'), validateDeviceTemplate, updateDeviceTemplate)
    .delete(validateMongoId('id'), deleteDeviceTemplate);

// Community insights
router.get('/insights', getCommunityInsights);

// Platform analytics
router.get('/analytics', validateDateRange, getPlatformAnalytics);

module.exports = router;
