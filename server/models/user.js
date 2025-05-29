const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    // userId: Mongoose default _id 
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true // remove whitespace
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true, //  store emails in lowercase
        match: [/.+\@.+\..+/, 'Please fill a valid email address'] // Basic email validation
    },
    hashed_password: {
        type: String, // For bcrypt hash
        required: true
    },
    master_salt: {
        type: Buffer, // Salt for PBKDF2
        required: true
    }
}, 
);

const User = mongoose.model('User', userSchema);

module.exports = User;