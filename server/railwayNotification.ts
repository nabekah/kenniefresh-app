/**
 * Railway-compatible notification module.
 * Replaces Manus notifyOwner with in-app notifications stored in memory.
 * Notifications are accessible via tRPC and shown in the bell dropdown.
 */

export type AppNotification = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  read: boolean;
};

// In-memory notification store (resets on server restart — fine for Railway)
const notifications: AppNotification[] = [];
const MAX_NOTIFICATIONS = 100;

/**
 * Add a notification. Mirrors the Manus notifyOwner API signature.
 * Returns true on success (always succeeds for in-app notifications).
 */
export async function notifyOwner(payload: {
  title: string;
  content: string;
}): Promise<boolean> {
  const notification: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    title: payload.title,
    content: payload.content,
    createdAt: new Date(),
    read: false,
  };

  notifications.unshift(notification);

  // Keep only the most recent notifications
  if (notifications.length > MAX_NOTIFICATIONS) {
    notifications.splice(MAX_NOTIFICATIONS);
  }

  console.log(`[Notification] ${payload.title}`);
  return true;
}

export function getNotifications(): AppNotification[] {
  return [...notifications];
}

export function markAllRead(): void {
  notifications.forEach((n) => (n.read = true));
}

export function markRead(id: string): void {
  const notif = notifications.find((n) => n.id === id);
  if (notif) notif.read = true;
}

export function getUnreadCount(): number {
  return notifications.filter((n) => !n.read).length;
}
