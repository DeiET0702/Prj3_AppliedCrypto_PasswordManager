import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserContext } from '../../context/UserContext';
import '../styles/SharesList.css';

export default function AcceptedSharesList({ refreshTrigger, requestMasterPassword }) {
  const { isVaultUnlocked } = useContext(UserContext);
  const [acceptedItems, setAcceptedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({});

  const fetchAcceptedShares = async () => {
    if (!isVaultUnlocked) {
      console.log('AcceptedSharesList: Vault locked, skipping fetch');
      return;
    }
    console.log('AcceptedSharesList: Fetching accepted shares');
    setIsLoading(true);
    try {
      const res = await requestMasterPassword((masterPassword) => {
        console.log('AcceptedSharesList: Sending fetch accepted shares request with master password');
        return axios.get('/api/shares/accepted', {
          headers: { 'x-master-key': masterPassword },
          withCredentials: true
        });
      });
      if (!res) throw new Error('Master password required to view accepted shares.');
      console.log('AcceptedSharesList: Accepted shares fetched', res.data);
      setAcceptedItems(res.data || []);
    } catch (error) {
      console.error('AcceptedSharesList: Fetch error', error);
      toast.error(error.response?.data?.message || "Couldn't load items shared with you.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('AcceptedSharesList: useEffect triggered', { isVaultUnlocked, refreshTrigger });
    fetchAcceptedShares();
  }, [isVaultUnlocked, refreshTrigger]);

  if (!isVaultUnlocked) {
    return <p className="shares-list-info">Unlock your vault to see items shared with you.</p>;
  }
  if (isLoading) {
    return <p className="shares-list-info">Loading items shared with you...</p>;
  }
  if (acceptedItems.length === 0) {
    return <p className="shares-list-info">No items have been shared with you yet, or none accepted.</p>;
  }

  return (
    <div className="shares-list-container accepted-shares">
      <h4>Items Shared With You (Accepted)</h4>
      {acceptedItems.length > 0 ? (
        <ul>
          {acceptedItems.map(item => (
            <li key={item.shareId}>
              <b>Domain:</b> {item.itemDomain} | <b>Shared By:</b> {item.senderUsername} | 
              <b>Accepted At:</b> {item.acceptedAt ? new Date(item.acceptedAt).toLocaleString() : ''}
            </li>
          ))}
        </ul>
      ) : (
        <p>No items shared with you have been accepted yet.</p>
      )}
    </div>
  );
}