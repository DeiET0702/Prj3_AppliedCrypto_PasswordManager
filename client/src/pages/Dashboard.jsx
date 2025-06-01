import { useContext, useEffect, useState, useCallback } from 'react';
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
  const { user, loading: userLoading, isVaultUnlocked } = useContext(UserContext);
  const navigate = useNavigate();

  // State for user's own vault items
  const [vaultItems, setVaultItems] = useState([]);
  const [loadingVault, setLoadingVault] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState({});

  // State for UI Modals/Forms
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showShareForm, setShowShareForm] = useState(false);
  const [showMasterPasswordForm, setShowMasterPasswordForm] = useState(false);
  const [masterPasswordCallback, setMasterPasswordCallback] = useState(null);
  const [selectedItemForAction, setSelectedItemForAction] = useState(null);

  // State for triggering re-fetch of share lists
  const [shareActionTrigger, setShareActionTrigger] = useState(0);

  const triggerShareRefresh = () => {
    console.log('Dashboard: Triggering share list refresh');
    setShareActionTrigger(prev => prev + 1);
  };

  const fetchVaultItems = useCallback(async () => {
    if (!user || !isVaultUnlocked) {
      setLoadingVault(false);
      return;
    }
    console.log('Dashboard: Fetching vault items');
    setLoadingVault(true);
    try {
      const res = await axios.get('/api/item/allItems', { withCredentials: true });
      setVaultItems(res.data || []);
    } catch (err) {
      handleApiError(err, 'Failed to load vault items');
    } finally {
      setLoadingVault(false);
    }
  }, [user, isVaultUnlocked]);

  useEffect(() => {
    console.log('Dashboard: useEffect triggered', { user: !!user, isVaultUnlocked, userLoading });
    if (user && isVaultUnlocked) {
      fetchVaultItems();
    } else if (user && !isVaultUnlocked && !userLoading) {
      toast('Vault is locked. Please unlock your vault to access features.', { icon: '🔒', duration: 4000 });
    }
  }, [user, isVaultUnlocked, userLoading, fetchVaultItems, navigate]);

  const handleApiError = (err, defaultMessage) => {
    const message = err.response?.data?.message || err.response?.data?.error || defaultMessage;
    console.error('Dashboard: API error', { defaultMessage, error: err.message, status: err.response?.status });
    if (err.response?.status === 401 && !message.toLowerCase().includes("master key required")) {
      toast.error('Session expired. Please log in again.');
      navigate('/login');
    } else if (err.response?.data?.requireMasterPassword) {
      console.log('Dashboard: Master password required, opening form');
      toast.error('Master Password required for this action.', { duration: 4000 });
      setShowMasterPasswordForm(true);
      setMasterPasswordCallback(() => () => err.config);
    } else {
      toast.error(message);
    }
  };

  const requestMasterPassword = useCallback((callback) => {
    console.log('Dashboard: Requesting master password');
    setShowMasterPasswordForm(true);
    setMasterPasswordCallback(() => callback);
  }, []);

  const handleMasterPasswordSubmit = async (masterPassword) => {
    console.log('Dashboard: Master password submitted');
    setShowMasterPasswordForm(false);
    try {
      if (masterPasswordCallback) {
        const res = await masterPasswordCallback(masterPassword);
        console.log('Dashboard: Master password callback executed', res?.data);
        return res;
      }
    } catch (err) {
      handleApiError(err, 'Failed to process action with master password');
    } finally {
      setMasterPasswordCallback(null);
    }
  };

  if (userLoading) {
    return <div className="loading">Loading user...</div>;
  }
  if (!user) {
    return (
      <div className="not-logged-in">
        Please log in to view your vault.
        <button onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }
  if (!isVaultUnlocked) {
    return (
      <div className="vault-locked-notice">
        <h2>Vault Locked 🔒</h2>
        <p>Please unlock your vault to access your passwords and sharing features.</p>
      </div>
    );
  }
  if (loadingVault && isVaultUnlocked) {
    return <div className="loading">Loading vault items...</div>;
  }

  const handleAddPassword = async (newItem) => {
    console.log('Dashboard: Adding password', newItem);
    try {
      toast.loading('Adding password...', { id: 'add-item' });
      await axios.post('/api/item/create', newItem, { withCredentials: true });
      toast.success('Password added successfully!', { id: 'add-item' });
      fetchVaultItems();
      setShowAddForm(false);
    } catch (error) {
      handleApiError(error, 'Failed to add password');
      toast.dismiss('add-item');
    }
  };

  const handleEdit = (item) => {
    console.log('Dashboard: Editing item', item._id);
    setSelectedItemForAction(item);
    setShowUpdateForm(true);
  };

  const handleUpdate = async (updatedItem) => {
    console.log('Dashboard: Updating item', updatedItem._id);
    try {
      const { _id, domain, username, password } = updatedItem;
      toast.loading('Updating item...', { id: 'update-item' });
      await axios.put(`/api/item/${_id}`, { domain, username, password }, { withCredentials: true });
      toast.success('Item updated successfully!', { id: 'update-item' });
      fetchVaultItems();
      setShowUpdateForm(false);
      setSelectedItemForAction(null);
    } catch (err) {
      handleApiError(err, 'Failed to update item');
      toast.dismiss('update-item');
    }
  };

  const handleDelete = async (item) => {
    console.log('Dashboard: Deleting item', item._id);
    const confirmed = await ConfirmDelete(item);
    if (!confirmed) return;
    try {
      toast.loading('Deleting item...', { id: 'delete-item' });
      await axios.delete(`/api/item/${item._id}`, { withCredentials: true });
      toast.success('Item deleted', { id: 'delete-item' });
      setVaultItems((prev) => prev.filter((i) => i._id !== item._id));
    } catch (err) {
      handleApiError(err, 'Failed to delete item');
      toast.dismiss('delete-item');
    }
  };

  const handleOpenShareForm = (item) => {
    console.log('Dashboard: Opening share form for item', item._id);
    setSelectedItemForAction(item);
    setShowShareForm(true);
  };

  const handleShareSuccess = async ({ item, receiverUsername, shareId }) => {
    console.log(`Dashboard: Share succeeded for ${item.domain} with ${receiverUsername}, shareId: ${shareId}`);
    toast.success(`Successfully shared ${item.domain} with ${receiverUsername}`);
    triggerShareRefresh();
    setShowShareForm(false);
    setSelectedItemForAction(null);
  };

  const filteredItems = vaultItems.filter((item) =>
    item.domain && item.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Welcome, {user.username}'s Vault</h2>

      {/* Vault Actions and Items Table */}
      <div className="vault-section">
        <div className="dashboard-actions">
          <input
            type="text"
            placeholder="🔍 Search your vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button className="add-password-btn" onClick={() => setShowAddForm(true)}>
            ➕ Add Password
          </button>
        </div>
        {filteredItems.length === 0 && !loadingVault ? (
          <p>No items found in your vault. Click "Add Password" to create one.</p>
        ) : (
          <table className="vault-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Username</th>
                <th>Password</th>
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
                      value={item.password || ''}
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
                      title={showPassword[item._id] ? 'Hide password' : 'Show password'}
                    >
                      {showPassword[item._id] ? '👁️ Hide' : '👁️ Show'}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(item)} className="action-btn edit" title="Edit">📝</button>
                    <button onClick={() => handleDelete(item)} className="action-btn delete" title="Delete">🗑️</button>
                    <button onClick={() => handleOpenShareForm(item)} className="action-btn share" title="Share">🔗</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div> {/* End Vault Section */}

      {/* Sharing Section */}
      <div className="sharing-section">
        <h3>Sharing Center</h3>
        <div className="share-lists-wrapper">
          <PendingSharesList onActionCompleted={triggerShareRefresh} requestMasterPassword={requestMasterPassword} />
          <AcceptedSharesList refreshTrigger={shareActionTrigger} requestMasterPassword={requestMasterPassword} />
          <SentSharesList
            refreshTrigger={shareActionTrigger}
            onActionCompleted={triggerShareRefresh}
            requestMasterPassword={requestMasterPassword}
          />
        </div>
      </div>

      {/* Modals */}
      {showAddForm && (
        <AddPasswordForm onAdd={handleAddPassword} onClose={() => setShowAddForm(false)} />
      )}
      {showUpdateForm && selectedItemForAction && (
        <UpdatePasswordForm
          item={selectedItemForAction}
          onUpdate={handleUpdate}
          onClose={() => { setShowUpdateForm(false); setSelectedItemForAction(null); }}
        />
      )}
      {showShareForm && selectedItemForAction && (
        <SharePasswordForm
          item={selectedItemForAction}
          onClose={() => { setShowShareForm(false); setSelectedItemForAction(null); }}
          onShareSuccess={handleShareSuccess}
          requestMasterPassword={requestMasterPassword}
        />
      )}
      {showMasterPasswordForm && (
        <MasterPasswordForm
          title="🔐 Enter Master Password"
          onSubmit={handleMasterPasswordSubmit}
          onClose={() => {
            console.log('Dashboard: Master password form closed');
            setShowMasterPasswordForm(false);
            setMasterPasswordCallback(null);
          }}
        />
      )}
    </div>
  );
}