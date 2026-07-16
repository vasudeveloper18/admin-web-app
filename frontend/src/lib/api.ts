import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ApiResponse,
  Job,
  JobsQueryParams,
  PaginatedJobs,
  User,
} from '@/types';

// Client requests go through the Next.js BFF proxy so httpOnly cookies are used
const API_BASE_URL = '/api/proxy';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ─── Response Interceptor: Auto-refresh on 401 ───────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve: () => resolve(apiClient(originalRequest)), reject });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Refresh failed');
        }

        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
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
  login: async (email: string, password: string): Promise<ApiResponse<{ authenticated: boolean }>> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw { response: { data } };
    }
    return data;
  },

  logout: async (): Promise<void> => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
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
    const cleanParams: Record<string, string | number> = {};
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
