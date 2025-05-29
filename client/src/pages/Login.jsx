// Login.jsx (Conceptual - you'll need to adapt this)
import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext'; // Assuming this context might store master key status
import '../styles/Login.css';
// You might want a new component for the master password modal
// import MasterPasswordModal from './MasterPasswordModal';

export default function Login() {
    const navigate = useNavigate();
    const { user, setUser, setIsVaultUnlocked } = useContext(UserContext); // Added setIsVaultUnlocked

    const [data, setData] = useState({
        email: '',
        password: '',
    });

    const [showMasterPasswordPrompt, setShowMasterPasswordPrompt] = useState(false);
    const [masterPasswordInput, setMasterPasswordInput] = useState('');

    useEffect(() => {
        // If user is already logged in AND vault is unlocked, navigate to dashboard
        // This logic might need adjustment based on how you track "vault unlocked" state
        if (user /* && isVaultUnlocked (from context) */) {
            // navigate('/dashboard');
        } else if (user && !showMasterPasswordPrompt /* && !isVaultUnlocked */) {
            // User is logged in but vault not unlocked, prompt for master password
            setShowMasterPasswordPrompt(true);
        }
    }, [user, /*isVaultUnlocked,*/ showMasterPasswordPrompt, navigate]);


    const handleLogin = async (e) => {
        e.preventDefault();
        const { email, password } = data;
        try {
            // Step 1: Regular Login
            const loginRes = await axios.post('/login', { email, password });

            if (loginRes.data.error) {
                toast.error(loginRes.data.error);
            } else {
                // Login successful, JWT is set. Now get profile.
                const profileRes = await axios.get('/profile'); // Get profile using JWT
                setUser(profileRes.data); // Set user context
                toast.success("Login successful! Please enter your Master Password.");
                setData({ email: '', password: '' }); // Clear login form
                setShowMasterPasswordPrompt(true); // Show prompt for master password
                // Do NOT navigate to dashboard yet
            }
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.error || "Login failed. Please try again!";
            toast.error(errorMessage);
        }
    };

    const handleActivateMasterKey = async (e) => {
        e.preventDefault();
        if (!masterPasswordInput) {
            toast.error("Master Password cannot be empty.");
            return;
        }
        try {
            // Step 2: Activate Master Key
            const activateRes = await axios.post('/activate-master-key', { masterPassword: masterPasswordInput });

            if (activateRes.data.error) {
                toast.error(activateRes.data.error);
            } else {
                toast.success(activateRes.data.message || "Vault unlocked!");
                // if (setIsVaultUnlocked) setIsVaultUnlocked(true); // Update context
                setShowMasterPasswordPrompt(false);
                setMasterPasswordInput('');
                navigate('/dashboard'); // Now navigate to dashboard
            }
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.error || "Failed to activate Master Key. Please try again.";
            toast.error(errorMessage);
            // Optionally, if master key activation fails, you might want to log the user out
            // or clear the master password input for another attempt.
        }
    };

    if (showMasterPasswordPrompt && user) {
        return (
            <div className="master-password-prompt-container"> {/* Style this appropriately */}
                <form className="master-password-form" onSubmit={handleActivateMasterKey}>
                    <h2>Unlock Your Vault</h2>
                    <p>Welcome, {user.username}! Please enter your Master Password.</p>
                    <label htmlFor="masterPassword">Master Password</label>
                    <input
                        type="password"
                        id="masterPassword"
                        value={masterPasswordInput}
                        onChange={(e) => setMasterPasswordInput(e.target.value)}
                        required
                    />
                    <button type="submit">Unlock Vault</button>
                    <button type="button" onClick={() => { /* Handle logout or cancel */
                        setShowMasterPasswordPrompt(false);
                        // Potentially call logout API if user cancels here
                    }}>Cancel / Logout</button>
                </form>
            </div>
        );
    }

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleLogin}>
                <h2>Login</h2>
                {/* Email and Password inputs as before */}
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                    required
                />
                
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={data.password}
                    onChange={(e) => setData({ ...data, password: e.target.value })}
                    required
                    autoComplete="current-password" 
                />
                <button type="submit">Login</button>
            </form>
        </div>
    );
}