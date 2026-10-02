import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5179/api';

/**
 * Standard backend response envelope.
 */
export interface ApiResponse<T = unknown> {
  statusCode?: number;
  messageCode?: string;
  message: string;
  isSuccess: boolean;
  success?: boolean;
  data?: T;
  [key: string]: unknown;
}

/**
 * Pre-configured Axios instance for the entire frontend application.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: inject token, trace ID, or log in dev mode
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // If auth token exists in localStorage, attach to header
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Response interceptor: global response handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error)
);

/**
 * Extracts a user-friendly error message from Axios errors or backend response payload.
 */
export function extractErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (data?.message && typeof data.message === 'string') {
      return data.message;
    }
    if (data?.title && typeof data.title === 'string') {
      return data.title;
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please check your connection and try again.';
    }
    if (!error.response) {
      return `Backend server is currently offline or unreachable on ${API_BASE_URL}.`;
    }
  } else if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
}

export default apiClient;
