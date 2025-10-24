// routes/collectionRoutes.js
const express = require('express');
const router = express.Router();
const {
    createCollection,
    getCollections,
    getCollectionsByUser,
    getCollectionSummary,
    getUpcomingCollections,
    updateCollection,
    deleteCollection
} = require('../controllers/collectionController');

router.route('/')
    .post(createCollection)
    .get(getCollections);

    

router.route('/user/:userId')
    .get(getCollectionsByUser);

router.route('/summary/:userId')
    .get(getCollectionSummary);

router.route('/upcoming/:userId')
    .get(getUpcomingCollections);

router.route('/:id')
    .put(updateCollection)
    .delete(deleteCollection);

module.exports = router;