import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ApiResponse,
  AuthTokens,
  Job,
  JobsQueryParams,
  PaginatedJobs,
  User,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Axios Instance ────────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ─── Token helpers (for client-side usage) ────────────────────────────────────

export const getAccessToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

export const getRefreshToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)refreshToken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

export const setTokenCookies = (accessToken: string, refreshToken: string) => {
  const accessExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  document.cookie = `accessToken=${encodeURIComponent(accessToken)}; path=/; expires=${accessExpiry.toUTCString()}; SameSite=Lax`;
  document.cookie = `refreshToken=${encodeURIComponent(refreshToken)}; path=/; expires=${refreshExpiry.toUTCString()}; SameSite=Lax`;
};

export const clearTokenCookies = () => {
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

// ─── Request Interceptor: Attach Access Token ─────────────────────────────────

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor: Auto-refresh on 401 ───────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokenCookies();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post<ApiResponse<AuthTokens>>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        setTokenCookies(accessToken, newRefreshToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokenCookies();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthTokens>> => {
    const res = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login', { email, password });
    return res.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<AuthTokens>> => {
    const res = await apiClient.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken });
    return res.data;
  },
};

// ─── Users API ────────────────────────────────────────────────────────────────

export const usersApi = {
  getMe: async (): Promise<ApiResponse<User>> => {
    const res = await apiClient.get<ApiResponse<User>>('/me');
    return res.data;
  },

  getTechnicians: async (): Promise<ApiResponse<User[]>> => {
    const res = await apiClient.get<ApiResponse<User[]>>('/technicians');
    return res.data;
  },
};

// ─── Jobs API ────────────────────────────────────────────────────────────────

export const jobsApi = {
  getJobs: async (params: JobsQueryParams): Promise<ApiResponse<PaginatedJobs>> => {
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) cleanParams[k] = v;
    });
    const res = await apiClient.get<ApiResponse<PaginatedJobs>>('/jobs', { params: cleanParams });
    return res.data;
  },

  getJob: async (id: string): Promise<ApiResponse<Job>> => {
    const res = await apiClient.get<ApiResponse<Job>>(`/jobs/${id}`);
    return res.data;
  },

  createJob: async (data: {
    title: string;
    description?: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    address: string;
    latitude: number;
    longitude: number;
    scheduledDate: string;
  }): Promise<ApiResponse<Job>> => {
    const res = await apiClient.post<ApiResponse<Job>>('/jobs', data);
    return res.data;
  },

  assignTechnician: async (jobId: string, technicianId: string): Promise<ApiResponse<Job>> => {
    const res = await apiClient.patch<ApiResponse<Job>>(`/jobs/${jobId}/assign`, { technicianId });
    return res.data;
  },

  unassignTechnician: async (jobId: string): Promise<ApiResponse<Job>> => {
    const res = await apiClient.patch<ApiResponse<Job>>(`/jobs/${jobId}/unassign`);
    return res.data;
  },

  cancelJob: async (jobId: string, reason: string): Promise<ApiResponse<Job>> => {
    const res = await apiClient.patch<ApiResponse<Job>>(`/jobs/${jobId}/cancel`, { reason });
    return res.data;
  },
};
