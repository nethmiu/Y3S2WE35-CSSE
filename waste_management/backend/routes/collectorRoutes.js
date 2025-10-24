const express = require('express');
const router = express.Router();
const {
    getTodaySchedules,
    verifyBinAndSchedule,
    updateCollectionStatus,
    completeCollection,
    rejectCollection,
    getCollectorStats,
    getTodayPendingSchedules
} = require('../controllers/collectorController');

router.get('/schedules', getTodaySchedules);
router.get('/pending-schedules', getTodayPendingSchedules);
router.post('/verify-bin', verifyBinAndSchedule);
router.put('/update-status', updateCollectionStatus);
router.put('/complete-collection', completeCollection);
router.put('/reject-collection', rejectCollection);
router.get('/stats/:collectorId', getCollectorStats);

module.exports = router;