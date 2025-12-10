const express = require('express');
const router = express.Router();
const {
    createHome,
    getHomes,
    getHome,
    updateHome,
    deleteHome,
    getHomeStats,
} = require('../controllers/homeController');
const { protect, validateHome, validateMongoId } = require('../middleware');

// All routes require authentication
router.use(protect);

// Home CRUD routes
router.route('/')
    .post(validateHome, createHome)
    .get(getHomes);

router.route('/:id')
    .get(validateMongoId('id'), getHome)
    .put(validateMongoId('id'), validateHome, updateHome)
    .delete(validateMongoId('id'), deleteHome);

// Home statistics
router.get('/:id/stats', validateMongoId('id'), getHomeStats);

module.exports = router;
