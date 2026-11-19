const express = require('express');
const router = express.Router();
const prescriptionController = require('../../controllers/prescriptionController');
const { authenticate, requireClinicRole } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');

router.use(authenticate, tenantContext);

router.get('/', prescriptionController.getPrescriptions);
router.post('/', requireClinicRole('DOCTOR', 'CLINIC_OWNER'), prescriptionController.createPrescription);
router.get('/:id', prescriptionController.getPrescriptionById);

module.exports = router;
