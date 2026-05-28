// Initialize Datadog tracing FIRST - must be before other imports
const { tracer, logger } = require('./datadog');

// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');

// Create Express app
const app = express();

//
// ========================================
// Environment Variables
// ========================================
//

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

// Validate MongoDB URI
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is missing');
  process.exit(1);
}

//
// ========================================
// MongoDB Connection
// ========================================
//

const connectDB = async () => {
  try {

    const conn = await mongoose.connect(MONGODB_URI, {
      ssl: true,
      retryWrites: false,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('Database connection established', {
      host: conn.connection.host,
      database: conn.connection.name,
      action: 'mongodb_connected'
    });

    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);

  } catch (err) {

    logger.error('Database connection failed', {
      error: err.message,
      action: 'mongodb_connection_failed'
    });

    console.error('❌ MongoDB connection error:', err.message);

    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Initialize MongoDB connection
connectDB();

//
// ========================================
// Middleware
// ========================================
//

// Parse incoming JSON
app.use(express.json());

// HTTP Request Logging Middleware
app.use((req, res, next) => {

  const start = Date.now();

  res.on('finish', () => {

    const duration = Date.now() - start;

    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      action: 'http_request'
    });
  });

  next();
});

// Serve static files
app.use(
  express.static(
    path.join(__dirname, '..', 'public')
  )
);

//
// ========================================
// API Debug Middleware
// ========================================
//

app.use('/api/auth', (req, res, next) => {

  logger.info('API AUTH REQUEST RECEIVED', {
    method: req.method,
    path: req.path,
    url: req.url,
    body: req.body,
    query: req.query,
    action: 'api_auth_request'
  });

  next();
});

//
// ========================================
// Routes
// ========================================
//

// Authentication routes
app.use('/api/auth', authRoutes);

// Root route
app.get('/', (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      '..',
      'public',
      'pages',
      'index.html'
    )
  );
});

//
// ========================================
// Health Check Endpoint
// ========================================
//

app.get('/health', (req, res) => {

  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

//
// ========================================
// Global Error Handler
// ========================================
//

app.use((err, req, res, next) => {

  logger.error('Unhandled Application Error', {
    error: err.message,
    stack: err.stack,
    action: 'unhandled_error'
  });

  console.error('❌ Unhandled Error:', err);

  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

//
// ========================================
// Start Server
// ========================================
//

app.listen(PORT, HOST, () => {

  logger.info('Server started successfully', {
    host: HOST,
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    action: 'server_started'
  });

  console.log('====================================');
  console.log(`🚀 Fitness Tracker Server Started`);
  console.log(`🌐 URL : http://${HOST}:${PORT}`);
  console.log(`📊 Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log('====================================');
});
