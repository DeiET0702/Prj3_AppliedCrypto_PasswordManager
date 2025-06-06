import { mockSharedItems } from '../mockSharedItems';
import '../styles/SharesList.css';

export default function PendingSharesList({ username = "linh5" }) {
  // Filter for pending shares for the given user
  const pendingShares = mockSharedItems.filter(
    s => s.receiverUsername === username && s.status === "pending"
  );

  if (pendingShares.length === 0) {
    return <p className="shares-list-info">No pending shares for you right now.</p>;
  }

  return (
    <div className="shares-list-container pending-shares">
      <h4>Pending Shares (Waiting for Your Action)</h4>
      <ul className="shares-list">
        {pendingShares.map(share => (
          <li key={share.shareId} className="share-item">
            <div className="share-item-info">
              <span>From: <strong>{share.senderUsername}</strong></span>
              <span>Item: <strong>{share.itemDomain}</strong></span>
              <span>Shared: {new Date(share.sharedAt).toLocaleDateString()}</span>
              {share.expiresAt && <span>Expires: {new Date(share.expiresAt).toLocaleString()}</span>}
            </div>
            <div className="share-item-actions">
              <button className="action-btn accept-btn">
                <span role="img" aria-label="accept">✅</span> Accept
              </button>
              <button className="action-btn reject-btn">
                <span role="img" aria-label="reject">❌</span> Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}