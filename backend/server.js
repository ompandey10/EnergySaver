const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Initialize Express app
const app = express();

// ===================
// Middleware Setup
// ===================

// Security headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from these origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Request logging with Morgan
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files - uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===================
// Database Connection
// ===================
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8.x doesn't need these options anymore, but keeping for reference
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// ===================
// Routes
// ===================

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Import middleware
const { notFound, errorHandler } = require('./middleware');

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/homes', require('./routes/homeRoutes'));
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/readings', require('./routes/readingRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ===================
// Error Handling
// ===================

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

// ===================
// Server Startup
// ===================
const PORT = process.env.PORT || 5000;

// Import alert checker for cron jobs
const { startAlertChecker } = require('./utils/alertChecker');

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start cron jobs
    if (process.env.NODE_ENV !== 'test') {
      // Check alerts every hour (0 * * * *)
      startAlertChecker('0 * * * *');
      console.log('Alert checker cron job started');
    }

    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${PORT} is already in use.`);
        console.error(`\nTo fix this, run one of these commands:`);
        console.error(`  1. Kill the process: lsof -ti:${PORT} | xargs kill -9`);
        console.error(`  2. Use a different port: PORT=5001 npm run dev\n`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down gracefully...');
      server.close(async () => {
        console.log('Server closed');
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
