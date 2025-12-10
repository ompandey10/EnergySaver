const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login attempts per hour
    message: {
        success: false,
        message: 'Too many login attempts, please try again after an hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
});

// Limiter for password reset
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 password reset requests per hour
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again after an hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiter for data-intensive operations
const heavyOperationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 heavy operations per minute
    message: {
        success: false,
        message: 'Too many requests, please slow down',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Create custom rate limiter
const createRateLimiter = (options) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: {
            success: false,
            message: 'Too many requests, please try again later',
        },
        standardHeaders: true,
        legacyHeaders: false,
    };

    return rateLimit({ ...defaultOptions, ...options });
};

module.exports = {
    apiLimiter,
    authLimiter,
    passwordResetLimiter,
    heavyOperationLimiter,
    createRateLimiter,
};
