const express = require('express');
const router = express.Router();
const {
    test,
    registerUser,
    loginUser,
    activateMasterKey, 
    getProfile,
<<<<<<< HEAD
    logoutUser
} = require('../controllers/authController');
=======
    logoutUser,
    getAllUsers
} = require('../controllers/authController');
const { requireAuth } = require('../helpers/auth');
>>>>>>> test_cud


router.get('/', test);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/activate-master-key', activateMasterKey); 
router.get('/profile', getProfile);
router.post('/logout', logoutUser);
<<<<<<< HEAD
=======
router.get('/allUsers', requireAuth, getAllUsers);
>>>>>>> test_cud


module.exports = router;