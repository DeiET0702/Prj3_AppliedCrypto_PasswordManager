const express = require('express');
const router = express.Router();
const {
    test,
    registerUser,
    loginUser,
    activateMasterKey, 
    getProfile,
    logoutUser
} = require('../controllers/authController');


router.get('/', test);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/activate-master-key', activateMasterKey); 
router.get('/profile', getProfile);
router.post('/logout', logoutUser);


module.exports = router;