const express = require('express');
const router = express.Router();
const {
    test,
    registerUser,
    loginUser,
    activateMasterKey, 
    getProfile,
    logoutUser,
    getAllUsers
} = require('../controllers/authController');
const { requireAuth } = require('../helpers/auth');


router.get('/', test);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/activate-master-key', activateMasterKey); 
router.get('/profile', requireAuth, getProfile);
router.post('/logout', logoutUser);
router.get('/allUsers', requireAuth, getAllUsers);


module.exports = router;