const crypto = require('crypto');
const Item = require('../models/item');
const User = require('../models/user');
const {
  encryptAESGCM,
  deriveMasterKey,
  decryptAESGCM
} = require('../helpers/crypto');

const createItem = async (req, res) => {
  try {
    const { domain, username, password, masterPassword } = req.body;
    const owner_id = req.user._id || req.user.id;

    if (!domain || !username || !password) {
      return res.status(400).json({ error: 'All fields are required!' });
    }

    const user = await User.findById(owner_id);
    if (!user || !user.master_salt) {
      return res.status(400).json({ error: 'User or master salt not found' });
    }

    const master_salt = Buffer.from(user.master_salt, 'base64');

    let masterKey;
    if (req.session.masterKey) {
      masterKey = Buffer.from(req.session.masterKey, 'base64');
    } else {
      masterKey = deriveMasterKey(masterPassword, master_salt);
      req.session.masterKey = masterKey.toString('base64');
    }

    const siteKey = crypto.randomBytes(32);
    const itemData = JSON.stringify({ domain, username, password });

    // Encrypt item data with siteKey
    const { ciphertext, iv, authTag } = encryptAESGCM(itemData, siteKey);

    // Encrypt siteKey with masterKey
    const {
      ciphertext: encrypted_siteKey,
      iv: key_iv,
      authTag: encrypted_siteKeyAuthTag
    } = encryptAESGCM(siteKey.toString('base64'), masterKey);

    const newItem = new Item({
      owner_id,
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      encrypted_siteKey: encrypted_siteKey.toString('base64'),
      key_iv: key_iv.toString('base64'),
      encrypted_siteKeyAuthTag: encrypted_siteKeyAuthTag.toString('base64')
    });

    await newItem.save();
    res.status(201).json({ message: 'Item created successfully', itemId: newItem._id });

  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update an existing item
const updateItem = async (req, res) => {
  try {
    const { domain, username, password } = req.body;
    const { itemId } = req.params;
    const owner_id = req.user._id || req.user.id;

    if (!domain || !username || !password) {
      return res.status(400).json({ error: 'All fields are required!' });
    }

    const item = await Item.findOne({ _id: itemId, owner_id });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const masterKey = Buffer.from(req.session.masterKey, 'base64');

    // Decrypt siteKey (all inputs are base64 string in DB, convert to Buffer before decrypt)
    const encrypted_siteKey = Buffer.from(item.encrypted_siteKey, 'base64');
    const key_iv = Buffer.from(item.key_iv, 'base64');
    const encrypted_siteKeyAuthTag = Buffer.from(item.encrypted_siteKeyAuthTag, 'base64');

    const siteKey_b64 = decryptAESGCM(encrypted_siteKey, key_iv, encrypted_siteKeyAuthTag, masterKey);
    if (!siteKey_b64) {
      return res.status(400).json({ error: 'Failed to decrypt site key. Invalid session or data.' });
    }

    const siteKey = Buffer.from(siteKey_b64, 'base64');
    if (siteKey.length !== 32) {
      return res.status(400).json({ error: 'Decrypted site key is invalid length.' });
    }

    // Encrypt updated item data with siteKey
    const jsonData = JSON.stringify({ domain, username, password });
    const { ciphertext, iv, authTag } = encryptAESGCM(jsonData, siteKey);

    // Save encrypted data as base64 strings
    item.ciphertext = ciphertext.toString('base64');
    item.iv = iv.toString('base64');
    item.authTag = authTag.toString('base64');

    await item.save();

    res.status(200).json({ message: 'Item updated successfully' });

  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Delete an item securely -> verify ownership and remove the document
const deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    console.log("item res: ", req.user);
    const owner_id = req.user._id || req.user.id;
    console.log("owner id: ", owner_id);

    // makes sure only the item's owner can delete it
    const deleted = await Item.findOneAndDelete({ _id: itemId, owner_id });
    if (!deleted) return res.status(404).json({ error: 'Item not found or unauthorized' });

    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// test
const getAllItems = async(req, res) => {
  try{
      const items = await Item.find({ owner_id: req.user._id });
      res.json(items);
  }catch(error){
    console.error('Error:', error);
    return res.status(500).json({error: "Internal Server Error"});
  }
}
module.exports = {
  createItem,
  updateItem,
  deleteItem,
  getAllItems
};
