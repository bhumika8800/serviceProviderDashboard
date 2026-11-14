import { http } from '../lib/api';
import type {
  ApiResponse,
  Category,
  PaginatedResponse,
  Service,
  ServiceInput,
} from '../types';

export interface ListServicesParams {
  q?: string;
  categoryId?: string;
  tag?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

export function listCategories(includeInactive = false) {
  return http.get<ApiResponse<Category[]>>('/categories', {
    params: includeInactive ? { includeInactive: true } : undefined,
  });
}

export function createCategory(name: string, parentId?: string | null) {
  return http.post<ApiResponse<Category>>('/categories', {
    name,
    ...(parentId ? { parentId } : {}),
  });
}

export function listServices(params: ListServicesParams = {}) {
  return http.get<PaginatedResponse<Service>>('/services', { params });
}

export function createService(input: ServiceInput) {
  return http.post<ApiResponse<Service>>('/services', input);
}

export function updateService(id: string, input: Partial<ServiceInput>) {
  return http.patch<ApiResponse<Service>>(`/services/${id}`, input);
}

export function deactivateService(id: string) {
  return http.delete<ApiResponse<Service>>(`/services/${id}`);
}
