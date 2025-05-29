import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext.jsx';
import toast from 'react-hot-toast';
import axios from 'axios';
import '../styles/Dashboard.css';
import AddPasswordForm from '../components/AddPasswordForm.jsx';
import SharePasswordForm from '../components/SharePasswordForm.jsx';

export default function Dashboard() {
    const { user, loading } = useContext(UserContext);
    const [vaultItems, setVaultItems] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showShareForm, setShowShareForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loadingVault, setLoadingVault] = useState(true);

    useEffect(() => {
        const fetchVault = async () => {
            try {
                const res = await axios.get('api/item/allItems', {
                    withCredentials: true,
                });
                setVaultItems(res.data);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load vault items');
            } finally {
                setLoadingVault(false);
            }
        };

        if (user) fetchVault();
    }, [user]);

    if (loading || loadingVault) {
        return <div className="loading">Loading...</div>;
    }

    if (!user) {
        return <div className="not-logged-in">Please log in to view your vault.</div>;
    }

    const handleAddPassword = async (newItem) => {
        try {
            const res = await axios.post('api/item/create', newItem, {
                withCredentials: true,
            });

            toast.success('Password added successfully!');
            // Refetch vault to get updated data
            const updated = await axios.get('/api/item/allItems', {
                withCredentials: true,
            });
            setVaultItems(updated.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to add password');
        }
    };

    const handleEdit = async (updatedItem) => {
        try {
            const res = await axios.put(
                `/api/item/${updatedItem._id}`,
                updatedItem,
                { withCredentials: true }
            );
            toast.success('Item updated successfully!');
            const updated = await axios.get('http://localhost:8000/api/item/allItems', {
                withCredentials: true,
            });
            setVaultItems(updated.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to update item');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/item/${id}`, {
                withCredentials: true,
            });
            setVaultItems((prev) => prev.filter((item) => item._id !== id));
            toast.success('Item deleted');
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete item');
        }
    };

    const handleShare = (item) => {
        setSelectedItem(item);
        setShowShareForm(true);
    };

    const handleConfirmShare = ({ item, receiverUsername }) => {
        toast.success(`Shared ${item.domain} with ${receiverUsername}`);
        setShowShareForm(false);
    };

    const filteredItems = vaultItems.filter((item) =>
        item.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

            {showShareForm && selectedItem && (
                <SharePasswordForm
                    item={selectedItem}
                    onClose={() => setShowShareForm(false)}
                    onShare={handleConfirmShare}
                />
            )}

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
                            <td data-label="Domain">{item.domain}</td>
                            <td data-label="Username">{item.username}</td>
                            <td data-label="Password">
                                <input
                                    type="password"
                                    value={item.password}
                                    readOnly
                                    className="password-mask"
                                />
                            </td>
                            <td data-label="Created At">{new Date(item.createdAt).toLocaleString()}</td>
                            <td data-label="Updated At">{new Date(item.updatedAt).toLocaleString()}</td>
                            <td data-label="Actions">
                                <button onClick={() => handleEdit(item)} className="action-btn edit">
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(item._id)}
                                    className="action-btn delete"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => handleShare(item)}
                                    className="action-btn share"
                                >
                                    Share
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
