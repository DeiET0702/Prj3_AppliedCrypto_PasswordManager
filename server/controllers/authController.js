// // backend/controllers/authController.js
// const User = require('../models/user'); 
// const { hashPassword, comparePassword } = require('../helpers/auth');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto'); // For generating master_salt during registration

// const test = (req, res) => {
//     res.json({
//         message: 'Hello from the server!'
//     });
// };

// const registerUser = async (req, res) => {
//     try {
//         const { name, email, password } = req.body; 

//         if (!name) {
//             return res.status(400).json({ error: 'Name is required' });
//         }
//         if (!password || password.length < 6) {
//             return res.status(400).json({ error: 'Password is required and must be at least 6 characters long' });
//         }
//         const exist = await User.findOne({ email });
//         if (exist) {
//             return res.status(409).json({ error: 'Email is already taken' });
//         }

//         const hashedPassword = await hashPassword(password);

//         // --- IMPORTANT: Generate and store master_salt ---
//         const master_salt = crypto.randomBytes(16); // 16 bytes =128 bits, suitable for PBKDF2

//         const user = await User.create({
//             name,
//             email,
//             password: hashedPassword,
//             master_salt: master_salt, // Save the master_salt
//         });

        
//         const userResponse = {
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//         };
//         return res.status(201).json(userResponse);

//     } catch (err) {
//         console.error("Register Error:", err);
//         // Check for MongoDB duplicate key error 
//         if (err.code === 11000) {
//             return res.status(409).json({ error: 'That username or email might already exist.' });
//         }
//         res.status(500).json({ error: "Server error during registration" });
//     }
// };

// const loginUser = async (req, res) => {
//     try {
//         const { email, password: loginPassword } = req.body; 
//         const user = await User.findOne({ email });

//         if (!user) {
//             return res.status(404).json({ error: 'No user found with that email' });
//         }
//         if (!user.master_salt) {
//             // This should ideally not happen if registration is correct
//             console.error(`User ${email} is missing master_salt.`);
//             return res.status(500).json({ error: 'User account configuration error. Please contact support.' });
//         }

//         const match = await comparePassword(loginPassword, user.password);

//         if (match) {
//             const payload = {
//                 email: user.email,
//                 id: user._id,
//                 name: user.name
//             };
//             const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Example expiry

//             // Send back user info needed by client, including master_salt.
//             const userResponse = {
//                 _id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 master_salt: user.master_salt.toString('hex'), // Send salt as hex or base64
//             };

//             res.cookie('token', token, {
//                 httpOnly: true,
//                 secure: process.env.NODE_ENV === 'production', // True in production
//                 sameSite: 'strict', // Helps prevent CSRF attacks
//                 // maxAge: 3600000 // 1 hour, same as JWT expiry
//             });
//             return res.json(userResponse);

//         } else {
//             return res.status(401).json({ error: 'Invalid credentials' });
//         }

//     } catch (error) {
//         console.error("Login Error:", error);
//         res.status(500).json({ error: "Server error during login" });
//     }
// };

// const getProfile = async (req, res) => {
//     const { token } = req.cookies;

//     if (!token) {
//         return res.status(401).json({ error: 'No token provided, authorization denied' });
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findById(decoded.id).select('-password'); // Exclude hashed password

//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }
//         if (!user.master_salt) {
//             console.error(`User ${user.email} (ID: ${user._id}) fetched by profile is missing master_salt.`);
            
//         }

//         const userProfile = {
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//             master_salt: user.master_salt ? user.master_salt.toString('hex') : null,
//         };
//         res.json(userProfile);

//     } catch (err) {
//         if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
//             return res.status(401).json({ error: 'Token is not valid or has expired' });
//         }
//         console.error("Get Profile Error:", err);
//         res.status(500).json({ error: 'Server error fetching profile' });
//     }
// };

// const logoutUser = (req, res) => {
//     res.clearCookie('token', {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'strict'
//     });
//     // Important: The client-side MUST also clear its cached masterKey on logout. 
//     res.json({ message: 'Logout successful!' });
// };

// backend/controllers/authController.js
const User = require('../models/user'); 
const { hashPassword, comparePassword } = require('../helpers/auth'); 
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // For PBKDF2 and randomBytes

// --- PBKDF2 and Master Key Constants ---
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 32; // 32 bytes = 256 bits (for AES-256)
const PBKDF2_DIGEST = 'sha512';
const MASTER_KEY_SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// --- Helper Function for PBKDF2 ---
function deriveMasterKey(masterPassword, salt) {
    // Ensure salt is a Buffer
    const saltBuffer = Buffer.isBuffer(salt) ? salt : Buffer.from(salt, 'hex');
    return crypto.pbkdf2Sync(
        masterPassword,
        saltBuffer,
        PBKDF2_ITERATIONS,
        PBKDF2_KEYLEN,
        PBKDF2_DIGEST
    ); // Returns a Buffer
}

