const mongoose = require('mongoose');
const { Schema } = mongoose;

const ItemSchema = new Schema({
    owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ciphertext: { type: String, required: true }, // Stored as base64
    iv: { type: String, required: true }, // Stored as base64
    authTag: { type: String, required: true }, // Now stored as hex
    key_iv: { type: String, required: true }, // Stored as base64
    encrypted_siteKey: { type: String, required: true }, // Stored as base64
    encrypted_siteKeyAuthTag: { type: String, required: true } // Now stored as hex
}, {
    timestamps: true // Sử dụng timestamps thay cho created_at/updated_at thủ công
});

module.exports = mongoose.model('Item', ItemSchema);