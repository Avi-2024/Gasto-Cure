const express = require('express');
const router = express.Router();
const invoiceController = require('../../controllers/invoiceController');
const { authenticate } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');

router.use(authenticate, tenantContext);

router.get('/', invoiceController.getInvoices);
router.post('/', invoiceController.createInvoice);
router.patch('/:id/status', invoiceController.updateInvoiceStatus);

module.exports = router;
