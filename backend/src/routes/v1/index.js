const express = require('express');
const router = express.Router();
const prisma = require('../../config/prisma');

const authRoutes = require('./authRoutes');
const clinicRoutes = require('./clinicRoutes');
const patientRoutes = require('./patientRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const prescriptionRoutes = require('./prescriptionRoutes');
const formularyRoutes = require('./formularyRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const adminRoutes = require('./admin.routes');

router.get('/health', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = null;
  let dbError = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
    dbLatencyMs = Date.now() - startTime;
  } catch (err) {
    dbStatus = 'error';
    dbError = err.message;
  }

  const isHealthy = dbStatus === 'connected';
  const statusCode = isHealthy ? 200 : 503;

  return res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'degraded',
    platform: 'ClinixPulse™ Multi-Tenant SaaS',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      database: {
        provider: 'Supabase PostgreSQL (Prisma)',
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError && { error: dbError }),
      },
    },
  });
});

router.use('/auth', authRoutes);
router.use('/clinic', clinicRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/formulary', formularyRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
