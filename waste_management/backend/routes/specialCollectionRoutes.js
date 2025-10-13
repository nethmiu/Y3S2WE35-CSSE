const express = require('express');
const router = express.Router();
const { 
    checkAvailability, 
    createSchedule, 
    getAllSchedules,
    getMySchedules 
} = require('../controllers/specialCollectionController');

// GET http://.../api/collections/availability?date=YYYY-MM-DD
router.get('/availability', checkAvailability);

// POST http://.../api/collections
router.post('/', createSchedule);

router.get('/all', getAllSchedules);

// GET http://.../api/collections/my-schedules/USER_ID_GOES_HERE
router.get('/my-schedules/:userId', getMySchedules);

module.exports = router;