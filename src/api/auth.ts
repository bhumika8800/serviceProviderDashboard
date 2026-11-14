import { http } from '../lib/api';
import type { ApiResponse, AuthPayload, User } from '../types';

export function verifyFirebaseToken(idToken: string) {
  return http.post<ApiResponse<AuthPayload>>('/auth/verify', { idToken });
}

export function getMe(token?: string) {
  return http.get<ApiResponse<{ user: User }>>(
    '/users/me',
    token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined,
  );
}
