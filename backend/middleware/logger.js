const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
    if (!req._startAt || !res._startAt) {
        return '-';
    }
    const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
        (res._startAt[1] - req._startAt[1]) * 1e-6;
    return ms.toFixed(3);
});

// Custom token for user ID
morgan.token('user-id', (req) => {
    return req.user ? req.user._id : 'anonymous';
});

// Custom format for development
const devFormat = ':method :url :status :response-time-ms ms - :res[content-length]';

// Custom format for production
const prodFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms';

// Create write stream for access logs
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' }
);

// Development logger - colored output to console
const devLogger = morgan(devFormat, {
    skip: (req, res) => {
        // Skip logging for health checks in development
        return req.url === '/api/health';
    },
});

// Production logger - writes to file
const prodLogger = morgan(prodFormat, {
    stream: accessLogStream,
});

// Combined logger for production - console + file
const combinedLogger = (req, res, next) => {
    // Log to file
    morgan(prodFormat, { stream: accessLogStream })(req, res, () => { });
    // Log to console (simplified)
    morgan('short')(req, res, next);
};

// Request logger middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user ? req.user._id : null,
        };

        // Log errors with more detail
        if (res.statusCode >= 400) {
            console.error('Request Error:', JSON.stringify(logData, null, 2));
        }
    });

    next();
};

// Get appropriate logger based on environment
const getLogger = () => {
    if (process.env.NODE_ENV === 'production') {
        return combinedLogger;
    }
    return devLogger;
};

module.exports = {
    devLogger,
    prodLogger,
    combinedLogger,
    requestLogger,
    getLogger,
};
