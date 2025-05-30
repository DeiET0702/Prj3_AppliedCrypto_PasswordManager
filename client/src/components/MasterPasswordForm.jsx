<<<<<<< HEAD
// components/MasterPasswordForm.jsx
=======
>>>>>>> test_cud
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/MasterPasswordForm.css';

<<<<<<< HEAD

=======
>>>>>>> test_cud
export default function MasterPasswordForm({ user, onUnlockSuccess, onCancel }) {
    const [masterPasswordInput, setMasterPasswordInput] = useState('');
    const navigate = useNavigate();

<<<<<<< HEAD
=======
    // Kiểm tra user trước khi hiển thị form
    if (!user) {
        toast.error('No user data available. Please log in again.');
        navigate('/login');
        return null;
    }

>>>>>>> test_cud
    const handleActivateMasterKey = async (e) => {
        e.preventDefault();
        if (!masterPasswordInput) {
            toast.error("Master Password cannot be empty.");
            return;
        }

        try {
<<<<<<< HEAD
            const activateRes = await axios.post('/activate-master-key', {
                masterPassword: masterPasswordInput,
            });
=======
            const activateRes = await axios.post(
                '/activate-master-key',
                { masterPassword: masterPasswordInput },
                { withCredentials: true }
            );
>>>>>>> test_cud

            if (activateRes.data.error) {
                toast.error(activateRes.data.error);
            } else {
                toast.success(activateRes.data.message || "Vault unlocked!");
                setMasterPasswordInput('');
<<<<<<< HEAD
                onUnlockSuccess(); // Notify parent (Login.jsx)
                navigate('/dashboard');
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to activate Master Key. Please try again.");
=======
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
>>>>>>> test_cud
        }
    };

    return (
        <div className="master-password-prompt-container">
            <form className="master-password-form" onSubmit={handleActivateMasterKey}>
                <h2>Unlock Your Vault</h2>
<<<<<<< HEAD
                <p>Welcome, {user?.username}! Please enter your Master Password.</p>
=======
                <p>Welcome, {user.username}! Please enter your Master Password.</p>
>>>>>>> test_cud
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
<<<<<<< HEAD
}
=======
}
>>>>>>> test_cud
