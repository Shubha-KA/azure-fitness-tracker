require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');

const app = express();

//
// ========================================
// Environment Variables
// ========================================
//

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const MONGODB_URI = process.env.MONGODB_URI;

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
      retryWrites: false
    });

    console.log('✅ Database connected successfully');
    console.log(`📦 Host : ${conn.connection.host}`);
    console.log(`🗄️ Database : ${conn.connection.name}`);

  } catch (err) {

    console.error('❌ MongoDB connection failed');
    console.error(err.message);

    // Retry after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

connectDB();

//
// ========================================
// Middleware
// ========================================
//

// Parse JSON request body
app.use(express.json());

// Request logging
app.use((req, res, next) => {

  const start = Date.now();

  res.on('finish', () => {

    const duration = Date.now() - start;

    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
});

// Static files
app.use(
  express.static(
    path.join(__dirname, '..', 'public')
  )
);

//
// ========================================
// Routes
// ========================================
//

// Auth routes
app.use('/api/auth', authRoutes);

// Home route
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
// Health Check
// ========================================
//

app.get('/health', (req, res) => {

  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

//
// ========================================
// Global Error Handler
// ========================================
//

app.use((err, req, res, next) => {

  console.error('❌ Unhandled Error');
  console.error(err);

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

  console.log('====================================');
  console.log('🚀 Fitness Tracker Server Started');
  console.log(`🌐 URL : http://${HOST}:${PORT}`);
  console.log(`📊 Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log('====================================');
});
