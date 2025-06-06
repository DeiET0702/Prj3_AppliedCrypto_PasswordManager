import { useState } from 'react';
import toast from 'react-hot-toast';
import { commonPasswords } from '../commonPasswords';
import '../styles/AddPasswordForm.css';

export default function AddPasswordForm({ onAdd, onClose }) {
    const [formData, setFormData] = useState({
        domain: '',
        username: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // No password check here!
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
                    <input name="password" placeholder="Password" type="password" onChange={handleChange} value={formData.password} />
                    <div className="modal-buttons">
                        <button type="submit" className="add-btn">Add</button>
                        <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
