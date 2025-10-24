const CollectionSchedule = require('../models/collectionScheduleModel');
const Bin = require('../models/binModel');


const getTodaySchedules = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const schedules = await CollectionSchedule.find({
            scheduledDate: { $gte: today, $lt: tomorrow }
        })
        .populate('user', 'email name')
        .populate('bins', 'binName binType capacity location qrCode')  
        .sort({ timeSlot: 1 });

        res.json({
            success: true,
            data: schedules,
            count: schedules.length
        });
    } catch (error) {
        console.error('Error getting today schedules:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error' 
        });
    }
};


const verifyBinAndSchedule = async (req, res) => {
    const { qrCode, collectorId } = req.body;

    try {
        // Find bin by QR code
        const bin = await Bin.findOne({ qrCode })
            .populate('user', 'email name');

        if (!bin) {
            return res.status(404).json({ 
                success: false,
                message: 'Bin not found with this QR code' 
            });
        }

        // Find today's schedule for this bin
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // FIXED: Look for schedules where bins array contains the bin ID
        const schedule = await CollectionSchedule.findOne({
            bins: bin._id, // This checks if bin._id is in the bins array
            scheduledDate: { $gte: today, $lt: tomorrow },
            status: { $in: ['scheduled', 'in-progress'] }
        })
        .populate('user', 'email name')
        .populate('bins', 'binName binType capacity location'); // FIXED: 'bins' not 'bin'

        if (!schedule) {
            return res.status(404).json({ 
                success: false,
                message: 'No active schedule found for this bin today',
                verified: false 
            });
        }

        res.json({
            success: true,
            verified: true,
            schedule: schedule,
            bin: bin,
            user: bin.user
        });

    } catch (error) {
        console.error('Error verifying bin:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error' 
        });
    }
};


const updateCollectionStatus = async (req, res) => {
    const { scheduleId, status } = req.body;

    try {
        const schedule = await CollectionSchedule.findById(scheduleId)
            .populate('user', 'email name')
            .populate('bins', 'binName binType capacity location'); // FIXED: 'bins' not 'bin'
        
        if (!schedule) {
            return res.status(404).json({ 
                success: false,
                message: 'Schedule not found' 
            });
        }

        schedule.status = status;
        
        // If starting collection, set start time
        if (status === 'in-progress') {
            schedule.startedAt = new Date();
        }

        await schedule.save();

        res.json({ 
            success: true,
            message: `Collection ${status} successfully`,
            data: schedule 
        });

    } catch (error) {
        console.error('Error updating collection status:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error' 
        });
    }
};


const completeCollection = async (req, res) => {
    const { scheduleId, wasteLevel, notes } = req.body;

    try {
        const schedule = await CollectionSchedule.findById(scheduleId)
            .populate('user', 'email name')
            .populate('bins', 'binName binType capacity location'); // FIXED: 'bins' not 'bin'
        
        if (!schedule) {
            return res.status(404).json({ 
                success: false,
                message: 'Schedule not found' 
            });
        }

        if (wasteLevel < 0 || wasteLevel > 100) {
            return res.status(400).json({ 
                success: false,
                message: 'Waste level must be between 0 and 100' 
            });
        }

        schedule.status = 'completed';
        schedule.wasteLevel = wasteLevel;
        schedule.notes = notes;
        schedule.collectedAt = new Date();

        await schedule.save();

        res.json({ 
            success: true,
            message: 'Collection completed successfully',
            data: schedule 
        });

    } catch (error) {
        console.error('Error completing collection:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error' 
        });
    }
};


const rejectCollection = async (req, res) => {
    const { scheduleId, reason } = req.body;

    try {
        const schedule = await CollectionSchedule.findById(scheduleId)
            .populate('user', 'email name')
            .populate('bins', 'binName binType capacity location'); // FIXED: 'bins' not 'bin'
        
        if (!schedule) {
            return res.status(404).json({ 
                success: false,
                message: 'Schedule not found' 
            });
        }

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ 
                success: false,
                message: 'Rejection reason is required' 
            });
        }

        schedule.status = 'rejected';
        schedule.rejectedReason = reason;
        schedule.collectedAt = new Date();

        await schedule.save();

        res.json({ 
            success: true,
            message: 'Collection rejected successfully',
            data: schedule 
        });

    } catch (error) {
        console.error('Error rejecting collection:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error' 
        });
    }
};

const getTodayPendingSchedules = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const schedules = await CollectionSchedule.find({
            scheduledDate: { $gte: today, $lt: tomorrow },
            status: { $in: ['scheduled', 'in-progress'] }
        })
        .populate('user', 'email name')
        .populate('bins', 'binName binType capacity location qrCode')  
        .sort({ timeSlot: 1 });

        res.json({
            success: true,
            data: schedules,
            count: schedules.length
        });
    } catch (error) {
        console.error('Error getting today schedules:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error' 
        });
    }
};


const getCollectorStats = async (req, res) => {
    try {
        const { collectorId } = req.params;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get this week's start (Monday)
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);

        // Get today's collections
        const todayCollections = await CollectionSchedule.find({
            scheduledDate: { $gte: today, $lt: tomorrow }
        });

        // Get this week's collections
        const weekCollections = await CollectionSchedule.find({
            scheduledDate: { $gte: weekStart }
        });

        // Get all collections
        const allCollections = await CollectionSchedule.find({});

        const stats = {
            totalCollections: allCollections.length,
            todayCollections: todayCollections.length,
            completedToday: todayCollections.filter(c => c.status === 'completed').length,
            completedThisWeek: weekCollections.filter(c => c.status === 'completed').length,
            performance: todayCollections.length > 0 ? 
                Math.round((todayCollections.filter(c => c.status === 'completed').length / todayCollections.length) * 100) : 0
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error getting collector stats:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error' 
        });
    }
};

module.exports = {
    getTodaySchedules,
    verifyBinAndSchedule,
    updateCollectionStatus,
    completeCollection,
    rejectCollection,
    getCollectorStats,
    getTodayPendingSchedules
};