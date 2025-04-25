const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');
const loginController = require('../controllers/loginController');

// Authentication routes
router.post('/register', registerController.registerUser);
router.post('/login', loginController.loginUser);

module.exports = router;