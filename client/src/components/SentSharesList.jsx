import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { mockSharedItems } from '../mockSharedItems';
import '../styles/SharesList.css';

export default function SentSharesList({ username = "linh5" }) {
  const { isVaultUnlocked } = useContext(UserContext);

  // Filter for sent shares for the given user
  const sentShares = mockSharedItems.filter(
    s => s.senderUsername === username
  );

  if (!isVaultUnlocked) {
    return <p className="shares-list-info">Unlock your vault to manage shares you've sent.</p>;
  }
  if (sentShares.length === 0) {
    return <p className="shares-list-info">No sent shares yet.</p>;
  }

  return (
    <div className="shares-list-container sent-shares">
      <h4>Shares You've Sent</h4>
      <ul className="shares-list">
        {sentShares.map(share => (
          <li key={share.shareId} className="share-item">
            <div className="share-item-info">
              <span>To: <strong>{share.receiverUsername}</strong></span>
              <span>Item: <strong>{share.itemDomain}</strong></span>
              <span>Shared: {new Date(share.sharedAt).toLocaleDateString()}</span>
              <span>Status: <strong>{share.status === "accepted" ? "Accepted" : "Pending"}</strong></span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}