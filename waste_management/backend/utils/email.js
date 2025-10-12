const nodemailer = require('nodemailer');

const sendEmail = async options => {
    // 1. Create a transporter (the service that will send the email, e.g., Gmail)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USERNAME || "assigmentgroupy@gmail.com",
            pass: process.env.EMAIL_PASSWORD || "iehlzcwppdmyanld",
        },
    });

    // 2. Define the email options
    const mailOptions = {
        from: '"Eco Pulse" <assigmentgroupy@gmail.com>',
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    // 3. Actually send the email
    await transporter.sendMail(mailOptions);
};

// Welcome email සඳහා වෙන්වූ function එකක්
exports.sendWelcomeEmail = async (userEmail, userName) => {
    const subject = 'Welcome to the Eco Pulse Family! 🌿';
    
    // HTML email template එක
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2E7D32;">Welcome, ${userName}!</h2>
            <p>Thank you for joining Eco Pulse, your personal guide to a more sustainable lifestyle.</p>
            <p>We are thrilled to have you on board. Here's what you can do to get started:</p>
            <ul>
                <li>Track your carbon footprint.</li>
                <li>Participate in fun and impactful challenges.</li>
                <li>Connect with a community that cares about our planet.</li>
            </ul>
            <p>Let's make a positive impact together!</p>
            <br>
            <p>Best regards,</p>
            <p><strong>The Eco Pulse Team</strong></p>
        </div>
    `;

    

    await sendEmail({
        email: userEmail,
        subject,
        html
    });

    
};

exports.sendAccountCreationEmail = async (userEmail, userName, temporaryPassword) => {
    const subject = 'Your Eco Pulse Account has been Created!';
    
    // HTML email template එක
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2E7D32;">Hello, ${userName}!</h2>
            <p>An administrator has created an account for you on the Eco Pulse platform.</p>
            <p>You can now log in using the following credentials:</p>
            <ul style="list-style-type: none; padding: 0;">
                <li style="margin-bottom: 10px;"><strong>Email:</strong> ${userEmail}</li>
                <li style="margin-bottom: 10px;"><strong>Temporary Password:</strong> <span style="font-weight: bold; color: #D9534F; font-size: 1.1em;">${temporaryPassword}</span></li>
            </ul>
            <p>For your security, we strongly recommend that you log in and <strong>change your password</strong> from your profile settings as soon as possible.</p>
            <br>
            <p>Welcome aboard!</p>
            <p><strong>The Eco Pulse Team</strong></p>
        </div>
    `;

    // sendEmail function එක call කර, ඉහත දත්ත සමඟ ඊමේල් එක යැවීම
    await sendEmail({
        email: userEmail,
        subject,
        html
    });
};

exports.sendPasswordResetEmail = async (userEmail, otp) => {
    const subject = 'Your Password Reset Code (Valid for 10 minutes)';
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #FF9800;">Password Reset Request</h2>
            <p>You requested a password reset. Use the following One-Time Password (OTP) to reset your password:</p>
            <p style="font-size: 24px; font-weight: bold; color: #333; letter-spacing: 2px; margin: 20px 0; text-align: center;">${otp}</p>
            <p>This code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
            <br>
            <p>Best regards,</p>
            <p><strong>The Eco Pulse Team</strong></p>
        </div>
    `;

    await sendEmail({
        email: userEmail,
        subject,
        html
    });
};