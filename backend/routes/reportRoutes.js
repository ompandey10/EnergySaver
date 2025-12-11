const express = require('express');
const router = express.Router();
const {
    getMonthlyReport,
    getNeighborhoodComparison,
    getSavingsTips,
    getCostAnalysis,
    getDashboardSummary,
    getConsumptionReport,
} = require('../controllers/reportController');
const { protect, heavyOperationLimiter, validateMongoId } = require('../middleware');

// All routes require authentication
router.use(protect);

// Monthly PDF report (heavy operation)
router.get('/monthly', heavyOperationLimiter, getMonthlyReport);

// Consumption report for a home
router.get('/consumption/:homeId', validateMongoId('homeId'), getConsumptionReport);

// Neighborhood comparison
router.get('/comparison', getNeighborhoodComparison);

// Savings tips
router.get('/savings-tips', getSavingsTips);

// Cost analysis
router.get('/cost-analysis', getCostAnalysis);

// Dashboard summary
router.get('/dashboard', getDashboardSummary);

module.exports = router;
