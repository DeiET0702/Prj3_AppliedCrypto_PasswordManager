export const mockSharedItems = [
  // Sent by linh2 to linh4 (pending)
  {
    shareId: "mock1",
    itemDomain: "github.com",
    senderUsername: "linh2",
    receiverUsername: "linh4",
    status: "pending",
    sharedAt: "2025-05-25T10:00:00Z",
    expiresAt: "2025-05-26T10:00:00Z",
    acceptedAt: null,
    accepted: false
  },
  // Sent by linh4 to linh5 (accepted)
  {
    shareId: "mock2",
    itemDomain: "gmail.com",
    senderUsername: "linh4",
    receiverUsername: "linh5",
    status: "accepted",
    sharedAt: "2025-05-20T09:30:00Z",
    expiresAt: "2025-05-21T09:30:00Z",
    acceptedAt: "2025-05-20T12:00:00Z",
    accepted: true
  },
  // Sent by linh5 to linh2 (pending)
  {
    shareId: "mock3",
    itemDomain: "facebook.com",
    senderUsername: "linh5",
    receiverUsername: "linh2",
    status: "pending",
    sharedAt: "2025-05-28T15:45:00Z",
    expiresAt: "2025-05-29T15:45:00Z",
    acceptedAt: null,
    accepted: false
  },
  // Sent by linh2 to linh5 (accepted)
  {
    shareId: "mock4",
    itemDomain: "twitter.com",
    senderUsername: "linh2",
    receiverUsername: "linh5",
    status: "accepted",
    sharedAt: "2025-05-18T08:00:00Z",
    expiresAt: "2025-05-19T08:00:00Z",
    acceptedAt: "2025-05-18T10:00:00Z",
    accepted: true
  },
  // Sent by linh4 to linh2 (pending)
  {
    shareId: "mock5",
    itemDomain: "linkedin.com",
    senderUsername: "linh4",
    receiverUsername: "linh2",
    status: "pending",
    sharedAt: "2025-05-29T11:20:00Z",
    expiresAt: "2025-05-30T11:20:00Z",
    acceptedAt: null,
    accepted: false
  }
];