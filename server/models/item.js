const mongoose = require('mongoose');
const { Schema } = mongoose;

const ItemSchema = new Schema({
<<<<<<< HEAD
    owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Foreign key to User
    ciphertext: { type: Buffer, required: true },      // Encrypted {domain, username, password}
    iv: { type: Buffer, required: true },              // IV for ciphertext
    authTag: { type: Buffer, required: true },         // GCM AuthTag for ciphertext
    key_iv: { type: Buffer, required: true },          // IV for encrypted_siteKey
    encrypted_siteKey: { type: Buffer, required: true },
    encrypted_siteKeyAuthTag: { type: Buffer, required: true }, // GCM AuthTag for encrypted_siteKey
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Middleware for updated_at
ItemSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
=======
    owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ciphertext: { type: String, required: true }, // Stored as base64
    iv: { type: String, required: true }, // Stored as base64
    authTag: { type: String, required: true }, // Now stored as hex
    key_iv: { type: String, required: true }, // Stored as base64
    encrypted_siteKey: { type: String, required: true }, // Stored as base64
    encrypted_siteKeyAuthTag: { type: String, required: true } // Now stored as hex
}, {
    timestamps: true // Sử dụng timestamps thay cho created_at/updated_at thủ công
>>>>>>> test_cud
});

module.exports = mongoose.model('Item', ItemSchema);