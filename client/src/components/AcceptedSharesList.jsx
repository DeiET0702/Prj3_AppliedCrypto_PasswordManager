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
        <table className="vault-table shares-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Username</th>
              <th>Password</th>
              <th>Shared By</th>
              <th>Accepted At</th>
            </tr>
          </thead>
          <tbody>
            {acceptedItems.map((item) => (
              <tr key={item.shareId || item.originalItemId}>
                <td>{item.domain}</td>
                <td>{item.username}</td>
                <td>
                  {item.error ? (
                    <span className="error-text">{item.error}</span>
                  ) : (
                    <>
                      <input
                        type={showPassword[item.shareId] ? 'text' : 'password'}
                        value={item.password || ''}
                        readOnly
                        className="password-mask"
                      />
                      <button
                        onClick={() =>
                          setShowPassword((prev) => ({
                            ...prev,
                            [item.shareId]: !prev[item.shareId],
                          }))
                        }
                        className="action-btn"
                        title={showPassword[item.shareId] ? 'Hide password' : 'Show password'}
                      >
                        {showPassword[item.shareId] ? '👁️ Hide' : '👁️ Show'}
                      </button>
                    </>
                  )}
                </td>
                <td>{item.senderUsername}</td>
                <td>{new Date(item.acceptedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No items shared with you have been accepted yet.</p>
      )}
    </div>
  );
}