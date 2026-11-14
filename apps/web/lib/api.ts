import io, { Socket } from 'socket.io-client';

export function getApiBase(): string {
  // 1. Explicit environment variable set by Vercel or user
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }

  // 2. Client-side browser check: if running on a remote domain (e.g. *.vercel.app), use deployed backend
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://nitsuh-ordering-system-orpin.vercel.app';
  }

  // 3. Server-side production build check
  if (process.env.NODE_ENV === 'production') {
    return 'https://nitsuh-ordering-system-orpin.vercel.app';
  }

  // 4. Local development default
  return 'http://localhost:4000';
}

export const API_BASE = getApiBase();

export async function fetchApi(endpoint: string, options?: RequestInit) {
  const base = getApiBase();
  const token = typeof window !== 'undefined' ? localStorage.getItem('cafe_token') : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...(options?.headers || {}),
  };

  const res = await fetch(`${base}${endpoint}`, {
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
    const base = getApiBase();
    socketInstance = io(base, {
      transports: ['websocket'],
    });
  }
  return socketInstance;
}
