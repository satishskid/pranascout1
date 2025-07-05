/**
 * Pranayama Coach Backend Server
 * HIPAA/GDPR compliant API server with end-to-end encryption
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sessionsRoutes = require('./routes/sessions');
const vitalSignsRoutes = require('./routes/vitalSigns');
const sensorsRoutes = require('./routes/sensors');
const analyticsRoutes = require('./routes/analytics');
const activitiesRoutes = require('./routes/activities');

// Import middleware
const authMiddleware = require('./middleware/auth');
const encryptionMiddleware = require('./middleware/encryption');
const auditMiddleware = require('./middleware/audit');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting for API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Encryption-Key']
}));

// Body parsing and compression
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Audit logging for HIPAA compliance
app.use(auditMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, encryptionMiddleware, userRoutes);
app.use('/api/sessions', authMiddleware, encryptionMiddleware, sessionsRoutes);
app.use('/api/vital-signs', authMiddleware, encryptionMiddleware, vitalSignsRoutes);
app.use('/api/sensors', authMiddleware, encryptionMiddleware, sensorsRoutes);
app.use('/api/analytics', authMiddleware, encryptionMiddleware, analyticsRoutes);
app.use('/api/activities', authMiddleware, encryptionMiddleware, activitiesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Log security incidents
  if (err.type === 'security') {
    console.error('SECURITY INCIDENT:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// MongoDB connection with encryption
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  sslValidate: true,
  authSource: 'admin',
  retryWrites: true,
  w: 'majority'
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB with encryption enabled');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Pranayama Coach Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`HIPAA/GDPR compliance: ${process.env.COMPLIANCE_MODE || 'enabled'}`);
});

module.exports = app;