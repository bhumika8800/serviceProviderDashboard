import type { User } from '../types';

const AUTH_KEY = 'sp_admin_auth';
const USER_KEY = 'sp_admin_user';

export function encodeBasicAuth(email: string, password: string): string {
  const bytes = new TextEncoder().encode(`${email}:${password}`);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function getBasicAuth(): string | null {
  return sessionStorage.getItem(AUTH_KEY);
}

export function getAuthHeader(): string | null {
  const basic = getBasicAuth();
  return basic ? `Basic ${basic}` : null;
}

export function getStoredUser(): User | null {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveSession(basicAuth: string, user: User) {
  sessionStorage.setItem(AUTH_KEY, basicAuth);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(USER_KEY);
}
