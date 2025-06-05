const Item = require('../models/item');
const User = require('../models/user');
const SharedItem = require('../models/shared_item');
const { decryptAESGCM, encryptAESGCM, deriveMasterKey } = require('../helpers/crypto');

// Step 1: Initiate share (create a pending share record)
exports.initiateShare = async (req, res) => {
    try {
        const { receiverUsername } = req.body;
        const { itemId } = req.params;
        const sender = req.user.username;
        const masterKey = req.masterKey;

        // Find and decrypt the item
        const item = await Item.findOne({ _id: itemId, owner_id: req.user.id });
        if (!item) return res.status(404).json({ error: 'Item not found' });

        // Find receiver
        const receiver = await User.findOne({ username: receiverUsername });
        if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

        // Set expiration_at to 24 hours from now
        const expirationAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Create a pending share record (no encrypted data yet)
        const sharedItem = new SharedItem({
            item_id: item._id,
            sender_username: sender,
            receiver_username: receiverUsername,
            status: 'pending',
            expiration_at: expirationAt,
            domain: item.domain, // Store domain for reference
        });
        await sharedItem.save();

        res.status(201).json({ shareId: sharedItem._id, message: 'Share initiated.' });
    } catch (err) {
        console.error('Share error:', err);
        res.status(500).json({ error: 'Failed to initiate share.' });
    }
};

// Step 2: Provide share data (encrypt for receiver)
exports.provideShareData = async (req, res) => {
    try {
        const { shareId } = req.params;
        const masterKey = req.masterKey;

        const sharedItem = await SharedItem.findById(shareId);
        if (!sharedItem) return res.status(404).json({ error: 'Share not found' });

        // Get item and receiver
        const item = await Item.findById(sharedItem.item_id);
        const receiver = await User.findOne({ username: sharedItem.receiver_username });
        if (!item || !receiver) return res.status(404).json({ error: 'Item or receiver not found' });

        // Decrypt siteKey with sender's masterKey
        const siteKey_b64 = decryptAESGCM({
            ciphertext: item.encrypted_siteKey,
            iv: item.key_iv,
            authTag: item.encrypted_siteKeyAuthTag,
            key: masterKey
        });
        if (!siteKey_b64) return res.status(400).json({ error: 'Failed to decrypt site key' });
        const siteKey = Buffer.from(siteKey_b64, 'base64');

        // Encrypt siteKey for receiver using their master key (with placeholder, to be re-encrypted on accept)
        const wrappedKey = encryptAESGCM(siteKey.toString('base64'), deriveMasterKey('PLACEHOLDER', receiver.master_salt));

        // Save encrypted data to sharedItem
        sharedItem.ciphertext = item.ciphertext;
        sharedItem.item_iv = item.iv;
        sharedItem.item_auth_tag = item.authTag;
        sharedItem.wrapped_key = wrappedKey.ciphertext;
        sharedItem.wrapped_key_iv = wrappedKey.iv;
        sharedItem.wrapped_key_auth_tag = wrappedKey.authTag;
        sharedItem.status = 'pending';
        await sharedItem.save();

        res.status(200).json({ shareId: sharedItem._id, message: 'Share data provided.' });
    } catch (err) {
        console.error('ProvideShareData error:', err);
        res.status(500).json({ error: 'Failed to provide share data.' });
    }
};

// Accept a share (Bob)
exports.acceptShare = async (req, res) => {
    try {
        const { shareId } = req.params;
        const masterKey = req.masterKey;
        const sharedItem = await SharedItem.findById(shareId);
        if (!sharedItem) return res.status(404).json({ error: 'Shared item not found' });
        if (sharedItem.status === 'accepted') return res.status(400).json({ error: 'Already accepted' });

        // Decrypt wrappedKey with Bob's masterKey
        const siteKey_b64 = decryptAESGCM({
            ciphertext: sharedItem.wrapped_key,
            iv: sharedItem.wrapped_key_iv,
            authTag: sharedItem.wrapped_key_auth_tag,
            key: masterKey
        });
        if (!siteKey_b64) return res.status(400).json({ error: 'Failed to decrypt wrapped key' });
        const siteKey = Buffer.from(siteKey_b64, 'base64');

        // Save item to Bob's vault
        const newItem = new Item({
            owner_id: req.user.id,
            domain: sharedItem.domain, // You may need to store domain in SharedItem or fetch from original item
            username: sharedItem.receiver_username,
            password: '', // You may want to handle password as well
            encrypted_siteKey: sharedItem.wrapped_key,
            key_iv: sharedItem.wrapped_key_iv,
            encrypted_siteKeyAuthTag: sharedItem.wrapped_key_auth_tag,
            ciphertext: sharedItem.ciphertext,
            iv: sharedItem.item_iv,
            authTag: sharedItem.item_auth_tag
        });
        await newItem.save();

        sharedItem.status = 'accepted';
        await sharedItem.save();

        res.status(200).json({ message: 'Share accepted' });
    } catch (err) {
        console.error('AcceptShare error:', err);
        res.status(500).json({ error: 'Failed to accept share' });
    }
};

// Helper to map shared items for frontend
function mapSharedItem(doc) {
    return {
        shareId: doc._id,
        itemDomain: doc.domain || 'Unknown',
        receiverUsername: doc.receiver_username,
        senderUsername: doc.sender_username,
        status: doc.status,
        sharedAt: doc.createdAt || doc.shared_at,
        expiresAt: doc.expiration_at,
        acceptedAt: doc.accepted_at,
    };
}

// Get pending shares for the user
exports.getPendingShares = async (req, res) => {
    try {
        const shares = await SharedItem.find({ receiver_username: req.user.username, status: 'pending' });
        res.status(200).json(shares.map(mapSharedItem));
    } catch (err) {
        res.status(500).json({ error: 'Failed to get pending shares' });
    }
};

// Get accepted shares for the user
exports.getAcceptedShares = async (req, res) => {
    try {
        const shares = await SharedItem.find({ receiver_username: req.user.username, status: 'accepted' });
        res.status(200).json(shares.map(mapSharedItem));
    } catch (err) {
        res.status(500).json({ error: 'Failed to get accepted shares' });
    }
};

// Get sent shares for the user
exports.getSentShares = async (req, res) => {
    try {
        const shares = await SharedItem.find({ sender_username: req.user.username });
        res.status(200).json(shares.map(mapSharedItem));
    } catch (err) {
        res.status(500).json({ error: 'Failed to get sent shares' });
    }
};