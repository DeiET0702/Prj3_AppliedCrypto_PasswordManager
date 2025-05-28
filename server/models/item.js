const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
    // itemId: ObjectId -> Mongoose default _id 
    owner_id: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Foreign key to the User collection
        required: true
    },

    ciphertext: { // Encrypted {domain, username, password}
        type: Buffer,
        required: true
    },
    iv: { // Nonce for AES-GCM encryption of the item data
        type: Buffer,
        required: true
    },
    key_iv: { // Nonce for AES-GCM encryption of the siteKey
        type: Buffer,
        required: true
    },
    encrypted_siteKey: {
        type: Buffer,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update `updated_at` on save
itemSchema.pre('save', function(next) {
    if (!this.isNew) { // if the document is not new
        this.updated_at = Date.now();
    }
    next();
});


const Item = mongoose.model('Item', itemSchema);

module.exports = Item;