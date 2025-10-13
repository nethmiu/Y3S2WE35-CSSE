const express = require('express');
const router = express.Router();
const { createPaymentIntent } = require('../controllers/paymentController');

// POST http://.../api/payments/create-payment-intent
router.post('/create-payment-intent', createPaymentIntent);

module.exports = router;