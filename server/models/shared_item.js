const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sharedItemSchema = new Schema({
    item_id: {
        type: Schema.Types.ObjectId,
        ref: 'Item', // Foreign key to the Item collection
        required: true
    },
    sender_username: {
        type: String,
        required: true,
        trim: true
    },
    receiver_username: {
        type: String,
        required: true,
        trim: true
    },
    ciphertext: { // Encrypted item data for the receiver
        type: Buffer, // Using Buffer for Binary/Hexa
        default: null
    },
    wrapped_key: { // siteKey wrapped with receiver's master key
        type: Buffer, 
        default: null
    },
    shared_at: {
        type: Date,
        default: Date.now
    },
    accepted: {
        type: Boolean,
        default: false
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    expiration_at: { // Deadline for receiver to accept
        type: Date,
        required: true // set programmatically
    }
});

// CHECK UNIQUE constraint
sharedItemSchema.index({ item_id: 1, receiver_username: 1 }, { unique: true });

// Middleware to update `updated_at` and set `expiration_at`
sharedItemSchema.pre('save', function(next) {
    // Set expiration_at = shared_at + 24h, only on creation or if shared_at changes
    if (this.isNew || this.isModified('shared_at')) {
        const sharedTime = this.shared_at || new Date(); // Use current time if shared_at not set yet
        this.expiration_at = new Date(sharedTime.getTime() + 24 * 60 * 60 * 1000);
    }

    // Update `updated_at` if the document is being modified (and not new)
    if (!this.isNew) {
        this.updated_at = Date.now();
    }
    next();
});


const SharedItem = mongoose.model('SharedItem', sharedItemSchema);

module.exports = SharedItem;