const mongoose = require('mongoose');

const specialCollectionSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // User model එකට සම්බන්ධ කිරීම
        },
        date: {
            type: Date,
            required: true,
        },
        timeSlot: {
            type: String, // උදා: "8:00 AM - 11:00 AM"
            required: true,
        },
        wasteType: {
            type: String,
            required: true,
        },
        location: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
        },
        remarks: {
            type: String,
        },
        paymentStatus: {
            type: String,
            required: true,
            default: 'Paid',
        },
        status: {
            type: String,
            required: true,
            default: 'Pending', // එකතු කිරීමට නියමිත
        },
    },
    {
        timestamps: true,
    }
);

const SpecialCollection = mongoose.model('SpecialCollection', specialCollectionSchema);

module.exports = SpecialCollection;