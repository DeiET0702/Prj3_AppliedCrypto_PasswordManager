import { useContext, useState } from 'react';
import { UserContext } from '../../context/UserContext.jsx';
import toast from 'react-hot-toast';
import '../styles/Dashboard.css';
import AddPasswordForm from '../components/AddPasswordForm.jsx';
import SharePasswordForm from '../components/SharePasswordForm.jsx';

export default function Dashboard() {
    const { user, loading } = useContext(UserContext);

    const [vaultItems, setVaultItems] = useState([
        {
            id: 1,
            domain: 'example.com',
            username: 'john_doe',
            password: 's3cret123',
            createdAt: '2025-05-28 10:30',
            updatedAt: '2025-05-28 10:30'
        },
        {
            id: 2,
            domain: 'facebook.com',
            username: 'jane_doe',
            password: 'pa55w0rd',
            createdAt: '2025-05-27 14:15',
            updatedAt: '2025-05-27 15:00'
        }
    ]);

    const [showAddForm, setShowAddForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showShareForm, setShowShareForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Loading user, hiển thị Loading
    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    // Nếu chưa đăng nhập, có thể redirect hoặc thông báo
    if (!user) {
        return <div className="not-logged-in">Please log in to view your vault.</div>;
    }

    const handleAddPassword = (newItem) => {
        const now = new Date().toLocaleString();
        const fullItem = {
            ...newItem,
            id: Date.now(),
            createdAt: now,
            updatedAt: now
        };
        setVaultItems(prev => [...prev, fullItem]);
        toast.success('Password added successfully!');
    };

    const handleEdit = (item) => {
        toast('Edit clicked for: ' + item.domain);
    };

    const handleDelete = (id) => {
        setVaultItems(prev => prev.filter(item => item.id !== id));
        toast.success('Item deleted');
    };

    const handleShare = (item) => {
        setSelectedItem(item);
        setShowShareForm(true);
    };

    const handleConfirmShare = ({ item, receiverUsername }) => {
        toast.success(`Shared ${item.domain} with ${receiverUsername}`);
        setShowShareForm(false);
    };

    const filteredItems = vaultItems.filter(item =>
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
                    {filteredItems.map(item => (
                        <tr key={item.id}>
                        <td data-label="Domain">{item.domain}</td>
                        <td data-label="Username">{item.username}</td>
                        <td data-label="Password">
                            <input type="password" value={item.password} readOnly className="password-mask" />
                        </td>
                        <td data-label="Created At">{item.createdAt}</td>
                        <td data-label="Updated At">{item.updatedAt}</td>
                        <td data-label="Actions">
                            <button onClick={() => handleEdit(item)} className="action-btn edit">Edit</button>
                            <button onClick={() => handleDelete(item.id)} className="action-btn delete">Delete</button>
                            <button onClick={() => handleShare(item)} className="action-btn share">Share</button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
            </table>
        </div>
    );
}
