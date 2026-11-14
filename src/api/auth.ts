import { http } from '../lib/api';
import type { ApiResponse, User } from '../types';

export function getMe(authHeader?: string) {
  return http.get<ApiResponse<{ user: User }>>(
    '/users/me',
    authHeader
      ? { headers: { Authorization: authHeader } }
      : undefined,
  );
}
