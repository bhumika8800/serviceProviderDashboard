export type UserRole = 'customer' | 'provider' | 'admin';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Address {
  id: string;
  label: 'home' | 'work' | 'other';
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

export interface User {
  id: string;
  firebaseUid?: string;
  phone?: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  addresses?: Address[];
  isActive: boolean;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface Booking {
  id: string;
  userId: string;
  serviceSnapshot: {
    serviceId: string;
    name: string;
    price: number;
  };
  addressSnapshot: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    lat?: number;
    lng?: number;
  };
  bookingDate: string;
  totalAmount: number;
  status: BookingStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  durationMins: number;
  images: string[];
  tags: string[];
  avgRating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  isActive: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalServices: number;
  bookingsByStatus: Record<string, number>;
  totalRevenue: number;
  openComplaints: number;
  openQueries: number;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface CreateBookingInput {
  serviceId: string;
  addressId: string;
  bookingDate: string;
  quantity?: number;
}

export interface AddAddressInput {
  label?: 'home' | 'work' | 'other';
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  isDefault?: boolean;
}

export interface ServiceInput {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  durationMins: number;
  images?: string[];
  tags?: string[];
  isActive?: boolean;
}
