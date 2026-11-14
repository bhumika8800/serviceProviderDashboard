import axios, { type AxiosRequestConfig } from 'axios';
import { getAuthHeader } from './session';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const authHeader = getAuthHeader();
  if (authHeader && !config.headers.Authorization) {
    config.headers.Authorization = authHeader;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status: number | undefined = error.response?.status;

    if (status === 401 && Boolean(error.config?.headers?.Authorization)) {
      window.dispatchEvent(new Event('sp:unauthorized'));
    }

    if (!error.response) {
      const timedOut =
        error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
      return Promise.reject(
        new ApiError(
          timedOut
            ? 'The server took too long to respond. Please try again.'
            : 'Unable to reach the server. Check that the backend is running.',
          timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
        ),
      );
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';
    const code: string | undefined = error.response?.data?.code;

    return Promise.reject(new ApiError(message, code, status));
  },
);

export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    api.get<unknown, T>(url, config),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.post<unknown, T>(url, data, config),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.patch<unknown, T>(url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    api.delete<unknown, T>(url, config),
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
