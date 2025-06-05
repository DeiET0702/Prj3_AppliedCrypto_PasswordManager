import React, { useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import '../styles/Login.css';
import MasterPasswordForm from '../components/MasterPasswordForm';

export default function Login() {
    const navigate = useNavigate();
    const { setUser, setIsVaultUnlocked } = useContext(UserContext);
    const [data, setData] = useState({ username: '', password: '' });
    const [showMasterPasswordPrompt, setShowMasterPasswordPrompt] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const loginRes = await axios.post('/login', data, { withCredentials: true });
            if (loginRes.data.error) {
                toast.error(loginRes.data.error);
            } else {
                // Optionally fetch profile if needed
                setUser(loginRes.data);
                setLoggedInUser(loginRes.data);
                setShowMasterPasswordPrompt(true);
                toast.success("Login successful! Please enter your Master Password.");
            }
        } catch (error) {
            const message = error.response?.data?.error || "Login failed.";
            toast.error(message);
        }
    };

    const handleCancelMasterPassword = async () => {
        try {
            await axios.post('/logout', {}, { withCredentials: true });
            setUser(null);
            setIsVaultUnlocked(false);
            setShowMasterPasswordPrompt(false);
            setLoggedInUser(null);
            toast.success('Logged out successfully.');
            navigate('/login');
        } catch (error) {
            toast.error('Failed to logout.');
        }
    };

    const handleMasterPasswordSuccess = () => {
        setShowMasterPasswordPrompt(false);
        setIsVaultUnlocked(true);
        navigate('/dashboard');
    };

    if (showMasterPasswordPrompt && loggedInUser) {
        return (
            <MasterPasswordForm
                user={loggedInUser}
                onUnlockSuccess={handleMasterPasswordSuccess}
                onCancel={handleCancelMasterPassword}
            />
        );
    }

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleLogin}>
                <h2>Login</h2>
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={data.username}
                    onChange={(e) => setData({ ...data, username: e.target.value })}
                    required
                    autoComplete="username"
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