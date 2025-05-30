import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/MasterPasswordForm.css';

export default function MasterPasswordForm({ user, onUnlockSuccess, onCancel }) {
    const [masterPasswordInput, setMasterPasswordInput] = useState('');
    const navigate = useNavigate();

    // Kiểm tra user trước khi hiển thị form
    if (!user) {
        toast.error('No user data available. Please log in again.');
        navigate('/login');
        return null;
    }

    const handleActivateMasterKey = async (e) => {
        e.preventDefault();
        if (!masterPasswordInput) {
            toast.error("Master Password cannot be empty.");
            return;
        }

        try {
            const activateRes = await axios.post(
                '/activate-master-key',
                { masterPassword: masterPasswordInput },
                { withCredentials: true }
            );

            if (activateRes.data.error) {
                toast.error(activateRes.data.error);
            } else {
                toast.success(activateRes.data.message || "Vault unlocked!");
                setMasterPasswordInput('');
                onUnlockSuccess();
                navigate('/dashboard');
            }
        } catch (error) {
            const message = error.response?.data?.error || "Failed to activate Master Key.";
            if (error.response?.status === 401) {
                toast.error("Session expired. Please log in again.");
                navigate('/login');
            } else {
                toast.error(message);
            }
        }
    };

    return (
        <div className="master-password-prompt-container">
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
                <button type="button" onClick={onCancel}>
                    Cancel / Logout
                </button>
            </form>
        </div>
    );
}