// controllers/itemController.js
const crypto = require('crypto');
const Item = require('../models/item');
const User = require('../models/user');
const { encryptAESGCM, deriveMasterKey, decryptAESGCM } = require('../helpers/crypto');

const getAllItems = async (req, res) => {
  try {
    const owner_id = req.user._id || req.user.id;
    const masterKey = Buffer.from(req.session.masterKey, 'base64');

    const items = await Item.find({ owner_id });
    if (!items.length) return res.json([]);

    const decryptedItems = [];
    for (const item of items) {
      try {
        // Decrypt siteKey first
        const siteKey_b64 = decryptAESGCM({
          ciphertext: item.encrypted_siteKey,
          iv: item.key_iv,
          authTag: item.encrypted_siteKeyAuthTag,
          key: masterKey
        });

        if (!siteKey_b64) continue;

        const siteKey = Buffer.from(siteKey_b64, 'base64');
        
        // Decrypt item data
        const decryptedData = decryptAESGCM({
          ciphertext: item.ciphertext,
          iv: item.iv,
          authTag: item.authTag,
          key: siteKey
        });

        if (!decryptedData) continue;

        const { domain, username, password } = JSON.parse(decryptedData);
        decryptedItems.push({
          _id: item._id,
          domain,
          username,
          password,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        });
      } catch (e) {
        console.error(`Error processing item ${item._id}:`, e.message);
        continue;
      }
    }

    res.json(decryptedItems);
  } catch (error) {
    console.error('GetAllItems error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createItem = async (req, res) => {
  try {
    const { domain, username, password } = req.body;
    const owner_id = req.user._id || req.user.id;
    const masterKey = Buffer.from(req.session.masterKey, 'base64');

    const siteKey = crypto.randomBytes(32);
    const itemData = JSON.stringify({ domain, username, password });

    // Encrypt item data
    const encryptedData = encryptAESGCM(itemData, siteKey);
    
    // Encrypt siteKey
    const encryptedKey = encryptAESGCM(siteKey.toString('base64'), masterKey);

    const newItem = new Item({
      owner_id,
      ciphertext: encryptedData.ciphertext.toString('base64'),
      iv: encryptedData.iv.toString('base64'),
      authTag: encryptedData.authTag.toString('hex'),
      encrypted_siteKey: encryptedKey.ciphertext.toString('base64'),
      key_iv: encryptedKey.iv.toString('base64'),
      encrypted_siteKeyAuthTag: encryptedKey.authTag.toString('hex')
    });

    await newItem.save();
    res.status(201).json({ message: 'Item created', itemId: newItem._id });
  } catch (err) {
    console.error('CreateItem error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateItem = async (req, res) => {
  try {
    const { domain, username, password } = req.body;
    const { itemId } = req.params;
    const owner_id = req.user._id || req.user.id;

    if (!domain || !username || !password) {
      console.error('Missing required fields:', { domain, username, password });
      return res.status(400).json({ error: 'All fields are required!' });
    }

    const item = await Item.findOne({ _id: itemId, owner_id });
    if (!item) {
      console.error('Item not found:', itemId);
      return res.status(404).json({ error: 'Item not found' });
    }

    if (!req.session.masterKey) {
      console.error('No masterKey in session for update');
      return res.status(401).json({ error: 'Master key not activated' });
    }

    const masterKey = Buffer.from(req.session.masterKey, 'base64');
    console.log('MasterKey length for update:', masterKey.length);

    // Validate inputs
    if (!item.encrypted_siteKey || !item.key_iv || !item.encrypted_siteKeyAuthTag) {
      console.error('Invalid item data for decryption:', {
        encrypted_siteKey: item.encrypted_siteKey,
        key_iv: item.key_iv,
        encrypted_siteKeyAuthTag: item.encrypted_siteKeyAuthTag
      });
      return res.status(400).json({ error: 'Invalid item data for decryption' });
    }

    // Decrypt siteKey (authTag stored as hex)
    const siteKey_b64 = decryptAESGCM({
      ciphertext: item.encrypted_siteKey,
      iv: item.key_iv,
      authTag: item.encrypted_siteKeyAuthTag, // Already hex
      key: masterKey.toString('base64') // Pass as base64 string
    });

    if (!siteKey_b64) {
      console.error('Failed to decrypt siteKey for item:', itemId);
      return res.status(400).json({ error: 'Failed to decrypt site key' });
    }

    const siteKey = Buffer.from(siteKey_b64, 'base64');
    if (siteKey.length !== 32) {
      console.error('Invalid siteKey length:', siteKey.length);
      return res.status(400).json({ error: 'Invalid site key length' });
    }

    // Encrypt new data
    const jsonData = JSON.stringify({ domain, username, password });
    const { ciphertext, iv, authTag } = encryptAESGCM(jsonData, siteKey);

    // Update item
    item.ciphertext = ciphertext.toString('base64');
    item.iv = iv.toString('base64');
    item.authTag = authTag.toString('hex');
    item.updatedAt = new Date();

    await item.save();
    console.log('Item updated successfully:', itemId);
    res.status(200).json({ message: 'Item updated successfully' });
  } catch (err) {
    console.error('Update item error:', err.message, err.stack.split('\n').slice(0, 3).join('\n'));
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const owner_id = req.user._id || req.user.id;

    console.log('Attempting to delete item:', itemId, 'for user:', owner_id);

    const deleted = await Item.findOneAndDelete({ _id: itemId, owner_id });
    if (!deleted) {
      console.error('Item not found or unauthorized:', itemId);
      return res.status(404).json({ error: 'Item not found or unauthorized' });
    }

    console.log('Item deleted successfully:', itemId);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Delete item error:', err.message, err.stack.split('\n').slice(0, 3).join('\n'));
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createItem,
  updateItem,
  deleteItem,
  getAllItems
};