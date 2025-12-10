const { protect, optionalAuth } = require('./auth');
const { authorize, isAdmin, checkOwnership } = require('./authorize');
const {
    handleValidationErrors,
    validateRegister,
    validateLogin,
    validateHome,
    validateDevice,
    validateAlert,
    validateMongoId,
    validateDateRange,
    validatePagination,
    validateDeviceTemplate,
} = require('./validate');
const { AppError, notFound, errorHandler, asyncHandler } = require('./error');
const {
    apiLimiter,
    authLimiter,
    passwordResetLimiter,
    heavyOperationLimiter,
    createRateLimiter,
} = require('./rateLimiter');
const { devLogger, prodLogger, combinedLogger, requestLogger, getLogger } = require('./logger');

module.exports = {
    // Auth
    protect,
    optionalAuth,

    // Authorization
    authorize,
    isAdmin,
    checkOwnership,

    // Validation
    handleValidationErrors,
    validateRegister,
    validateLogin,
    validateHome,
    validateDevice,
    validateAlert,
    validateMongoId,
    validateDateRange,
    validatePagination,
    validateDeviceTemplate,

    // Error handling
    AppError,
    notFound,
    errorHandler,
    asyncHandler,

    // Rate limiting
    apiLimiter,
    authLimiter,
    passwordResetLimiter,
    heavyOperationLimiter,
    createRateLimiter,

    // Logging
    devLogger,
    prodLogger,
    combinedLogger,
    requestLogger,
    getLogger,
};
