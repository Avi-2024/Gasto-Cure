const express = require('express');
const superAdminController = require('../../controllers/admin/superAdmin.controller');
const { authenticate, requireSuperAdmin } = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate, requireSuperAdmin);

router.get('/clinics', superAdminController.listClinics);
router.post('/clinics', superAdminController.onboardClinic);
router.get('/clinics/:clinicId', superAdminController.getClinicSummary);
router.patch('/clinics/:clinicId/status', superAdminController.updateClinicActiveStatus);
router.post('/clinics/:clinicId/doctors', superAdminController.registerDoctorForClinic);
router.get('/clinics/:clinicId/doctors', superAdminController.listClinicDoctors);
router.get('/revenue-overview', superAdminController.getPlatformRevenueOverview);

module.exports = router;
