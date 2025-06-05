// backend/index.js
require('dotenv').config(); // Load environment variables

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const SESSION_SECRET = process.env.SESSION_SECRET || 'defaultSecret'; 
const MONGO_URL = process.env.MONGO_URL;  

const app = express(); // Single Express app instance

// Database connection
mongoose.connect(MONGO_URL)
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log("Database not connected", err));

// --- Middleware ---
// CORS configured based on frontend's origin
app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173' 
}));

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: false })); // For parsing application/x-www-form-urlencoded
app.use(cookieParser()); // Parse cookies BEFORE session middleware

// --- Session Configuration ---
const MASTER_KEY_COOKIE_EXTENSION = 5 * 60 * 1000; // 5 minutes
app.use(session({
    secret: SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: (60 * 60 * 1000) + MASTER_KEY_COOKIE_EXTENSION // 1 hour + 5 mins for the session cookie
    }
}));

// --- Routes ---
app.use('/', require('./routes/authRoute')); // Handles /register, /login, /profile, /logout
app.use('/api/item', require('./routes/itemRoutes')); // Handles /api/item/create, /api/item/, etc.
app.use('/api/shares', require('./routes/shareRoutes')); 
// --- Server Listening ---
const port = 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
