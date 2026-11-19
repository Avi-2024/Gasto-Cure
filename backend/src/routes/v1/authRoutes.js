const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const { authenticate } = require('../../middleware/auth');

router.post('/login', authController.login);
router.post('/switch-clinic', authenticate, authController.switchActiveClinic);
router.get('/me', authenticate, authController.me);

module.exports = router;
