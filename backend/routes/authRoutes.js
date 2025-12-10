const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    updatePassword,
} = require('../controllers/authController');
const {
    protect,
    validateRegister,
    validateLogin,
    authLimiter,
} = require('../middleware');

// Public routes
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);

// Private routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;
