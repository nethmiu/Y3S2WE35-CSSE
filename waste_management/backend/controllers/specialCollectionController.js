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
    const { userId, date, timeSlot, wasteType, location, remarks } = req.body;

    if (!userId || !date || !timeSlot || !wasteType || !location) {
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
        });

        const createdSchedule = await newSchedule.save();
        res.status(201).json(createdSchedule);

    } catch (error) {
        res.status(500).json({ message: 'Failed to create schedule' });
    }
};

module.exports = { checkAvailability, createSchedule };