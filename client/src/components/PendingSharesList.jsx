import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserContext } from '../../context/UserContext';
import '../styles/SharesList.css';

export default function PendingSharesList({ requestMasterPassword }) {
  const { isVaultUnlocked } = useContext(UserContext);
  const [pendingShares, setPendingShares] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const fetchPendingShares = async () => {
    if (!isVaultUnlocked) {
      console.log('PendingSharesList: Vault locked, skipping fetch');
      return;
    }
    console.log('PendingSharesList: Fetching pending shares');
    setIsLoading(true);
    try {
      const res = await axios.get('/api/shares/pending', { withCredentials: true });
      console.log('PendingSharesList: Pending shares fetched', res.data);
      setPendingShares(res.data || []);
    } catch (error) {
      console.error('PendingSharesList: Fetch error', error);
      toast.error(error.response?.data?.message || "Couldn't load pending shares.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('PendingSharesList: useEffect triggered', { isVaultUnlocked });
    fetchPendingShares();
  }, [isVaultUnlocked]);

  const handleAccept = async (shareId) => {
    if (!isVaultUnlocked) {
      toast.error('Please unlock your vault to accept shares.');
      return;
    }
    setActionLoading(prev => ({ ...prev, [shareId]: true }));
    toast.loading('Accepting share...', { id: `action-${shareId}` });
    try {
      // Try without master password first
      let res;
      try {
        res = await axios.post(`/api/shares/${shareId}/accept`, {}, { withCredentials: true });
      } catch (error) {
        if (error.response?.status === 401) {
          // Prompt for master password and retry
          const masterPassword = await requestMasterPassword();
          res = await axios.post(
            `/api/shares/${shareId}/accept`,
            {},
            {
              headers: { 'x-master-key': masterPassword },
              withCredentials: true
            }
          );
        } else {
          throw error;
        }
      }
      toast.success('Share accepted successfully!', { id: `action-${shareId}` });
      setPendingShares(prev => prev.filter(s => s.shareId !== shareId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept share.", { id: `action-${shareId}` });
    } finally {
      setActionLoading(prev => ({ ...prev, [shareId]: false }));
    }
  };

  const handleReject = async (shareId) => {
    console.log('PendingSharesList: Rejecting share', shareId);
    setActionLoading(prev => ({ ...prev, [shareId]: true }));
    toast.loading('Rejecting share...', { id: `action-${shareId}` });
    try {
      const res = await axios.post(`/api/shares/${shareId}/reject`, {}, { withCredentials: true });
      console.log('PendingSharesList: Share rejected', res.data);
      toast.success('Share rejected.', { id: `action-${shareId}` });
      setPendingShares(prev => prev.filter(s => s.shareId !== shareId));
    } catch (error) {
      console.error('PendingSharesList: Reject error', error);
      toast.error(error.response?.data?.message || "Failed to reject share.", { id: `action-${shareId}` });
    } finally {
      setActionLoading(prev => ({ ...prev, [shareId]: false }));
    }
  };

  if (!isVaultUnlocked) {
    return <p className="shares-list-info">Unlock your vault to see pending shares.</p>;
  }

  if (isLoading) {
    return <p className="shares-list-info">Loading pending shares...</p>;
  }

  if (pendingShares.length === 0) {
    return <p className="shares-list-info">No pending shares for you right now.</p>;
  }

  return (
    <div className="shares-list-container pending-shares">
      <h4>Pending Shares (Waiting for Your Action)</h4>
      <ul className="shares-list">
        {pendingShares.map(share => (
          <li key={share.shareId} className="share-item">
            <div className="share-item-info">
              <span>From: <strong>{share.senderUsername}</strong></span>
              <span>Item: <strong>{share.itemDomain}</strong></span>
              <span>Shared: {new Date(share.sharedAt).toLocaleDateString()}</span>
              {share.expiresAt && <span>Expires: {new Date(share.expiresAt).toLocaleString()}</span>}
            </div>
            <div className="share-item-actions">
              <button
                onClick={() => handleAccept(share.shareId)}
                disabled={actionLoading[share.shareId]}
                className="action-btn accept"
              >
                {actionLoading[share.shareId] ? 'Accepting...' : 'Accept'}
              </button>
              <button
                onClick={() => handleReject(share.shareId)}
                disabled={actionLoading[share.shareId]}
                className="action-btn reject"
              >
                {actionLoading[share.shareId] ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}