const express = require('express');
const router = express.Router();
const {
    getTodaySchedules,
    verifyBinAndSchedule,
    updateCollectionStatus,
    completeCollection,
    rejectCollection,
    getCollectorStats
} = require('../controllers/collectorController');

router.get('/schedules', getTodaySchedules);
router.post('/verify-bin', verifyBinAndSchedule);
router.put('/update-status', updateCollectionStatus);
router.put('/complete-collection', completeCollection);
router.put('/reject-collection', rejectCollection);
router.get('/stats/:collectorId', getCollectorStats);

module.exports = router;