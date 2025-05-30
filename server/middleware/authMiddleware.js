
const requireMasterKey = (req, res, next) => {
    if (req.session && req.session.masterKey && req.session.masterKeyExpiresAt) {
        if (Date.now() < req.session.masterKeyExpiresAt) {
            req.masterKey = Buffer.from(req.session.masterKey, 'base64');
            return next();
        } else {
            delete req.session.masterKey;
            delete req.session.masterKeyExpiresAt;
            return res.status(401).json({ message: 'Master Key session expired. Please provide master password again.' });
        }
    }
    return res.status(401).json({ message: 'Master Key required. Please login or provide master password to activate it.' });
};

module.exports = { requireMasterKey };
