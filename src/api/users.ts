import { http } from '../lib/api';
import type { AddAddressInput, ApiResponse, User } from '../types';

export function addAddress(input: AddAddressInput) {
  return http.post<ApiResponse<{ user: User }>>('/users/me/addresses', input);
}
