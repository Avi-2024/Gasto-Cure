const express = require('express');
const router = express.Router();
const patientController = require('../../controllers/patientController');
const { authenticate } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');

router.use(authenticate, tenantContext);

router.get('/', patientController.getPatients);
router.post('/', patientController.createPatient);
router.get('/:id', patientController.getPatientById);

module.exports = router;
