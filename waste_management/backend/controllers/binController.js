const Bin = require('../models/binModel');
const QRCode = require('qrcode');
const User = require('../models/userModel');
const e = require('express');

// @desc    Create new bin for user
// @route   POST /api/bins
const createBin = async (req, res) => {
    const { userId, location, binType, capacity, binName } = req.body;

    try {
        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate unique QR code
        const qrCode = `BIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const bin = new Bin({
            qrCode,
            user: userId,
            location,
            binType,
            capacity,
            binName: binName || `${binType} Bin`
        });

        const createdBin = await bin.save();
        
        // Generate QR code image
        const qrCodeImage = await QRCode.toDataURL(qrCode);
        
        res.status(201).json({
            ...createdBin._doc,
            qrCodeImage
        });
    } catch (error) {
        res.status(400).json({ message: 'Error creating bin: ' + error.message });
    }
};

// @desc    Get all bins (for managers/admins)
// @route   GET /api/bins
const getBins = async (req, res) => {
    try {
        const bins = await Bin.find({})
            .populate('user', 'email profile')
            .sort({ createdAt: -1 });
        res.json(bins);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get bins by user ID (for regular users)
// @route   GET /api/bins/user/:userId
const getBinsByUser = async (req, res) => {
    try {
        const bins = await Bin.find({ user: req.params.userId })
            .sort({ createdAt: -1 });
        
        res.json({
            count: bins.length,
            bins: bins
        });
    } catch (error) {
        res.status(500).json(error);
        console.log(error);
    }
};

// @desc    Get bin by ID
// @route   GET /api/bins/:id
const getBinById = async (req, res) => {
    try {
        const bin = await Bin.findById(req.params.id)
            .populate('user', 'email profile');
        
        if (!bin) {
            return res.status(404).json({ message: 'Bin not found' });
        }

        // Generate QR code for the bin
        const qrCodeImage = await QRCode.toDataURL(bin.qrCode);
        
        res.json({
            ...bin._doc,
            qrCodeImage
        });
    } catch (error) {
        res.status(404).json({ message: 'Bin not found' });
    }
};

// @desc    Generate QR code for bin
// @route   GET /api/bins/:id/qrcode
const generateQRCode = async (req, res) => {
    try {
        const bin = await Bin.findById(req.params.id)
            .populate('user', 'email profile');
        
        if (!bin) {
            return res.status(404).json({ message: 'Bin not found' });
        }

        const qrCodeImage = await QRCode.toDataURL(bin.qrCode);
        
        res.json({
            qrCode: bin.qrCode,
            qrCodeImage,
            binDetails: {
                id: bin._id,
                binName: bin.binName,
                type: bin.binType,
                capacity: bin.capacity,
                location: bin.location,
                user: bin.user
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating QR code' });
    }
};

// @desc    Update bin
// @route   PUT /api/bins/:id
const updateBin = async (req, res) => {
    const { location, binType, capacity, isActive, binName } = req.body;

    try {
        const bin = await Bin.findById(req.params.id);
        
        if (bin) {
            bin.location = location || bin.location;
            bin.binType = binType || bin.binType;
            bin.capacity = capacity || bin.capacity;
            bin.isActive = isActive !== undefined ? isActive : bin.isActive;
            bin.binName = binName || bin.binName;

            const updatedBin = await bin.save();
            res.json(updatedBin);
        } else {
            res.status(404).json({ message: 'Bin not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error updating bin' });
    }
};

// @desc    Delete bin
// @route   DELETE /api/bins/:id
const deleteBin = async (req, res) => {
    try {
        const bin = await Bin.findById(req.params.id);
        
        if (bin) {
            await bin.deleteOne();
            res.json({ message: 'Bin removed successfully' });
        } else {
            res.status(404).json({ message: 'Bin not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user's bin statistics
// @route   GET /api/bins/user/:userId/stats
const getUserBinStats = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const bins = await Bin.find({ user: userId });
        const totalBins = bins.length;
        const activeBins = bins.filter(bin => bin.isActive).length;
        
        const binTypeStats = {};
        bins.forEach(bin => {
            if (!binTypeStats[bin.binType]) {
                binTypeStats[bin.binType] = 0;
            }
            binTypeStats[bin.binType]++;
        });

        res.json({
            totalBins,
            activeBins,
            inactiveBins: totalBins - activeBins,
            binTypeStats,
            totalCapacity: bins.reduce((sum, bin) => sum + bin.capacity, 0)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createBin,
    getBins,
    getBinsByUser,
    getBinById,
    generateQRCode,
    updateBin,
    deleteBin,
    getUserBinStats // NEW
};