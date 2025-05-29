import { useState } from 'react';
import '../styles/SharePasswordForm.css';

export default function SharePasswordForm({ onShare, onClose, item }) {
    const [receiverUsername, setReceiverUsername] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!receiverUsername) {
            alert('Please enter a username.');
            return;
        }

        onShare({
            item,
            receiverUsername
        });

        onClose();
    };

    return (
        <div className="share-form-overlay">
            <div className="share-form-modal">
                <h3>🔐 Share Password for: <i>{item.domain}</i></h3>
                <form onSubmit={handleSubmit}>
                    <label>
                        Recipient Username:
                        <input
                            type="text"
                            value={receiverUsername}
                            onChange={(e) => setReceiverUsername(e.target.value)}
                            required
                        />
                    </label>
                    <div className="share-form-buttons">
                        <button type="submit">Share</button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
