import { playReadyChime, playSlipChime, playKitchenChime } from './audio';

export type NotificationType =
  | 'ORDER_CREATED'
  | 'ORDER_READY'
  | 'WAITER_NOTE'
  | 'STATUS_UPDATE'
  | 'STOCK_ALERT'
  | 'TRANSFER_ALERT';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  url?: string;
  orderNumber?: string;
  tableNumber?: string;
  timestamp: number;
  read: boolean;
}

const STORAGE_KEY = 'nitsuh_notifications_history';
const MAX_NOTIFICATIONS = 40;

export function getStoredNotifications(): NotificationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredNotifications(list: NotificationItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_NOTIFICATIONS)));
  } catch (e) {}
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    return 'denied';
  }
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export function dispatchNotification(
  input: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>
): NotificationItem {
  const item: NotificationItem = {
    ...input,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    read: false,
  };

  // 1. Persist to local history
  const current = getStoredNotifications();
  const updated = [item, ...current.filter((n) => n.id !== item.id)].slice(0, MAX_NOTIFICATIONS);
  saveStoredNotifications(updated);

  // 2. Audible chime based on alert category
  if (item.type === 'ORDER_READY') {
    playReadyChime();
  } else if (item.type === 'WAITER_NOTE') {
    playSlipChime();
  } else if (item.type === 'ORDER_CREATED' || item.type === 'STATUS_UPDATE') {
    playKitchenChime();
  }

  // 3. System Web Push / OS Notification if permitted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(item.title, {
            body: item.message,
            icon: '/nitsuh-logo-circular.png',
            badge: '/nitsuh-logo.png',
            data: { url: item.url || '/' },
          });
        });
      } else {
        new Notification(item.title, {
          body: item.message,
          icon: '/nitsuh-logo-circular.png',
        });
      }
    } catch (e) {}
  }

  // 4. In-App Realtime Toast event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('nitsuh_inapp_notification', {
        detail: item,
      })
    );
  }

  return item;
}

export function markNotificationRead(id: string): void {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveStoredNotifications(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nitsuh_notifications_updated'));
  }
}

export function markAllNotificationsRead(): void {
  const current = getStoredNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveStoredNotifications(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nitsuh_notifications_updated'));
  }
}

export function clearAllNotifications(): void {
  saveStoredNotifications([]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nitsuh_notifications_updated'));
  }
}
