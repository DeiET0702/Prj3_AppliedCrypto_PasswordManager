const crypto = require('crypto');
const Item = require('../models/item');
const User = require('../models/user');
const {
  encryptAESGCM,
  deriveMasterKey,
  decryptAESGCM
} = require('../helpers/crypto');

// take user's password, encrypt it, wrap  the encryption key with a master key, and store all in mongoDB
const createItem = async (req, res) => {
  try {
    // masterPassword is needed if no cached masterKey exists
    const { domain, username, password, masterPassword } = req.body;
    const owner_id = req.user._id;

    if (!domain || !username || !password) {
      return res.status(400).json({ error: 'All fields are required!' });
    }

    // fetch user's PBKDF2 salt from the DB and decode it
    const user = await User.findById(owner_id);
    if (!user || !user.master_salt) {
      return res.status(400).json({ error: 'User or master salt not found' });
    }

    const master_salt = Buffer.from(user.master_salt, 'base64');
    
    // use session-cached master key if available, otherwise, derive masterKey and save it in the session
    let masterKey;

    if (req.session.masterKey) {
      masterKey = Buffer.from(req.session.masterKey, 'base64');
    } else {
      if (!masterPassword) {
        return res.status(400).json({ error: 'Master password is required' });
      }
      masterKey = deriveMasterKey(masterPassword, master_salt);
      req.session.masterKey = masterKey.toString('base64');
    }

    // generate a random 256-bit key just for this password item
    const siteKey = crypto.randomBytes(32);
    const itemData = JSON.stringify({ domain, username, password });

    // encrypt the siteKey using the masterKey
    // Key wrapping: the masterKey secures the per-item key
    const { ciphertext, iv, authTag } = encryptAESGCM(itemData, siteKey);
    const {
      ciphertext: encrypted_siteKey,
      iv: key_iv,
      authTag: encrypted_siteKeyAuthTag
    } = encryptAESGCM(siteKey.toString('base64'), masterKey);

    const newItem = new Item({
      owner_id,
      ciphertext,
      iv,
      authTag,
      encrypted_siteKey,
      key_iv,
      encrypted_siteKeyAuthTag
    });

    await newItem.save();
    res.status(201).json({ message: 'Item created successfully', itemId: newItem._id });

  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Let user edit stored password item
// Mission: decrypt the old siteKey, encrypt new credentials with it
const updateItem = async (req, res) => {
  try {
    const { domain, username, password } = req.body;
    const { itemId } = req.params;
    const owner_id = req.user._id;

    if (!domain || !username || !password) {
      return res.status(400).json({ error: 'Missing domain, username, or password' });
    }

    // get the item from DB ans access masterKey from session
    const masterKey = Buffer.from(req.session.masterKey, 'base64');
    const item = await Item.findOne({ _id: itemId, owner_id });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    // decrypt the stored siteKey using masterKey
    // convert from base64 to raw bytes
    const siteKey_b64 = decryptAESGCM(
      item.encrypted_siteKey,
      item.key_iv,
      item.encrypted_siteKeyAuthTag,
      masterKey
    ).toString('utf8');
    const siteKey = Buffer.from(siteKey_b64, 'base64');

    // re-encrypt updated credentials with original siteKey
    const jsonData = JSON.stringify({ domain, username, password });
    const { ciphertext, iv, authTag } = encryptAESGCM(jsonData, siteKey);

    item.ciphertext = ciphertext;
    item.iv = iv;
    item.authTag = authTag;
    await item.save();

    res.status(200).json({ message: 'Item updated sucessfully' });

  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete an item securely -> verify ownership and remove the document
const deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const owner_id = req.user._id;

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
