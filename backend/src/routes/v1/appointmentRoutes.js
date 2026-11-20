const express = require('express');
const router = express.Router();
const appointmentController = require('../../controllers/appointmentController');
const { authenticate } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');

// Public Online Booking Endpoints (No Staff Auth Required)
router.get('/public/clinic/:slug', appointmentController.getPublicClinicInfo);
router.post('/public/book', appointmentController.publicBookAppointment);

// Authenticated Staff / Doctor Routes
router.use(authenticate, tenantContext);

router.get('/', appointmentController.getTodayQueue);
router.get('/today', appointmentController.getTodayQueue);
router.post('/', appointmentController.createAppointment);
router.patch('/:id/status', appointmentController.updateAppointmentStatus);
router.all('/reminders/dispatch', appointmentController.dispatchAppointmentReminders);

module.exports = router;
