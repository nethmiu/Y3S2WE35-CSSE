const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail, sendAccountCreationEmail,sendPasswordResetEmail } = require('../utils/email');
const crypto = require('crypto'); // OTP hash
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user },
    });
};

// Configure multer for file upload
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'users');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(path.join(uploadsDir, req.file.filename));

    next();
};

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, householdMembers, address, city } = req.body;

        const newUser = await User.create({
            name, email, password, householdMembers, address, city,
        });

        
        try {
            // After user creating send welcome email
            await sendWelcomeEmail(newUser.email, newUser.name);
        } catch (emailError) {
            // If failed to send email, log the error
            // but do not prevent user registration
            console.error('There was an error sending the welcome email:', emailError);
        }
        

        createSendToken(newUser, 201, res);
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.Adminregistration = async (req, res) => {
    try {
        const { name, email, role, password, householdMembers, address, city } = req.body;

        const newUser = await User.create({
            name, email, role, password, householdMembers, address, city,
        });

        
        try {
            // Admin විසින් user කෙනෙක්ව නිර්මාණය කළ පසු, තාවකාලික මුරපදය සමඟ ඊමේල් එක යැවීම
            // මෙහිදී, req.body වෙතින් ලැබෙන hash නොකළ password එක යවනු ලැබේ
            await sendAccountCreationEmail(newUser.email, newUser.name, password);
        } catch (emailError) {
            // ඊමේල් යැවීම අසාර්ථක වුවහොත්, server එකේ console එකේ log කිරීම
            // නමුත් user ගේ registration එක සාර්ථක ලෙස ඉදිරියට ගෙනයාම
            console.error('There was an error sending the account creation email:', emailError);
        }
        
        // මෙම function එක මගින් Admin ට, අලුතින් සෑදූ user ගේ token එකක් සහිතව
        // සාර්ථක ප්‍රතිචාරයක් යවයි.
        createSendToken(newUser, 201, res);
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'fail', message: 'Please provide email and password!' });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({ status: 'fail', message: 'Incorrect email or password' });
        }

       
        // පරිශීලකයාගේ status එක 'active' දැයි පරීක්ෂා කිරීම
        if (user.status !== 'active') {
            return res.status(401).json({ 
                status: 'fail', 
                message: 'Your account is inactive. Please contact an administrator.' 
            });
        }
        

        // සියලුම පරීක්ෂා කිරීම් සාර්ථක නම්, token එක යැවීම
        createSendToken(user, 200, res);

    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Something went wrong!' });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const filteredBody = { ...req.body };
        // remove fields that are not allowed to be updated
        const disallowedFields = ['password', 'role', 'status'];
        disallowedFields.forEach(el => delete filteredBody[el]);

        // Add photo to update if uploaded
        if (req.file) {
            // Delete old photo if exists
            const currentUser = await User.findById(req.user.id);
            if (currentUser.photo && currentUser.photo !== 'default.jpg') {
                const oldPhotoPath = path.join(__dirname, '..', 'uploads', 'users', currentUser.photo);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }
            filteredBody.photo = req.file.filename;
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ status: 'success', data: { user: updatedUser } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        // 1. get user from db with password
        const user = await User.findById(req.user.id).select('+password');

        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        // 2. check if posted current password is correct
        if (!currentPassword || !(await user.correctPassword(currentPassword, user.password))) {
            return res.status(401).json({ status: 'fail', message: 'Your current password is wrong.' });
        }

        // 3. check if new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ status: 'fail', message: 'New password and confirm password do not match.' });
        }

        // 4. update user password and save
        user.password = newPassword;
        await user.save();

        // 5. send new token to user for re-login
        createSendToken(user, 200, res);
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'An error occurred while changing the password.' });
    }
};

exports.deleteMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found.' });
        }

        // Delete user's profile photo if exists
        if (user.photo && user.photo !== 'default.jpg') {
            const photoPath = path.join(__dirname, '..', 'uploads', 'users', user.photo);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        // Delete the user account
        await User.findByIdAndDelete(req.user.id);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'An error occurred while deleting the account.' });
    }
};

// This function gets the current user's data if they provide a valid token
exports.getMe = async (req, res) => {
    // The user data is attached to req.user by the 'protect' middleware
    const user = await User.findById(req.user.id);

    res.status(200).json({
        status: 'success',
        data: { user },
    });
};

// --- Admin Functions ---

// 1. Get all users (for Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}); // Get all users from the database
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Could not fetch users.' });
    }
};

// 2. Update any user by ID (for Admin)
exports.updateUserByAdmin = async (req, res) => {
    try {
        // Admin ට password එක වෙනස් කිරීමට ඉඩ නොදීම වඩාත් සුදුසුය.
        const filteredBody = { ...req.body };
        delete filteredBody.password;

        const updatedUser = await User.findByIdAndUpdate(req.params.id, filteredBody, {
            new: true,
            runValidators: true
        });

        if (!updatedUser) {
            return res.status(404).json({ status: 'fail', message: 'No user found with that ID.' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser
            }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// 3. Delete any user by ID (for Admin)
exports.deleteUserByAdmin = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'No user found with that ID.' });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Error deleting user.' });
    }
};
// 1. Forgot Password - Generates and sends OTP
exports.forgotPassword = async (req, res) => {
    try {
        // 1. Get user based on POSTed email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'There is no user with that email address.' });
        }

        // 2. Generate a random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Hash the OTP and save it to the user document
        user.passwordResetOTP = crypto.createHash('sha256').update(otp).digest('hex');
        
        // 4. Set an expiration time (10 minutes from now)
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; 
        await user.save({ validateBeforeSave: false });

        // 5. Send the PLAIN OTP to the user's email
        await sendPasswordResetEmail(user.email, otp);

        res.status(200).json({
            status: 'success',
            message: 'OTP sent to your email address!'
        });

    } catch (err) {
        // Clear OTP fields on error
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            user.passwordResetOTP = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
        }
        console.error('FORGOT PASSWORD ERROR: ', err);
        res.status(500).json({ status: 'error', message: 'There was an error sending the email. Please try again later.' });
    }
};

// 2. Reset Password - Verifies OTP and sets new password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, password, confirmPassword } = req.body;

        // 1. Hash the incoming OTP
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        // 2. Find the user by email, hashed OTP, and check expiration
        const user = await User.findOne({
            email,
            passwordResetOTP: hashedOTP,
            passwordResetExpires: { $gt: Date.now() } // Check if the token is not expired
        });

        // 3. If user not found or OTP is invalid/expired
        if (!user) {
            return res.status(400).json({ status: 'fail', message: 'OTP is invalid or has expired. Please try again.' });
        }

        // 4. Check if new password and confirm password match
        if (password !== confirmPassword) {
            return res.status(400).json({ status: 'fail', message: 'New password and confirm password do not match.' });
        }

        // 5. Set the new password, clear the OTP fields, and save the user
        user.password = password;
        user.passwordResetOTP = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // 6. Log the user in by sending a new JWT
        createSendToken(user, 200, res);

    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Something went wrong.' });
    }
};