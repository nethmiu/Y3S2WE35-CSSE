const CollectionSchedule = require('../models/collectionScheduleModel');
const Bin = require('../models/binModel');

// @desc    Get today's schedules for collector
// @route   GET /api/collector/schedules
const getTodaySchedules = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const schedules = await CollectionSchedule.find({
            scheduledDate: { $gte: today, $lt: tomorrow },
            status: 'scheduled'
        })
        .populate('user', 'email')
        .populate('bin', 'location binType capacity')
        .sort({ timeSlot: 1 });

        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Verify bin and schedule
// @route   POST /api/collector/verify-bin
const verifyBinAndSchedule = async (req, res) => {
    const { qrCode, scheduleId } = req.body;

    try {
        // Find bin by QR code
        const bin = await Bin.findOne({ qrCode }).populate('user');
        if (!bin) {
            return res.status(404).json({ message: 'Bin not found' });
        }

        // Find schedule
        const schedule = await CollectionSchedule.findById(scheduleId)
            .populate('user')
            .populate('bin');

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Verify if bin belongs to schedule user
        if (schedule.user._id.toString() !== bin.user._id.toString()) {
            return res.status(400).json({ 
                message: 'Bin does not belong to scheduled user',
                verified: false 
            });
        }

        // Verify schedule is for today and correct time
        const today = new Date();
        const scheduleDate = new Date(schedule.scheduledDate);
        
        if (scheduleDate.toDateString() !== today.toDateString()) {
            return res.status(400).json({ 
                message: 'Schedule is not for today',
                verified: false 
            });
        }

        res.json({
            verified: true,
            schedule: schedule,
            bin: bin,
            user: bin.user
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update waste level and complete collection
// @route   PUT /api/collector/complete-collection
const completeCollection = async (req, res) => {
    const { scheduleId, wasteLevel, notes } = req.body;

    try {
        const schedule = await CollectionSchedule.findById(scheduleId);
        
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        schedule.status = 'completed';
        schedule.wasteLevel = wasteLevel;
        schedule.notes = notes;
        schedule.collectedAt = new Date();

        await schedule.save();

        res.json({ 
            message: 'Collection completed successfully',
            schedule: schedule 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reject collection
// @route   PUT /api/collector/reject-collection
const rejectCollection = async (req, res) => {
    const { scheduleId, reason } = req.body;

    try {
        const schedule = await CollectionSchedule.findById(scheduleId);
        
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        schedule.status = 'rejected';
        schedule.rejectedReason = reason;
        schedule.collectedAt = new Date();

        await schedule.save();

        res.json({ 
            message: 'Collection rejected',
            schedule: schedule 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getTodaySchedules,
    verifyBinAndSchedule,
    completeCollection,
    rejectCollection
};