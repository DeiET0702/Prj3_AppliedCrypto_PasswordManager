import { useState } from 'react';
import toast from 'react-hot-toast';
import { commonPasswords } from '../commonPasswords';
import '../styles/AddPasswordForm.css';

function generateStrongPassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.<>?';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, x => charset[x % charset.length]).join('');
}

export default function AddPasswordForm({ onAdd, onClose }) {
    const [formData, setFormData] = useState({
        domain: '',
        username: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSuggestPassword = () => {
        const password = generateStrongPassword();
        setFormData(prev => ({ ...prev, password }));
        toast.success('Strong password generated!');
    };

    const handleCopyPassword = () => {
        if (!formData.password) {
            toast.error('Nothing to copy!');
            return;
        }
        navigator.clipboard.writeText(formData.password)
            .then(() => toast.success('Password copied!'))
            .catch(() => toast.error('Failed to copy!'));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const { domain, username, password } = formData;
        if (!domain || !username || !password) {
            toast.error('Please fill in all fields');
            return;
        }
        if (password.length < 8) {
            toast.error('Password should be at least 8 characters long.');
            return;
        }
        if (commonPasswords.includes(password)) {
            toast.error('This password is in top 2000 most common. Please choose a stronger one.');
            return;
        }

        onAdd({ ...formData, id: Date.now() });
        onClose();
        toast.success('Password added');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Add New Password</h3>
                <form onSubmit={handleSubmit} className="add-form">
                    <input name="domain" placeholder="Domain" onChange={handleChange} value={formData.domain} />
                    <input name="username" placeholder="Username" onChange={handleChange} value={formData.username} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            name="password"
                            placeholder="Password"
                            type="password"
                            onChange={handleChange}
                            value={formData.password}
                            style={{ flex: 1 }}
                        />
                        <button
                            type="button"
                            className="suggest-btn"
                            title="Suggest strong password"
                            onClick={handleSuggestPassword}
                            style={{
                                background: '#43e97b',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                color: '#1b3c2e'
                            }}
                        >
                            💡
                        </button>
                        <button
                            type="button"
                            className="copy-btn"
                            title="Copy password"
                            onClick={handleCopyPassword}
                            style={{
                                background: '#e0e0e0',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                color: '#333'
                            }}
                        >
                            📋
                        </button>
                    </div>
                    <div className="modal-buttons">
                        <button type="submit" className="add-btn">Add</button>
                        <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
