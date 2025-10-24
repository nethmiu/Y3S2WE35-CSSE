const express = require('express');
const router = express.Router();
const {
    getTodaySchedules,
    verifyBinAndSchedule,
    completeCollection,
    rejectCollection
} = require('../controllers/collectorController');

router.get('/schedules', getTodaySchedules);
router.post('/verify-bin', verifyBinAndSchedule);
router.put('/complete-collection', completeCollection);
router.put('/reject-collection', rejectCollection);



module.exports = router;