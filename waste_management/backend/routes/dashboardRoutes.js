// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');

// This route serves the main dashboard data.
router.get('/', getDashboardData);

module.exports = router;