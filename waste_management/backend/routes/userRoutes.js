const express = require('express');
const router = express.Router();
const { authUser, registerUser } = require('../controllers/userController');

// http://localhost:5002/api/users
router.post('/', registerUser); 
// http://localhost:5002/api/users/login
router.post('/login', authUser);

module.exports = router;