const express = require('express');
const router = express.Router();
const {
    createBin,
    getBins,
    getBinsByUser,
    getBinById,
    generateQRCode,
    updateBin,
    deleteBin,
    getUserBinStats
} = require('../controllers/binController');

router.route('/')
    .post(createBin)
    .get(getBins);

router.route('/user/:userId')
    .get(getBinsByUser);

router.route('/user/:userId/stats') // NEW
    .get(getUserBinStats);

router.route('/:id')
    .get(getBinById)
    .put(updateBin)
    .delete(deleteBin);

router.route('/:id/qrcode')
    .get(generateQRCode);

module.exports = router;