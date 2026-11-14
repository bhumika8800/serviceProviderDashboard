import { http } from '../lib/api';
import type {
  AdminStats,
  ApiResponse,
  Booking,
  PaginatedResponse,
} from '../types';

export interface AdminBookingParams {
  status?: string;
  page?: number;
  limit?: number;
}

export function getAdminStats() {
  return http.get<ApiResponse<AdminStats>>('/admin/stats');
}

export function listAdminBookings(params: AdminBookingParams = {}) {
  return http.get<PaginatedResponse<Booking>>('/admin/bookings', { params });
}
