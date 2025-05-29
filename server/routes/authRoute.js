const express = require('express');
const router = express.Router();

const {
    test,
    registerUser,
    loginUser,
    getProfile,
    logoutUser
} = require('../controllers/authController');

router.get('/', test); // Basic test route
router.post('/register', registerUser); // Uses registerUser from authController
router.post('/login', loginUser);     // Uses loginUser from authController
router.get('/profile', getProfile);   // Uses getProfile from authController (presumably JWT authenticated)
router.post('/logout', logoutUser);   // Uses logoutUser from authController

module.exports = router;