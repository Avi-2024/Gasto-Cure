const express = require('express');
const router = express.Router();
const clinicController = require('../../controllers/clinicController');
const { authenticate, requireClinicRole } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');

// Clinic branding routes (hydrates Header, Sidebar, Prescriptions)
router.get('/current/branding', authenticate, tenantContext, clinicController.getCurrentClinicBranding);
router.put('/current/branding', authenticate, tenantContext, requireClinicRole('CLINIC_OWNER'), clinicController.updateCurrentClinicBranding);

module.exports = router;
