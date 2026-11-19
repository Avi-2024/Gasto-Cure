const express = require('express');
const cors = require('cors');
const path = require('path');
const routesV1 = require('./routes/v1');

const app = express();

// Allowed Origins for CORS
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5174').split(',');

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((o) => origin.startsWith(o.trim()))) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly permissive
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Clinic-Id', 'x-clinic-id'],
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
  });
});

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
