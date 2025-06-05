import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext.jsx';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import AddPasswordForm from '../components/AddPasswordForm.jsx';
import SharePasswordForm from '../components/SharePasswordForm.jsx';
import UpdatePasswordForm from '../components/UpdatePasswordForm.jsx';
import { ConfirmDelete } from '../components/ConfirmDelete.jsx';
import PendingSharesList from '../components/PendingSharesList.jsx';
import AcceptedSharesList from '../components/AcceptedSharesList.jsx';
import SentSharesList from '../components/SentSharesList.jsx';
import MasterPasswordForm from '../components/MasterPasswordForm.jsx';

export default function Dashboard() {
  const { user, loading, isVaultUnlocked } = useContext(UserContext);
  const navigate = useNavigate();
  const [vaultItems, setVaultItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showShareForm, setShowShareForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loadingVault, setLoadingVault] = useState(true);
  const [showPassword, setShowPassword] = useState({});
  const [showMasterPasswordForm, setShowMasterPasswordForm] = useState(false);
  const [masterPasswordCallback, setMasterPasswordCallback] = useState(null);
  const [shareTab, setShareTab] = useState('pending'); // <-- Moved inside component

  useEffect(() => {
    const fetchVault = async () => {
      try {
        if (!isVaultUnlocked) {
          toast.error('Vault is not unlocked. Please enter your Master Password.');
          navigate('/login');
          return;
        }
        const res = await axios.get('/api/item/allItems', { withCredentials: true });
        setVaultItems(res.data);
        // Log vault items for debugging
        console.log('[Dashboard] Vault items:', res.data);
      } catch (err) {
        const message = err.response?.data?.error || 'Failed to load vault items';
        if (err.response?.status === 401) {
          toast.error('Session or vault access expired. Please log in again.');
          navigate('/login');
        } else {
          toast.error(message);
        }
      } finally {
        setLoadingVault(false);
      }
    };

    if (user) fetchVault();
  }, [user, isVaultUnlocked, navigate]);

  if (loading || loadingVault) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <div className="not-logged-in">Please log in to view your vault.</div>;
  }

  const handleAddPassword = async (newItem) => {
    try {
      await axios.post('/api/item/create', newItem, { withCredentials: true });
      toast.success('Password added successfully!');
      const updated = await axios.get('/api/item/allItems', { withCredentials: true });
      setVaultItems(updated.data);
      setShowAddForm(false);
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to add password';
      if (error.response?.status === 401) {
        toast.error('Session or vault access expired. Please log in again.');
        navigate('/login');
      } else {
        toast.error(message);
      }
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowUpdateForm(true);
  };

  const handleUpdate = async (updatedItem) => {
    try {
      const { _id, domain, username, password } = updatedItem;
      await axios.put(`/api/item/${_id}`, { domain, username, password }, { withCredentials: true });
      toast.success('Item updated successfully!');
      const updated = await axios.get('/api/item/allItems', { withCredentials: true });
      setVaultItems(updated.data);
      setShowUpdateForm(false);
      setSelectedItem(null);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update item';
      if (err.response?.status === 401) {
        toast.error('Session or vault access expired. Please log in again.');
        navigate('/login');
      } else {
        toast.error(message);
      }
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await ConfirmDelete(item);
    if (!confirmed) return;

    try {
      await axios.delete(`/api/item/${item._id}`, { withCredentials: true });
      setVaultItems((prev) => prev.filter((i) => i._id !== item._id));
      toast.success('Item deleted');
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to delete item';
      if (err.response?.status === 401) {
        toast.error('Session or vault access expired. Please log in again.');
        navigate('/login');
      } else {
        toast.error(message);
      }
    }
  };

  const handleShare = (item) => {
    setSelectedItem(item);
    setShowShareForm(true);
    // Log share action
    console.log('[Dashboard] Sharing item:', item);
  };

  const handleConfirmShare = ({ item, receiverUsername }) => {
    toast.success(`Shared ${item.domain} with ${receiverUsername}`);
    setShowShareForm(false);
    setSelectedItem(null);
    // Log share confirmation
    console.log(`[Dashboard] Shared ${item.domain} with ${receiverUsername}`);
  };

  const filteredItems = vaultItems.filter((item) =>
    (item.domain || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const requestMasterPassword = () => {
    return new Promise((resolve) => {
      setShowMasterPasswordForm(true);
      setMasterPasswordCallback(() => resolve);
    });
  };

  const handleMasterPasswordSubmit = async (masterPassword) => {
    setShowMasterPasswordForm(false);
    if (masterPasswordCallback) {
      masterPasswordCallback(masterPassword);
      setMasterPasswordCallback(null);
    }
  };

  if (!isVaultUnlocked) {
    return (
      <MasterPasswordForm
        user={user}
        onSubmit={handleMasterPasswordSubmit}
        onCancel={() => setShowMasterPasswordForm(false)}
      />
    );
  }

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Welcome, {user.username}'s Vault</h2>
      <div className="dashboard-actions">
        <input
          type="text"
          placeholder="🔍 Search domain..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button className="add-password-btn" onClick={() => setShowAddForm(true)}>
          ➕ Add Password
        </button>
      </div>

      {showAddForm && (
        <AddPasswordForm
          onAdd={handleAddPassword}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {showUpdateForm && selectedItem && (
        <UpdatePasswordForm
          item={selectedItem}
          onUpdate={handleUpdate}
          onClose={() => {
            setShowUpdateForm(false);
            setSelectedItem(null);
          }}
        />
      )}

      {showShareForm && selectedItem && (
        <SharePasswordForm
          item={selectedItem}
          onClose={() => {
            setShowShareForm(false);
            setSelectedItem(null);
          }}
          onShare={handleConfirmShare}
          requestMasterPassword={requestMasterPassword}
        />
      )}

      {showMasterPasswordForm && (
        <MasterPasswordForm
          user={user}
          onSubmit={handleMasterPasswordSubmit}
          onCancel={() => setShowMasterPasswordForm(false)}
        />
      )}

      {filteredItems.length === 0 ? (
        <p>No items found in your vault. Click "Add Password" to create one.</p>
      ) : (
        <table className="vault-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Username</th>
              <th>Password</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item._id}>
                <td>{item.domain}</td>
                <td>{item.username}</td>
                <td>
                  <input
                    type={showPassword[item._id] ? 'text' : 'password'}
                    value={item.password}
                    readOnly
                    className="password-mask"
                  />
                  <button
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        [item._id]: !prev[item._id],
                      }))
                    }
                    className="action-btn"
                  >
                    {showPassword[item._id] ? 'Hide' : 'Show'}
                  </button>
                </td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>{new Date(item.updatedAt).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleEdit(item)} className="action-btn edit">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(item)} className="action-btn delete">
                    Delete
                  </button>
                  <button onClick={() => handleShare(item)} className="action-btn share">
                    Share
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* --- Sharing Center --- */}
      <div className="sharing-center-container">
        <h2 className="sharing-center-title">🔗 Sharing Center</h2>
        <div className="sharing-tabs">
          <button
            className={shareTab === 'pending' ? 'active' : ''}
            onClick={() => setShareTab('pending')}
          >
            Pending
          </button>
          <button
            className={shareTab === 'accepted' ? 'active' : ''}
            onClick={() => setShareTab('accepted')}
          >
            Accepted
          </button>
          <button
            className={shareTab === 'sent' ? 'active' : ''}
            onClick={() => setShareTab('sent')}
          >
            Sent
          </button>
        </div>
        <div className="sharing-tab-content">
          {shareTab === 'pending' && <PendingSharesList requestMasterPassword={requestMasterPassword} />}
          {shareTab === 'accepted' && <AcceptedSharesList requestMasterPassword={requestMasterPassword} />}
          {shareTab === 'sent' && <SentSharesList requestMasterPassword={requestMasterPassword} />}
        </div>
      </div>
    </div>
  );
}