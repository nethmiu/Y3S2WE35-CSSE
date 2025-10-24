const mongoose = require('mongoose');

const collectionScheduleSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        collector: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        bins: [{
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Bin',
        }],
        scheduledDate: {
            type: Date,
            required: true,
        },
        timeSlot: {
            type: String,
            required: true,
        },
        collectionType: {
            type: String,
            enum: ['regular', 'special'],
            default: 'regular',
        },
        status: {
            type: String,
            enum: ['scheduled', 'in-progress', 'completed', 'rejected', 'cancelled'],
            default: 'scheduled',
        },
        wasteLevel: {
            type: Number, // percentage 0-100
            default: 0,
        },
        notes: {
            type: String,
        },
        collectedAt: {
            type: Date,
        },
        rejectedReason: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const CollectionSchedule = mongoose.model('CollectionSchedule', collectionScheduleSchema);
module.exports = CollectionSchedule;