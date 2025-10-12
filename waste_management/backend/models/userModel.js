const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['User', 'Admin', 'Environmentalist'],
        default: 'User',
    },
    householdMembers: {
        type: Number,
        
        default: 1,
    },
    address: {
        type: String,
        required: [true, 'Please provide your address'],
    },
    city: {
        type: String,
        required: [true, 'Please provide your city'],
    },
    passwordResetOTP: String,
    passwordResetExpires: Date,
    photo: {
        type: String,
        default: 'default.jpg',
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expertise: {
    type: String,
    enum: [
        'Wildlife Conservation',
        'Marine Biology', 
        'Forest Management',
        'Climate Change',
        'Renewable Energy',
        'Waste Management',
        'Water Conservation',
        'Air Quality Monitoring',
        'Ecosystem Restoration',
        'Environmental Policy',
        'Sustainable Agriculture',
        'Biodiversity Research',
        'Environmental Education',
        'Carbon Footprint Analysis',
        'Green Technology'
    ]
},
bio: {
    type: String,
    maxlength: 500,
},
yearsOfExperience: {
    type: Number,
    min: 0,
    max: 50,
},
organization: {
    type: String,
    maxlength: 100,
}
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Method to check correct password
userSchema.methods.correctPassword = async function(
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
module.exports = User;