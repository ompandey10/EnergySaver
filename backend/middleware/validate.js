const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
};

// Auth Validations
const validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidationErrors,
];

const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    handleValidationErrors,
];

// Home Validations
const validateHome = [
    body('name')
        .trim()
        .notEmpty().withMessage('Home name is required')
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('zipCode')
        .trim()
        .notEmpty().withMessage('Zip code is required')
        .matches(/^\d{5}(-\d{4})?$/).withMessage('Please provide a valid zip code'),
    body('address.street').optional().trim(),
    body('address.city').optional().trim(),
    body('address.state').optional().trim(),
    body('squareFootage').optional().isNumeric().withMessage('Square footage must be a number'),
    body('numberOfRooms').optional().isInt({ min: 1 }).withMessage('Number of rooms must be at least 1'),
    body('homeType').optional().isIn(['apartment', 'house', 'condo', 'townhouse', 'other']),
    body('electricityRate').optional().isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
    handleValidationErrors,
];

// Device Validations
const validateDevice = [
    body('homeId')
        .notEmpty().withMessage('Home ID is required')
        .isMongoId().withMessage('Invalid home ID'),
    body('name')
        .trim()
        .notEmpty().withMessage('Device name is required')
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('type')
        .notEmpty().withMessage('Device type is required')
        .isIn([
            'hvac', 'water_heater', 'refrigerator', 'washer', 'dryer',
            'dishwasher', 'oven', 'microwave', 'lighting', 'tv',
            'computer', 'gaming_console', 'ev_charger', 'pool_pump', 'other'
        ]).withMessage('Invalid device type'),
    body('wattage')
        .notEmpty().withMessage('Wattage is required')
        .isFloat({ min: 0 }).withMessage('Wattage must be a positive number'),
    body('brand').optional().trim(),
    body('model').optional().trim(),
    body('location').optional().trim(),
    body('averageUsageHours')
        .optional()
        .isFloat({ min: 0, max: 24 }).withMessage('Usage hours must be between 0 and 24'),
    handleValidationErrors,
];

// Alert Validations
const validateAlert = [
    body('name')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('homeId').optional().isMongoId().withMessage('Invalid home ID'),
    body('deviceId').optional().isMongoId().withMessage('Invalid device ID'),
    body('type')
        .optional()
        .isIn(['usage_limit', 'cost_limit', 'unusual_activity', 'device_offline']),
    body('limitKWh')
        .optional()
        .isFloat({ min: 0 }).withMessage('Limit must be a positive number'),
    body('limitCost')
        .optional()
        .isFloat({ min: 0 }).withMessage('Cost limit must be a positive number'),
    body('period')
        .optional()
        .isIn(['hourly', 'daily', 'weekly', 'monthly']),
    body('threshold')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('Threshold must be between 0 and 100'),
    handleValidationErrors,
];

// Alert Create Validation (requires name)
const validateAlertCreate = [
    body('name')
        .trim()
        .notEmpty().withMessage('Alert name is required')
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('homeId').optional().isMongoId().withMessage('Invalid home ID'),
    body('deviceId').optional().isMongoId().withMessage('Invalid device ID'),
    body('type')
        .optional()
        .isIn(['usage_limit', 'cost_limit', 'unusual_activity', 'device_offline']),
    body('limitKWh')
        .optional()
        .isFloat({ min: 0 }).withMessage('Limit must be a positive number'),
    body('limitCost')
        .optional()
        .isFloat({ min: 0 }).withMessage('Cost limit must be a positive number'),
    body('period')
        .optional()
        .isIn(['hourly', 'daily', 'weekly', 'monthly']),
    body('threshold')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('Threshold must be between 0 and 100'),
    handleValidationErrors,
];

// Common Validations
const validateMongoId = (paramName = 'id') => [
    param(paramName)
        .isMongoId().withMessage(`Invalid ${paramName}`),
    handleValidationErrors,
];

const validateDateRange = [
    query('startDate')
        .optional()
        .isISO8601().withMessage('Start date must be a valid date'),
    query('endDate')
        .optional()
        .isISO8601().withMessage('End date must be a valid date'),
    handleValidationErrors,
];

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    handleValidationErrors,
];

// Device Template Validation
const validateDeviceTemplate = [
    body('name')
        .trim()
        .notEmpty().withMessage('Template name is required'),
    body('type')
        .notEmpty().withMessage('Device type is required')
        .isIn([
            'hvac', 'water_heater', 'refrigerator', 'washer', 'dryer',
            'dishwasher', 'oven', 'microwave', 'lighting', 'tv',
            'computer', 'gaming_console', 'ev_charger', 'pool_pump', 'other'
        ]).withMessage('Invalid device type'),
    body('avgWattage')
        .notEmpty().withMessage('Average wattage is required')
        .isFloat({ min: 0 }).withMessage('Wattage must be a positive number'),
    body('category')
        .optional()
        .isIn(['heating_cooling', 'kitchen', 'laundry', 'entertainment', 'lighting', 'outdoor', 'other']),
    handleValidationErrors,
];

module.exports = {
    handleValidationErrors,
    validateRegister,
    validateLogin,
    validateHome,
    validateDevice,
    validateAlert,
    validateAlertCreate,
    validateMongoId,
    validateDateRange,
    validatePagination,
    validateDeviceTemplate,
};
