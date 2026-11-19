const express = require('express');
const router = express.Router();
const formularyController = require('../../controllers/formularyController');
const { authenticate } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');

router.use(authenticate, tenantContext);

router.get('/', formularyController.getFormularyDrugs);
router.post('/', formularyController.createFormularyDrug);

module.exports = router;
