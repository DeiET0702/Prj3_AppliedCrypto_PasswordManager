const crypto = require('crypto');

// converts a user's master password + salt into a secure 256-bit key using PBKDF2
// generate a secure master key(256-bit = 32-byte) from a user's master password + a salt
// uses the PBKDF2 key derivation function with SHA-256 + 100,000 iterations 
function deriveMasterKey(masterPassword, salt) {
  return crypto.pbkdf2Sync(masterPassword, salt, 100000, 32, 'sha256');
}

// returns encrypted content, initialization vector (IV), and authentication tag
function encryptAESGCM(plaintext, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); // 'aes-256-gcm': AES-GCM algorithm
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plaintext, 'utf8')),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

function decryptAESGCM(ciphertext, iv, authTag, key) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(Buffer.from(authTag, 'base64')); // authTag phải 16 bytes Buffer
    let decrypted = decipher.update(ciphertext, null, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error('decryptAESGCM error:', e);
    return null;
  }
}

module.exports = {
  deriveMasterKey,
  encryptAESGCM,
  decryptAESGCM
};
