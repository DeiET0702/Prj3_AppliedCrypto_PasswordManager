import { useContext, useState } from 'react';
import { UserContext } from '../../context/UserContext.jsx';
import toast from 'react-hot-toast';
import '../styles/Dashboard.css';
import AddPasswordForm from '../components/AddPasswordForm.jsx';

export default function Dashboard() {
    const { user } = useContext(UserContext);

    const [vaultItems, setVaultItems] = useState([
        {
            id: 1,
            domain: 'example.com',
            username: 'john_doe',
            password: 's3cret123'
        },
        {
            id: 2,
            domain: 'facebook.com',
            username: 'jane_doe',
            password: 'pa55w0rd'
        }
    ]);

    const [showAddForm, setShowAddForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleAddPassword = (newItem) => {
        setVaultItems(prev => [...prev, newItem]);
    };

    const handleEdit = (item) => {
        toast('Edit clicked for: ' + item.domain);
    };

    const handleDelete = (id) => {
        setVaultItems(prev => prev.filter(item => item.id !== id));
        toast.success('Item deleted');
    };

    const handleShare = (item) => {
        toast('Share clicked for: ' + item.domain);
    };

    // Lọc theo từ khóa tìm kiếm
    const filteredItems = vaultItems.filter(item =>
        item.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="dashboard-container">
            <h2 className="dashboard-title">Welcome, {user?.username}'s Vault</h2>

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
                    {filteredItems.map(item => (
                        <tr key={item.id}>
                            <td>{item.domain}</td>
                            <td>{item.username}</td>
                            <td>
                                <input
                                    type="password"
                                    value={item.password}
                                    readOnly
                                    className="password-mask"
                                />
                            </td>
                            <td>
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
