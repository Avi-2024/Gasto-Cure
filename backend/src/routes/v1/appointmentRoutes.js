const express = require('express');
const router = express.Router();
const appointmentController = require('../../controllers/appointmentController');
const { authenticate } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');

router.use(authenticate, tenantContext);

router.get('/today', appointmentController.getTodayQueue);
router.post('/', appointmentController.createAppointment);
router.patch('/:id/status', appointmentController.updateAppointmentStatus);

module.exports = router;
