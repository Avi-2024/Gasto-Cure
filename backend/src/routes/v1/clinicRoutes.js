const express = require('express');
const multer = require('multer');
const router = express.Router();
const clinicController = require('../../controllers/clinicController');
const { authenticate, requireClinicRole } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPEG, WEBP, SVG) are allowed for clinic logos.'));
    }
  },
});

// Clinic branding routes (hydrates Header, Sidebar, Prescriptions)
router.get('/current/branding', authenticate, tenantContext, clinicController.getCurrentClinicBranding);
router.put('/current/branding', authenticate, tenantContext, requireClinicRole('CLINIC_OWNER'), clinicController.updateCurrentClinicBranding);
router.post('/current/logo', authenticate, tenantContext, requireClinicRole('CLINIC_OWNER'), upload.single('logo'), clinicController.uploadClinicLogo);

module.exports = router;
