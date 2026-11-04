import io, { Socket } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchApi(endpoint: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cafe_token') : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...(options?.headers || {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cafe_token');
      localStorage.removeItem('cafe_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const err = await res.json().catch(() => ({ message: 'Unauthorized' }));
    throw new Error(err.message || 'Session expired or unauthorized');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorData.message || 'API request failed');
  }

  return res.json();
}

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(API_BASE, {
      transports: ['websocket'],
    });
  }
  return socketInstance;
}
