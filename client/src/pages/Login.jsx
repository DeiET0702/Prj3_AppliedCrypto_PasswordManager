<<<<<<< HEAD
// Login.jsx
=======
>>>>>>> test_cud
import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import '../styles/Login.css';
<<<<<<< HEAD
import MasterPasswordForm from '../components/MasterPasswordForm'; // ✅ Import mới
=======
import MasterPasswordForm from '../components/MasterPasswordForm';
>>>>>>> test_cud

export default function Login() {
    const navigate = useNavigate();
    const { user, setUser, setIsVaultUnlocked } = useContext(UserContext);
    const [data, setData] = useState({ email: '', password: '' });
    const [showMasterPasswordPrompt, setShowMasterPasswordPrompt] = useState(false);

    useEffect(() => {
        if (user && !showMasterPasswordPrompt) {
            setShowMasterPasswordPrompt(true);
        }
    }, [user, showMasterPasswordPrompt]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
<<<<<<< HEAD
            const loginRes = await axios.post('/login', data);
            if (loginRes.data.error) {
                toast.error(loginRes.data.error);
            } else {
                const profileRes = await axios.get('/profile');
=======
            const loginRes = await axios.post('/login', data, { withCredentials: true });
            if (loginRes.data.error) {
                toast.error(loginRes.data.error);
            } else {
                const profileRes = await axios.get('/profile', { withCredentials: true });
>>>>>>> test_cud
                setUser(profileRes.data);
                toast.success("Login successful! Please enter your Master Password.");
                setData({ email: '', password: '' });
                setShowMasterPasswordPrompt(true);
            }
        } catch (error) {
<<<<<<< HEAD
            toast.error(error.response?.data?.error || "Login failed.");
        }
    };

    const handleCancelMasterPassword = () => {
        setShowMasterPasswordPrompt(false);
        // Optionally logout user here
=======
            const message = error.response?.data?.error || "Login failed.";
            if (error.response?.status === 401) {
                toast.error("Invalid credentials. Please try again.");
            } else {
                toast.error(message);
            }
        }
    };

    const handleCancelMasterPassword = async () => {
        try {
            await axios.post('/logout', {}, { withCredentials: true });
            setUser(null);
            setIsVaultUnlocked(false);
            setShowMasterPasswordPrompt(false);
            toast.success('Logged out successfully.');
            navigate('/login');
        } catch (error) {
            toast.error('Failed to logout.');
        }
>>>>>>> test_cud
    };

    const handleMasterPasswordSuccess = () => {
        setShowMasterPasswordPrompt(false);
<<<<<<< HEAD
        if (setIsVaultUnlocked) setIsVaultUnlocked(true);
=======
        setIsVaultUnlocked(true);
>>>>>>> test_cud
    };

    if (showMasterPasswordPrompt && user) {
        return (
            <MasterPasswordForm
                user={user}
                onUnlockSuccess={handleMasterPasswordSuccess}
                onCancel={handleCancelMasterPassword}
            />
        );
    }

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleLogin}>
                <h2>Login</h2>
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
<<<<<<< HEAD
}
=======
}
>>>>>>> test_cud
