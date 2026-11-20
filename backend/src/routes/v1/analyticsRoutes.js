const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/analyticsController');
const { authenticate } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');

router.use(authenticate, tenantContext);

router.get('/overview', analyticsController.getOverviewAnalytics);
router.get('/summary', analyticsController.getOverviewAnalytics);

module.exports = router;
