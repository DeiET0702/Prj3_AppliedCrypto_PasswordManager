import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { UserContext } from '../../context/UserContext.jsx';
import '../styles/MasterPasswordForm.css';

export default function MasterPasswordForm({
  user,
  title,
  onUnlockSuccess,
  onCancel,
  onSubmit,
  onClose
}) {
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const { setIsVaultUnlocked } = useContext(UserContext);

  useEffect(() => {
    if (!user && !onSubmit) {
      toast.error('No user data available. Please log in again.');
    }
  }, [user, onSubmit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!masterPasswordInput) {
      toast.error("Master Password cannot be empty.");
      return;
    }

    if (onSubmit) {
      // For share actions, just pass the password up
      onSubmit(masterPasswordInput);
      setMasterPasswordInput('');
      return;
    }

    // For login/vault unlock
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
        setIsVaultUnlocked(true);
        if (onUnlockSuccess) onUnlockSuccess();
      }
    } catch (error) {
      const message = error.response?.data?.error || "Failed to activate Master Key.";
      toast.error(message);
    }
  };

  return (
    <div className="master-password-prompt-container">
      <form className="master-password-form" onSubmit={handleSubmit}>
        <h2>{title || "Unlock Your Vault"}</h2>
        {user && <p>Welcome, {user.username}! Please enter your Master Password.</p>}
        <label htmlFor="masterPassword">Master Password</label>
        <input
          type="password"
          id="masterPassword"
          value={masterPasswordInput}
          onChange={(e) => setMasterPasswordInput(e.target.value)}
          required
          autoComplete="current-password"
        />
        <button type="submit">{title ? title : "Unlock Vault"}</button>
        <button type="button" onClick={onCancel || onClose}>
          Cancel / Logout
        </button>
      </form>
    </div>
  );
}