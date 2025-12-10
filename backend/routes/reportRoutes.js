const express = require('express');
const router = express.Router();
const {
    getMonthlyReport,
    getNeighborhoodComparison,
    getSavingsTips,
    getCostAnalysis,
    getDashboardSummary,
} = require('../controllers/reportController');
const { protect, heavyOperationLimiter } = require('../middleware');

// All routes require authentication
router.use(protect);

// Monthly PDF report (heavy operation)
router.get('/monthly', heavyOperationLimiter, getMonthlyReport);

// Neighborhood comparison
router.get('/comparison', getNeighborhoodComparison);

// Savings tips
router.get('/savings-tips', getSavingsTips);

// Cost analysis
router.get('/cost-analysis', getCostAnalysis);

// Dashboard summary
router.get('/dashboard', getDashboardSummary);

module.exports = router;
