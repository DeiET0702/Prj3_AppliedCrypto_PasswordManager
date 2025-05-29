const express = require('express');
const router = express.Router();
const cors = require('cors');
const { createItem, updateItem, deleteItem, getAllItems } = require('../controllers/itemController');
const { requireAuth } = require('../helpers/auth');
const { requireMasterKey } = require('../middleware/authMiddleware');

router.use(
    cors({
        credentials: true,
        origin: 'http://localhost:5173'
    })
);

// CUD items
router.post('/create', requireAuth, createItem); // done
router.put('/:itemId', requireAuth, requireMasterKey, updateItem);
router.delete('/:itemId', requireAuth, requireMasterKey, deleteItem); // done
router.get('/allItems', requireAuth, getAllItems); // test

module.exports = router;