// Business Logic Components - Centralized exports

// Reading Simulator
const readingSimulator = require('./readingSimulator');

// Alert Checker
const alertChecker = require('./alertChecker');

// Cost Calculator
const costCalculator = require('./costCalculator');

// Comparison Engine
const comparisonEngine = require('./comparisonEngine');

// Tip Generator
const tipGenerator = require('./tipGenerator');

// PDF Generator
const pdfGenerator = require('./pdfGenerator');

module.exports = {
    // Reading Simulator
    ...readingSimulator,

    // Alert Checker
    ...alertChecker,

    // Cost Calculator
    ...costCalculator,

    // Comparison Engine
    ...comparisonEngine,

    // Tip Generator
    ...tipGenerator,

    // PDF Generator
    ...pdfGenerator,
};
