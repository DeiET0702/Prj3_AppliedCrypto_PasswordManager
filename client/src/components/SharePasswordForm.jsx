import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import '../styles/SharePasswordForm.css';

export default function SharePasswordForm({ onShareSuccess, onClose, item, requestMasterPassword }) {
  const [receiverUsername, setReceiverUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to call backend, prompt for master password if needed, and retry once
  const callWithMasterKey = async (apiCall) => {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Master key missing/expired, prompt for master password
        const masterPassword = await requestMasterPassword();
        return await apiCall(masterPassword);
      }
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!receiverUsername.trim()) {
      toast.error('Please enter a recipient username.');
      return;
    }
    if (receiverUsername === item.username) {
      toast.error('You cannot share a password with yourself.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Initiate share (may need master password)
      let masterPassword = undefined;
      const initiateApi = async (mpw) => {
        return await axios.post(
          `/api/shares/initiate/${item._id}`,
          { receiverUsername, domain: item.domain },
          {
            headers: mpw ? { 'x-master-key': mpw } : {},
            withCredentials: true
          }
        );
      };
      const initiateRes = await callWithMasterKey(initiateApi);
      const { shareId } = initiateRes.data;

      // Step 2: Provide share data (may need master password)
      const provideApi = async (mpw) => {
        return await axios.post(
          `/api/shares/provide-data/${shareId}`,
          {},
          {
            headers: mpw ? { 'x-master-key': mpw } : {},
            withCredentials: true
          }
        );
      };
      await callWithMasterKey(provideApi);

      toast.success(`Shared "${item.domain}" with ${receiverUsername}`);
      if (onShareSuccess) {
        onShareSuccess({ item, receiverUsername, shareId });
      }
      onClose();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to share item';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="share-form-overlay">
      <div className="share-form-modal">
        <h3>🔐 Share Password for: <i>{item.domain}</i></h3>
        <form onSubmit={handleSubmit}>
          <label>
            Recipient Username:
            <input
              type="text"
              value={receiverUsername}
              onChange={(e) => setReceiverUsername(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="username"
            />
          </label>
          <div className="share-form-buttons">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sharing...' : 'Share'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}