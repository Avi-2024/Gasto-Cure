const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const routesV1 = require('./routes/v1');

const app = express();

// 1. Correlation ID Middleware (Essential for Production Traceability)
app.use((req, res, next) => {
  const correlationId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = correlationId;
  res.setHeader('X-Request-Id', correlationId);

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      const clinicHeader = req.headers['x-clinic-id'] ? `[Tenant: ${req.headers['x-clinic-id']}]` : '';
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms ${clinicHeader} (reqId: ${correlationId})`);
    }
  });

  next();
});

// 2. Production CORS Configuration
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5174').split(',');

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((o) => origin.startsWith(o.trim()))) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Clinic-Id', 'x-clinic-id', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder for offline/local storage fallback
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API v1
app.use('/api/v1', routesV1);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'ClinixPulse™ Outpatient SaaS Backend API',
    docs: '/api/v1/health',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    requestId: req.id,
  });
});

// Global Production Error Boundary
app.use((err, req, res, next) => {
  console.error(`🔥 [Error] [ReqId: ${req.id}]`, err);

  const statusCode = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    requestId: req.id,
    ...(isProd ? {} : { stack: err.stack }),
  });
});

module.exports = app;
