// backend/controllers/authController.js
const User = require('../models/user');
const { hashPassword, comparePassword } = require('../helpers/auth');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// --- PBKDF2 and Master Key Constants ---
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = 'sha512';
const MASTER_KEY_SESSION_DURATION = 60 * 60 * 1000; // 1 hour

// --- Helper Function for PBKDF2 ---
function deriveMasterKey(masterPassword, salt) {
    const saltBuffer = Buffer.isBuffer(salt) ? salt : Buffer.from(salt, 'base64');
    return crypto.pbkdf2Sync(
        masterPassword,
        saltBuffer,
        PBKDF2_ITERATIONS,
        PBKDF2_KEYLEN,
        PBKDF2_DIGEST
    );
}

const test = (req, res) => {
    res.json({ message: 'Hello from the server auth controller!' });
};

const registerUser = async (req, res) => {
    try {
        // No masterPassword expected here anymore
        const { name, email, password } = req.body;

        if (!name) return res.status(400).json({ error: 'Name (username) is required' });
        if (!email) return res.status(400).json({ error: 'Email is required' });
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password is required and must be at least 6 characters long' });
        }

        const exist = await User.findOne({ email });
        if (exist) {
            return res.status(409).json({ error: 'Email is already taken' });
        }

        const hashedPassword = await hashPassword(password);
        const master_salt = crypto.randomBytes(16); // Generate master_salt

        const user = await User.create({
            username: name,
            email,
            hashed_password: hashedPassword,
            master_salt: master_salt, // Store master_salt
        });


        // NO Master Key derivation or session storage here
        console.log(`User ${user.username} registered with master_salt.`);

        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            message: "User registered successfully. Please login and provide master password to activate vault."
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
        // No masterPassword expected here anymore for the initial login
        const { username, password: loginPassword } = req.body;

        if (!username || !loginPassword) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // authController.js -> loginUser

    const user = await User.findOne({ username });
    if (!user) {
        console.log(`LOGIN ATTEMPT: No user found for username: ${username}`); // Log this
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    console.log(`LOGIN ATTEMPT: User found: ${user.username}`);

    const match = await comparePassword(loginPassword, user.hashed_password);
    console.log(`LOGIN ATTEMPT: bcrypt.compare result (match): ${match}`); // This will be true or false

    if (!match) {
        console.log(`LOGIN ATTEMPT: Password mismatch for user ${user.username}.`);
        return res.status(401).json({ error: 'Invalid credentials.' });
    }


        // Set up JWT for general authentication
        const payload = { username: user.username, id: user._id.toString(), username: user.username };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); 

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        req.session.userId = user._id.toString(); // For linking to master key activation

        console.log(`User ${user.username} logged in. JWT set. Master Key not yet active in session.`);

        const userResponse = {
            _id: user._id,
            username: user.username,
            message: "Login successful. Please provide master password to unlock your vault."
            // No master_salt sent here
        };
        return res.json(userResponse);

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Server error during login" });
    }
};

// --- NEW ENDPOINT HANDLER ---
const activateMasterKey = async (req, res) => {
    try {
        const { masterPassword } = req.body;
        // Get userId: From session (if set during loginUser)
        const userId = req.session.userId;

        if (!userId) {
            // This means user isn't properly "logged in" so they can't activate master key
            return res.status(401).json({ error: 'User session not found. Please login first.' });
        }

        if (!masterPassword) {
            return res.status(400).json({ error: 'Master password is required.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            // Should not happen if userId in session/JWT is valid
            return res.status(404).json({ error: 'User not found.' });
        }

        if (!user.master_salt) {
            console.error(`User ${user.username} (ID: ${userId}) is missing master_salt! Critical error.`);
            return res.status(500).json({ error: 'Account configuration error. Cannot activate master key.' });
        }

        const masterKeyBuffer = deriveMasterKey(masterPassword, user.master_salt);

        // Store derived Master Key in session
        req.session.masterKey = masterKeyBuffer.toString('base64');
        req.session.masterKeyExpiresAt = Date.now() + MASTER_KEY_SESSION_DURATION;
        // req.session.userId is already set from loginUser

        console.log(`Master Key activated for user ${user.username}. Stored in session.`);
        return res.status(200).json({ message: 'Master Key activated successfully. Vault is unlocked.' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') { // If using JWT for userId
            return res.status(401).json({ error: 'Session token invalid or expired. Please login again.' });
        }
        console.error("Activate Master Key Error:", error);
        // A common error here would be if the masterPassword was wrong, PBKDF2 runs but the key is "wrong" which will only be evident when trying to decrypt something.
        // It's hard to give a "wrong master password" error here without comparing derived key to something.
        return res.status(500).json({ error: "Error activating master key." });
    }
};


const getProfile = async (req, res) => {
    const { token } = req.cookies;
    if (!token) {
        return res.status(401).json({ error: 'No token provided, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-hashed_password -master_salt');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email
        });
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token is not valid or has expired' });
        }
        console.error("Get Profile Error:", err);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

const logoutUser = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error("Session destruction error during logout:", err);
                return res.status(500).json({ message: 'Logout partially successful.' });
            }
            console.log('Session destroyed successfully during logout.');
            return res.json({ message: 'Logout successful! Session cleared.' });
        });
    } else {
        return res.json({ message: 'Logout successful! (No active session)' });
    }
};

const getAllUsers = async(req, res) => {
    try{
        const user = await User.find();
        res.json(user);
        console.log(user);
    }catch(error){
        console.error("Error fetching all users:", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}

module.exports = {
    test,
    registerUser,
    loginUser,
    activateMasterKey, 
    getProfile,
    logoutUser,
    getAllUsers
};