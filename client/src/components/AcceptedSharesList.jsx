import { mockSharedItems } from '../mockSharedItems';
import '../styles/SharesList.css';

export default function AcceptedSharesList({ username = "linh5" }) {
  // Filter for accepted shares for the given user
  const acceptedItems = mockSharedItems.filter(
    s => s.receiverUsername === username && s.status === "accepted"
  );

  if (acceptedItems.length === 0) {
    return <p className="shares-list-info">No accepted shares for you right now.</p>;
  }

  return (
    <div className="shares-list-container accepted-shares">
      <h4>Items Shared With You (Accepted)</h4>
      <ul className="shares-list">
        {acceptedItems.map(item => (
          <li key={item.shareId} className="share-item">
            <div className="share-item-info">
              <span>From: <strong>{item.senderUsername}</strong></span>
              <span>Item: <strong>{item.itemDomain}</strong></span>
              <span>Shared: {new Date(item.sharedAt).toLocaleDateString()}</span>
              <span>Accepted: {item.acceptedAt ? new Date(item.acceptedAt).toLocaleString() : ''}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}