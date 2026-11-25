// server/presence.js
// Centralized in-memory presence tracking for active users & students

export const activeHeartbeats = new Map();

// 35 seconds window for active heartbeat (client pings every 15s)
const PRESENCE_TIMEOUT_MS = 35000;

export function markUserActive(userId) {
  if (!userId) return;
  activeHeartbeats.set(userId, Date.now());
}

export function markUserOffline(userId) {
  if (!userId) return;
  activeHeartbeats.delete(userId);
}

export function isUserOnline(userId) {
  if (!userId) return false;
  const lastPing = activeHeartbeats.get(userId);
  if (!lastPing) return false;
  if (Date.now() - lastPing < PRESENCE_TIMEOUT_MS) {
    return true;
  }
  activeHeartbeats.delete(userId);
  return false;
}

export function getOnlineUserIds() {
  const now = Date.now();
  const onlineIds = [];
  for (const [userId, lastPing] of activeHeartbeats.entries()) {
    if (now - lastPing < PRESENCE_TIMEOUT_MS) {
      onlineIds.push(userId);
    } else {
      activeHeartbeats.delete(userId);
    }
  }
  return onlineIds;
}
