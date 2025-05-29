// components/MasterPasswordForm.jsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/MasterPasswordForm.css';


export default function MasterPasswordForm({ user, onUnlockSuccess, onCancel }) {
    const [masterPasswordInput, setMasterPasswordInput] = useState('');
    const navigate = useNavigate();

    const handleActivateMasterKey = async (e) => {
        e.preventDefault();
        if (!masterPasswordInput) {
            toast.error("Master Password cannot be empty.");
            return;
        }

        try {
            const activateRes = await axios.post('/activate-master-key', {
                masterPassword: masterPasswordInput,
            });

            if (activateRes.data.error) {
                toast.error(activateRes.data.error);
            } else {
                toast.success(activateRes.data.message || "Vault unlocked!");
                setMasterPasswordInput('');
                onUnlockSuccess(); // Notify parent (Login.jsx)
                navigate('/dashboard');
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to activate Master Key. Please try again.");
        }
    };

    return (
        <div className="master-password-prompt-container">
            <form className="master-password-form" onSubmit={handleActivateMasterKey}>
                <h2>Unlock Your Vault</h2>
                <p>Welcome, {user?.username}! Please enter your Master Password.</p>
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