const test = (req, res) => {
    res.json({
        message: 'Hello from the server auth controller!'
    });
};

const registerUser = async (req, res) => {
    try {
        // 'name' from req.body is username and 'email' is email.
        const { name, email, password, masterPassword } = req.body;

        if (!name) return res.status(400).json({ error: 'Name (username) is required' });
        if (!email) return res.status(400).json({ error: 'Email is required' });
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password is required and must be at least 6 characters long' });
        }
        if (!masterPassword || masterPassword.length < 8) { // Basic check for master password
            return res.status(400).json({ error: 'Master password is required and must be at least 8 characters long' });
        }

        const exist = await User.findOne({ email });
        if (exist) {
            return res.status(409).json({ error: 'Email is already taken' });
        }

        const hashedPassword = await hashPassword(password); // For regular login
        const master_salt = crypto.randomBytes(16); // Generate salt for Master Key PBKDF2

        const user = await User.create({
            username: name, 
            email,
            hashed_password: hashedPassword, 
            master_salt: master_salt,
        });

        // Derive and store Master Key in session immediately after registration
        const masterKey = deriveMasterKey(masterPassword, master_salt);
        req.session.userId = user._id.toString();
        req.session.masterKey = masterKey.toString('hex');
        req.session.masterKeyExpiresAt = Date.now() + MASTER_KEY_SESSION_DURATION;

        console.log(`User ${user.username} registered. Master Key stored in session.`);

        const userResponse = { // Don't send sensitive info like salts or masterKey back
            _id: user._id,
            username: user.username,
            email: user.email,
            message: "User registered successfully."
        };
        return res.status(201).json(userResponse);

    } catch (err) {
        console.error("Register Error:", err);
        if (err.code === 11000) {
            return res.status(409).json({ error: 'That username or email might already exist.' });
        }
        res.status(500).json({ error: "Server error during registration" });
    }
};

const loginUser = async (req, res) => {
    try {
        // Assuming login uses email and password, and masterPassword to unlock the master key
        const { email, password: loginPassword, masterPassword } = req.body;

        if (!email || !loginPassword || !masterPassword) {
            return res.status(400).json({ error: 'Email, password, and master password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' }); // Generic message
        }

        // 1. Verify regular login password
        // Your schema used 'hashed_password', but your controller used 'user.password'. Correcting to 'user.hashed_password'
        const match = await comparePassword(loginPassword, user.hashed_password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials.' }); // Generic message
        }

        // 2. Verify Master Password by deriving Master Key (it must match subsequent uses)
        // (Implicit verification: if they provide wrong masterPassword, derived key will be wrong and decryption will fail later)
        if (!user.master_salt) {
            console.error(`User ${email} is missing master_salt! This is a critical configuration error.`);
            return res.status(500).json({ error: 'Account configuration error. Please contact support.' });
        }
        const masterKey = deriveMasterKey(masterPassword, user.master_salt);

        // 3. Store the derived Master Key (as hex) and its expiry in the session
        req.session.userId = user._id.toString();
        req.session.masterKey = masterKey.toString('hex');
        req.session.masterKeyExpiresAt = Date.now() + MASTER_KEY_SESSION_DURATION;

        console.log(`User ${user.username} logged in. Master Key stored in session.`);

        // 4. JWT for stateless API calls (if you still need it for other parts of your app)
        const payload = { email: user.email, id: user._id, name: user.username }; // use username from model
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Example expiry

        res.cookie('token', token, { // Send JWT via cookie
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            // maxAge: 3600000 // 1 hour
        });

        // Send back user info (excluding sensitive data like salts or masterKey)
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            message: "Login successful. Master Key active in session."
            // DO NOT send master_salt or masterKey here.
        };
        return res.json(userResponse);

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Server error during login" });
    }
};

const getProfile = async (req, res) => { 
    const { token } = req.cookies;
    if (!token) {
        return res.status(401).json({ error: 'No token provided, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Fetch user, excluding sensitive fields like hashed_password and master_salt
        const user = await User.findById(decoded.id).select('-hashed_password -master_salt');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email
        });
    } catch (err) {
        // error handling 
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token is not valid or has expired' });
        }
        console.error("Get Profile Error:", err);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

const logoutUser = (req, res) => {
    // Clear the JWT cookie
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    // Destroy the session to clear Master Key and other session data
    req.session.destroy(err => {
        if (err) {
            console.error("Session destruction error during logout:", err);
            return res.status(500).json({ message: 'Could not log out effectively from session.' });
        }
        // Ensure client also clears any local state (like cached UI elements)
        res.json({ message: 'Logout successful! Session cleared.' });
    });
};

module.exports = {
    test,
    registerUser,
    loginUser,
    getProfile,
    logoutUser,
};