const express = require('express');
const router = express.Router();
const { requireAuth } = require('../helpers/auth');
const { requireMasterKey } = require('../middleware/authMiddleware');
const shareController = require('../controllers/shareController');

// Initiate a share (step 1)
router.post('/initiate/:itemId', requireAuth, requireMasterKey, shareController.initiateShare);

// Provide share data (step 2)
router.post('/provide-data/:shareId', requireAuth, requireMasterKey, shareController.provideShareData);

// Accept a share
router.post('/:shareId/accept', requireAuth, requireMasterKey, shareController.acceptShare);

// Get pending shares for the user
router.get('/pending', requireAuth, shareController.getPendingShares);

// Get accepted shares for the user
router.get('/accepted', requireAuth, shareController.getAcceptedShares);

// Get sent shares for the user
router.get('/sent', requireAuth, shareController.getSentShares);

module.exports = router;