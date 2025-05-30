const crypto = require('crypto');

function deriveMasterKey(masterPassword, salt) {
  console.log('Deriving masterKey with salt length:', salt.length);
  return crypto.pbkdf2Sync(masterPassword, salt, 100000, 32, 'sha256');
}

function encryptAESGCM(plaintext, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted,
    iv,
    authTag
  };
}

function decryptAESGCM(encryptedData) {
  try {
    const {
      ciphertext: ciphertextInput,
      iv: ivInput,
      authTag: authTagInput,
      key: keyInput
    } = encryptedData;

    // Convert all inputs to Buffer with proper encoding handling
    const ciphertext = Buffer.isBuffer(ciphertextInput) ? ciphertextInput : Buffer.from(ciphertextInput, 'base64');
    const iv = Buffer.isBuffer(ivInput) ? ivInput : Buffer.from(ivInput, 'base64');
    const key = Buffer.isBuffer(keyInput) ? keyInput : Buffer.from(keyInput, 'base64');
    
    // Special handling for authTag - it should always be 16 bytes
    let authTag;
    if (Buffer.isBuffer(authTagInput)) {
      authTag = authTagInput;
    } else {
      // Handle both base64 and hex encoded authTags
      const decoded = Buffer.from(authTagInput, authTagInput.length === 32 ? 'hex' : 'base64');
      authTag = decoded.length === 16 ? decoded : decoded.slice(0, 16);
    }

    if (authTag.length !== 16) {
      throw new Error(`Invalid authTag length after processing: ${authTag.length}`);
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return null;
  }
}

module.exports = {
  deriveMasterKey,
  encryptAESGCM,
  decryptAESGCM
};