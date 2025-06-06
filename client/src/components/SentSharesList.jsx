import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserContext } from '../../context/UserContext';
import '../styles/SharesList.css';

export default function SentSharesList({ requestMasterPassword }) {
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
  }, [isVaultUnlocked]);

  const handleRevoke = async (shareId) => {
    setActionLoading(prev => ({ ...prev, [shareId]: true }));
    toast.loading('Revoking share...', { id: `revoke-${shareId}` });
    try {
      await axios.post(`/api/shares/${shareId}/revoke`, {}, { withCredentials: true });
      toast.success('Share revoked successfully.', { id: `revoke-${shareId}` });
      setSentShares(prev => prev.map(s => s.shareId === shareId ? { ...s, status: 'revoked' } : s));
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
      <ul>
        {sentShares.map(share => (
          <li key={share.shareId}>
            <b>To:</b> {share.receiverUsername} | <b>Domain:</b> {share.itemDomain} | 
            <b>Status:</b> {share.accepted ? 'Accepted' : 'Pending'}
          </li>
        ))}
      </ul>
    </div>
  );
}