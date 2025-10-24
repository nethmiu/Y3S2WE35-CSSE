const mongoose = require('mongoose');

const binSchema = mongoose.Schema(
    {
        qrCode: {
            type: String,
            required: true,
            unique: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        location: {
            address: { type: String, required: true },
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
        },
        binType: {
            type: String,
            required: true,
        },
        capacity: {
            type: Number, // in liters
            required: true,
        },
        binName: { // ADDED: Custom name for the bin
            type: String,
            default: function() {
                return `${this.binType} Bin ${Math.floor(Math.random() * 1000)}`;
            }
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for better query performance
binSchema.index({ user: 1, createdAt: -1 });
binSchema.index({ qrCode: 1 });

const Bin = mongoose.model('Bin', binSchema);
module.exports = Bin;