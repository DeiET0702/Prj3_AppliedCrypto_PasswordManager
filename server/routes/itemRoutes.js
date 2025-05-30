<<<<<<< HEAD
// In your item routes file (e.g., routes/itemRoutes.js)
const express = require('express');
const router = express.Router();
const { requireMasterKey } = require('../middleware/authMiddleware'); 
const item = require('../models/item');

// POST /api/item/create - Create a new item
router.post('/create', requireMasterKey, async (req, res) => {
    // req.masterKey is available here (as a Buffer) thanks to the requireMasterKey middleware
    const masterKey = req.masterKey;
    const { domain, username, password } = req.body;

    if (!domain || !username || !password) {
        return res.status(400).json({ message: 'Domain, username, and password are required for the item.' });
    }

    try {
        // 1. Generate a random siteKey (128 bit / 16 bytes) for this item
        const siteKey = crypto.randomBytes(16);

        // 2. Encrypt item data {domain, username, password} with AES-256-GCM using siteKey
        const dataToEncrypt = JSON.stringify({ domain, username, password });
        const iv = crypto.randomBytes(12); // AES-GCM recommended IV size is 12 bytes (96 bits)
        const cipher = crypto.createCipheriv('aes-256-gcm', siteKey, iv);
        let ciphertext = cipher.update(dataToEncrypt, 'utf8', 'hex');
        ciphertext += cipher.final('hex');
        const authTag = cipher.getAuthTag(); // Crucial for GCM integrity

        // 3. Encrypt the siteKey with AES-256-GCM using the user's masterKey
        const key_iv = crypto.randomBytes(12); // IV for encrypting the siteKey
        const siteKeyCipher = crypto.createCipheriv('aes-256-gcm', masterKey, key_iv);
        // Encrypt the siteKey (original is a Buffer, convert to hex string for encryption input if needed, or encrypt buffer directly)
        let encrypted_siteKey = siteKeyCipher.update(siteKey); // Pass Buffer directly
        encrypted_siteKey = Buffer.concat([encrypted_siteKey, siteKeyCipher.final()]); // Concatenate parts
        const siteKeyAuthTag = siteKeyCipher.getAuthTag(); // AuthTag for the encrypted siteKey

        // 4. Save the item to the database
        const newItem = new Item({
            owner_id: req.session.userId, // userId stored in session during login
            ciphertext: Buffer.from(ciphertext, 'hex'),
            iv: iv,
            authTag: authTag, // Store the authTag for data
            key_iv: key_iv,
            encrypted_siteKey: encrypted_siteKey, // Store as Buffer
            encrypted_siteKeyAuthTag: siteKeyAuthTag, // Store the authTag for siteKey
            // created_at and updated_at will be handled by Mongoose defaults/middleware if set up
        });

        await newItem.save();

        console.log('Item created successfully. SiteKey encrypted with MasterKey from session.');
        res.status(201).json({
            message: 'Item created successfully.',
            itemId: newItem._id
        });

    } catch (error) {
        console.error('Item creation error:', error);
        // Check for specific crypto errors, e.g., if masterKey was somehow invalid for GCM
        if (error.code === 'ERR_CRYPTO_INVALID_KEYLEN' || error.code === 'ERR_CRYPTO_INVALID_IVLEN') {
             return res.status(500).json({ message: 'Internal encryption configuration error.' });
        }
        if (error.message.includes('Unsupported state or unable to authenticate data')) { // GCM auth error
            return res.status(500).json({ message: 'Encryption integrity check failed. Master Key might be incorrect or data corrupted.' });
        }
        return res.status(500).json({ message: 'Internal server error during item creation.' });
    }
});

// GET /api/item - List all items for the logged-in user
router.get('/', requireMasterKey, async (req, res) => {
    const masterKey = req.masterKey; // Available from middleware
    const userId = req.session.userId;

    try {
        const itemsFromDb = await Item.find({ owner_id: userId });
        const decryptedItems = [];

        for (const item of itemsFromDb) {
            try {
                // 1. Decrypt siteKey using masterKey
                const siteKeyDecipher = crypto.createDecipheriv('aes-256-gcm', masterKey, item.key_iv);
                siteKeyDecipher.setAuthTag(item.encrypted_siteKeyAuthTag);
                let decryptedSiteKeyHex = siteKeyDecipher.update(item.encrypted_siteKey, 'binary', 'hex'); // Assuming encrypted_siteKey is Buffer
                decryptedSiteKeyHex += siteKeyDecipher.final('hex');
                const siteKey = Buffer.from(decryptedSiteKeyHex, 'hex');

                // 2. Decrypt item data using siteKey
                const dataDecipher = crypto.createDecipheriv('aes-256-gcm', siteKey, item.iv);
                dataDecipher.setAuthTag(item.authTag);
                let decryptedDataJson = dataDecipher.update(item.ciphertext, 'binary', 'utf8'); // Assuming ciphertext is Buffer
                decryptedDataJson += dataDecipher.final('utf8');
                const itemData = JSON.parse(decryptedDataJson);

                decryptedItems.push({
                    itemId: item._id,
                    domain: itemData.domain,
                    username: itemData.username,
                    // DO NOT send password directly unless explicitly requested for "view password" action
                    // For a list, typically you don't show the password itself.
                    // password: itemData.password, // Only if "view" action decrypts for display
                    created_at: item.created_at,
                    updated_at: item.updated_at
                });
            } catch (decryptionError) {
                console.error(`Failed to decrypt item ${item._id}:`, decryptionError);
                decryptedItems.push({
                    itemId: item._id,
                    domain: '[Could not decrypt]',
                    username: '[Could not decrypt]',
                    error: 'Decryption failed for this item. Master Key might have changed or data is corrupt.'
                });
            }
        }
        res.json(decryptedItems);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ message: 'Failed to retrieve items.' });
    }
});

router.get('/item', requireMasterKey, (req, res) => { /* ... to list items, decrypting needs req.masterKey ... */ });
router.put('/item/:itemID', requireMasterKey, (req, res) => { /* ... edit item ... */ });
router.delete('/item/:itemID', requireMasterKey, (req, res) => { /* ... delete item ... */ });

// For sharing, Alice needs her masterKey to decrypt her siteKey
router.post('/item/share/:itemID', requireMasterKey, (req, res) => { /* ...  initiates share ... */ });

// When Receiver (e.g., Bob) accepts, he'll provide his masterPassword, derive his masterKey, and then use it. 
router.post('/item/share/accept/:shareId', requireMasterKey, (req, res) => { /* Bob accepts, uses his req.masterKey */});
=======
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
router.put('/:itemId', requireAuth,  updateItem);
router.delete('/:itemId', requireAuth,  deleteItem); // done
router.get('/allItems', requireAuth, getAllItems); // test
>>>>>>> test_cud

module.exports = router;