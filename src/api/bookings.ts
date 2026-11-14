import { http } from '../lib/api';
import type {
  ApiResponse,
  Booking,
  CreateBookingInput,
} from '../types';

export function createBooking(input: CreateBookingInput) {
  return http.post<ApiResponse<Booking>>('/bookings', input);
}

export function updateBookingStatus(id: string, status: string) {
  return http.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, { status });
}

export function cancelBooking(id: string) {
  return http.patch<ApiResponse<Booking>>(`/bookings/${id}/cancel`);
}
