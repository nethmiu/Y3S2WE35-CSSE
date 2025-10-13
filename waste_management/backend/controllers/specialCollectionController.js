const SpecialCollection = require('../models/specialCollectionModel');

const TIME_SLOTS = [
    '8:00 AM - 11:00 AM',
    '11:00 AM - 2:00 PM',
    '2:00 PM - 5:00 PM',
];
const SLOT_LIMIT = 5;

// @desc    Check available time slots for a given date
// @route   GET /api/collections/availability
const checkAvailability = async (req, res) => {
    const { date } = req.query; // date එන්නේ 'YYYY-MM-DD' format එකෙන්
    if (!date) {
        return res.status(400).json({ message: 'Date is required' });
    }

    try {
        const selectedDate = new Date(date);
        
        // දවසේ ආරම්භය සහ අවසානය සකස් කිරීම
        const startOfDay = new Date(selectedDate.setUTCHours(0, 0, 0, 0));
        const endOfDay = new Date(selectedDate.setUTCHours(23, 59, 59, 999));

        // අදාළ දිනයේ ඇති සියලුම bookings ලබාගැනීම
        const bookingsOnDate = await SpecialCollection.find({
            date: { $gte: startOfDay, $lte: endOfDay },
        });

        const availableSlots = [];
        TIME_SLOTS.forEach(slot => {
            const bookingsInSlot = bookingsOnDate.filter(booking => booking.timeSlot === slot).length;
            if (bookingsInSlot < SLOT_LIMIT) {
                availableSlots.push(slot);
            }
        });

        res.json(availableSlots);

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new special collection schedule
// @route   POST /api/collections
const createSchedule = async (req, res) => {
    // --- weight සහ totalAmount මෙහිදී ලබාගැනීම ---
    const { userId, date, timeSlot, wasteType, location, remarks, weight, totalAmount } = req.body;

    // --- validation එකට නව fields එක් කිරීම ---
    if (!userId || !date || !timeSlot || !wasteType || !location || !weight || !totalAmount) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const newSchedule = new SpecialCollection({
            user: userId,
            date: new Date(date),
            timeSlot,
            wasteType,
            location,
            remarks,
            weight, // නව field එක දත්ත සමුදායට එක් කිරීම
            totalAmount, // නව field එක දත්ත සමුදායට එක් කිරීම
        });

        const createdSchedule = await newSchedule.save();
        res.status(201).json(createdSchedule);

    } catch (error) {
        res.status(500).json({ message: 'Failed to create schedule' });
    }
};

// @desc    Get all special collection schedules
// @route   GET /api/collections/all
const getAllSchedules = async (req, res) => {
    try {
        const schedules = await SpecialCollection.find({})
            .populate('user', 'email') // User model එකෙන් email එක පමණක් ලබාගැනීම
            .sort({ date: -1 }); // නවතම ඒවා ඉහළින් පෙන්වීමට

        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get logged in user's special collection schedules
// @route   GET /api/collections/my-schedules/:userId
const getMySchedules = async (req, res) => {
    try {
        const schedules = await SpecialCollection.find({ user: req.params.userId })
            .sort({ date: -1 }); // නවතම ඒවා ඉහළින් පෙන්වීමට

        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { 
    checkAvailability, 
    createSchedule, 
    getAllSchedules, 
    getMySchedules // නව function එක export කිරීම
};