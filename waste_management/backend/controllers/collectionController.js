const CollectionSchedule = require('../models/collectionScheduleModel');
const Bin = require('../models/binModel');

// @desc    Create collection schedule
// @route   POST /api/collections/regular
const createCollection = async (req, res) => {
    try {
        const { userId, binIds, scheduledDate, timeSlot, collectionType } = req.body;

        // Validate required fields
        if (!userId || !binIds || !scheduledDate || !timeSlot) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: userId, binIds, scheduledDate, timeSlot'
            });
        }

        // Validate binIds is an array and not empty
        if (!Array.isArray(binIds) || binIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'binIds must be a non-empty array'
            });
        }

        // Verify all bins exist and belong to the user
        const bins = await Bin.find({ 
            _id: { $in: binIds },
            user: userId 
        });

        if (bins.length !== binIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more bins not found or do not belong to the user'
            });
        }

        const collection = new CollectionSchedule({
            user: userId,
            bins: binIds,
            scheduledDate,
            timeSlot,
            collectionType: collectionType || 'regular'
        });

        const savedCollection = await collection.save();
        
        // Populate bin details in the response
        await savedCollection.populate('bins', 'binName binType capacity location');

        res.status(201).json({
            success: true,
            data: savedCollection
        });
    } catch (error) {
        console.error('Error creating collection:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating collection schedule',
            error: error.message
        });
    }
};

// @desc    Get all collections
// @route   GET /api/collections/regular
const getCollections = async (req, res) => {
    try {
        const collections = await CollectionSchedule.find({})
            .populate('user', 'email profile')
            .populate('bins', 'binName binType capacity location') // FIXED: 'bin' to 'bins'
            .sort({ scheduledDate: -1 });
        
        res.json({
            success: true,
            data: collections
        });
    } catch (error) {
        console.error('Error getting collections:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error' 
        });
    }
};

// @desc    Get collections by user ID
// @route   GET /api/collections/regular/user/:userId
const getCollectionsByUser = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const skip = (page - 1) * limit;

        let query = { user: req.params.userId };
        if (status) query.status = status;

        const collections = await CollectionSchedule.find(query)
            .populate('bins', 'binName binType capacity location') // FIXED: 'bin' to 'bins'
            .sort({ scheduledDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await CollectionSchedule.countDocuments(query);

        res.json({
            success: true,
            data: collections,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting user collections:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error' 
        });
    }
};

// @desc    Get collection summary for user
// @route   GET /api/collections/regular/summary/:userId
const getCollectionSummary = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const collections = await CollectionSchedule.find({ user: userId })
            .populate('bins', 'binType capacity binName'); // FIXED: 'bin' to 'bins'
        
        const summary = {
            totalCollections: collections.length,
            completed: collections.filter(c => c.status === 'completed').length,
            pending: collections.filter(c => c.status === 'scheduled').length,
            inProgress: collections.filter(c => c.status === 'in-progress').length,
            rejected: collections.filter(c => c.status === 'rejected').length,
            cancelled: collections.filter(c => c.status === 'cancelled').length,
            upcoming: collections.filter(c => 
                c.status === 'scheduled' && 
                new Date(c.scheduledDate) > new Date()
            ).length,
            byBinType: {},
            recentActivity: collections
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 5)
        };

        // Calculate by bin type - FIXED: Handle multiple bins
        collections.forEach(collection => {
            collection.bins.forEach(bin => {
                const binType = bin?.binType || 'unknown';
                if (!summary.byBinType[binType]) {
                    summary.byBinType[binType] = 0;
                }
                summary.byBinType[binType]++;
            });
        });

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error getting collection summary:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
};

// @desc    Update collection schedule
// @route   PUT /api/collections/regular/:id
const updateCollection = async (req, res) => {
    try {
        const { scheduledDate, timeSlot, status, wasteLevel, notes, collector } = req.body;

        const collection = await CollectionSchedule.findById(req.params.id);
        
        if (collection) {
            collection.scheduledDate = scheduledDate || collection.scheduledDate;
            collection.timeSlot = timeSlot || collection.timeSlot;
            collection.status = status || collection.status;
            collection.wasteLevel = wasteLevel || collection.wasteLevel;
            collection.notes = notes || collection.notes;
            collection.collector = collector || collection.collector;

            // If status is being completed, set collectedAt
            if (status === 'completed' && collection.status !== 'completed') {
                collection.collectedAt = new Date();
            }

            const updatedCollection = await collection.save();
            await updatedCollection.populate('bins', 'binName binType capacity location');
            await updatedCollection.populate('collector', 'email profile');

            res.json({
                success: true,
                data: updatedCollection
            });
        } else {
            res.status(404).json({ 
                success: false,
                message: 'Collection schedule not found' 
            });
        }
    } catch (error) {
        console.error('Error updating collection:', error);
        res.status(400).json({ 
            success: false,
            message: 'Error updating collection: ' + error.message
        });
    }
};

// @desc    Delete collection schedule
// @route   DELETE /api/collections/regular/:id
const deleteCollection = async (req, res) => {
    try {
        const collection = await CollectionSchedule.findById(req.params.id);
        
        if (collection) {
            await collection.deleteOne();
            res.json({ 
                success: true,
                message: 'Collection schedule removed successfully' 
            });
        } else {
            res.status(404).json({ 
                success: false,
                message: 'Collection schedule not found' 
            });
        }
    } catch (error) {
        console.error('Error deleting collection:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
};

// @desc    Get upcoming collections for user
// @route   GET /api/collections/regular/upcoming/:userId
const getUpcomingCollections = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const upcomingCollections = await CollectionSchedule.find({
            user: userId,
            status: 'scheduled',
            scheduledDate: { $gte: new Date() }
        })
        .populate('bins', 'binName binType capacity location')
        .sort({ scheduledDate: 1 })
        .limit(5);

        res.json({
            success: true,
            data: upcomingCollections
        });
    } catch (error) {
        console.error('Error getting upcoming collections:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message
        });
    }
};

module.exports = {
    createCollection,
    getCollections,
    getCollectionsByUser,
    getCollectionSummary,
    getUpcomingCollections, // NEW
    updateCollection,
    deleteCollection
};