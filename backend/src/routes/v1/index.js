const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const clinicRoutes = require('./clinicRoutes');

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    platform: 'ClinixPulse™ Multi-Tenant SaaS',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/clinic', clinicRoutes);

module.exports = router;
