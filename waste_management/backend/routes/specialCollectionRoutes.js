const express = require('express');
const router = express.Router();
const { checkAvailability, createSchedule } = require('../controllers/specialCollectionController');

// GET http://.../api/collections/availability?date=YYYY-MM-DD
router.get('/availability', checkAvailability);

// POST http://.../api/collections
router.post('/', createSchedule);

module.exports = router;