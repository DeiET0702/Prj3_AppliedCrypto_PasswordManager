// --- Middleware to check for Master Key in session ---
// This middleware will be used on routes that require the Master Key
const requireMasterKey = (req, res, next) => {
    if (req.session && req.session.masterKey && req.session.masterKeyExpiresAt) {
        if (Date.now() < req.session.masterKeyExpiresAt) {
            // Master Key is valid and present in session
            // Make it available in req object (as a Buffer) for easier use in route handlers
            req.masterKey = Buffer.from(req.session.masterKey, 'hex');
            return next(); // Proceed to the protected route
        } else {
            // Master Key has expired in session
            delete req.session.masterKey;
            delete req.session.masterKeyExpiresAt;
            // Optionally, you could also delete req.session.userId if master key expiry means full re-auth
            return res.status(401).json({ message: 'Master Key session expired. Please provide master password again.' });
        }
    }
    // Master Key not in session or session invalid (e.g., user not logged in with master key)
    return res.status(401).json({ message: 'Master Key required. Please login or provide master password to activate it.' });
};

module.exports = { requireMasterKey };