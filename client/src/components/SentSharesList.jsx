import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserContext } from '../../context/UserContext';
import '../styles/SharesList.css';

export default function SentSharesList({ refreshTrigger, onActionCompleted, requestMasterPassword }) {
  const { isVaultUnlocked } = useContext(UserContext);
  const [sentShares, setSentShares] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const fetchSentShares = async () => {
    if (!isVaultUnlocked) return;
    setIsLoading(true);
    try {
      const res = await axios.get('/api/shares/sent', { withCredentials: true });
      setSentShares(res.data || []);
    } catch (error) {
      console.error("Failed to fetch sent shares:", error);
      toast.error(error.response?.data?.message || "Couldn't load your sent shares.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSentShares();
  }, [isVaultUnlocked, refreshTrigger]);

  const handleRevoke = async (shareId) => {
    setActionLoading(prev => ({ ...prev, [shareId]: true }));
    toast.loading('Revoking share...', { id: `revoke-${shareId}` });
    try {
      await axios.post(`/api/shares/${shareId}/revoke`, {}, { withCredentials: true });
      toast.success('Share revoked successfully.', { id: `revoke-${shareId}` });
      setSentShares(prev => prev.map(s => s.shareId === shareId ? { ...s, status: 'revoked' } : s));
      if (onActionCompleted) onActionCompleted('revoke');
    } catch (error) {
      console.error("Failed to revoke share:", error);
      toast.error(error.response?.data?.message || "Failed to revoke share.", { id: `revoke-${shareId}` });
    } finally {
      setActionLoading(prev => ({ ...prev, [shareId]: false }));
    }
  };

  const handleProvideData = async (shareId) => {
    setActionLoading(prev => ({ ...prev, [shareId]: true }));
    toast.loading('Providing data for share...', { id: `provide-${shareId}` });
    try {
      const config = {
        method: 'post',
        url: `/api/shares/provide-data/${shareId}`,
        data: {},
        withCredentials: true
      };
      const res = await requestMasterPassword(async () => {
        const masterPassword = await promptMasterPassword();
        return await axios({ ...config, headers: { 'x-master-key': masterPassword } });
      });
      if (!res) throw new Error('Master password required to provide share data.');
      toast.success('Data provided successfully.', { id: `provide-${shareId}` });
      setSentShares(prev => prev.map(s => s.shareId === shareId ? { ...s, status: 'pending_receiver_acceptance' } : s));
      if (onActionCompleted) onActionCompleted('provide');
    } catch (error) {
      console.error("Failed to provide data for share:", error);
      toast.error(error.response?.data?.message || "Failed to provide data.", { id: `provide-${shareId}` });
    } finally {
      setActionLoading(prev => ({ ...prev, [shareId]: false }));
    }
  };

  const promptMasterPassword = async () => {
    return new Promise((resolve) => {
      requestMasterPassword((masterPassword) => {
        resolve(masterPassword);
      });
    });
  };

  if (!isVaultUnlocked) {
    return <p className="shares-list-info">Unlock your vault to manage shares you've sent.</p>;
  }
  if (isLoading) {
    return <p className="shares-list-info">Loading your sent shares...</p>;
  }
  if (sentShares.length === 0) {
    return <p className="shares-list-info">You haven't sent any shares yet.</p>;
  }

  return (
    <div className="shares-list-container sent-shares">
      <h4>Shares You've Sent</h4>
      {sentShares.length > 0 ? (
        <ul className="shares-list">
          {sentShares.map((share) => (
            <li key={share.shareId} className={`share-item status-${share.status}`}>
              <div className="share-item-info">
                <span>To: <strong>{share.receiverUsername}</strong></span>
                <span>Status: <strong className={`status-badge status-${share.status}`}>{share.status.replace('_', ' ')}</strong></span>
                <span>Sent: {new Date(share.sharedAt).toLocaleDateString()}</span>
                {share.expiresAt && (share.status === 'pending_receiver_acceptance' || share.status === 'pending_sender_action') &&
                  <span>Expires: {new Date(share.expiresAt).toLocaleString()}</span>
                }
                {share.acceptedAt && <span>Accepted: {new Date(share.acceptedAt).toLocaleString()}</span>}
              </div>
              <div className="share-item-actions">
                {(share.status === 'pending_receiver_acceptance' || share.status === 'accepted') && (
                  <button
                    onClick={() => handleRevoke(share.shareId)}
                    disabled={actionLoading[share.shareId]}
                    className="action-btn revoke"
                  >
                    {actionLoading[share.shareId] ? 'Revoking...' : 'Revoke'}
                  </button>
                )}
                {share.status === 'pending_sender_action' && (
                  <button
                    onClick={() => handleProvideData(share.shareId)}
                    disabled={actionLoading[share.shareId]}
                    className="action-btn provide-data-again"
                    title="Provide data to complete sharing"
                  >
                    {actionLoading[share.shareId] ? 'Providing...' : 'Provide Data'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>You haven't sent any shares.</p>
      )}
    </div>
  );
}