const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware'); 
const path = require('path');

const router = express.Router();

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/admin-register', userController.Adminregistration);
router.post('/forgotPassword', userController.forgotPassword);
router.patch('/resetPassword', userController.resetPassword);

// This is a protected route. User must have a valid token to access it.
router.get('/me', authMiddleware.protect, userController.getMe);
router.patch('/updateMe', 
    authMiddleware.protect,
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
);
router.patch('/updatePassword', authMiddleware.protect, userController.updatePassword);
router.delete('/deleteMe', authMiddleware.protect, userController.deleteMe);



// Serve uploaded images
router.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

router.get('/admin/users', authMiddleware.protect, userController.getAllUsers);
router.delete('/admin/users/:id', authMiddleware.protect, userController.deleteUserByAdmin);
router.patch('/admin/users/:id', authMiddleware.protect, userController.updateUserByAdmin);

module.exports = router;