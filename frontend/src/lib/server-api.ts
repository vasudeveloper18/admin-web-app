import { cookies } from 'next/headers';

import { ApiResponse, Job, JobsQueryParams, PaginatedJobs } from '@/types';

import {

  ACCESS_TOKEN_MAX_AGE,

  REFRESH_TOKEN_MAX_AGE,

  authCookieOptions,

} from '@/lib/auth-cookie-config';



const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';



export class ServerApiError extends Error {

  constructor(

    message: string,

    public status: number

  ) {

    super(message);

    this.name = 'ServerApiError';

  }

}



async function refreshAccessToken(): Promise<string | null> {

  const cookieStore = await cookies();

  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) return null;



  try {

    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ refreshToken }),

      cache: 'no-store',

    });



    if (!res.ok) return null;



    const data = await res.json();

    const { accessToken, refreshToken: newRefreshToken } = data.data;



    cookieStore.set('accessToken', accessToken, {

      ...authCookieOptions,

      maxAge: ACCESS_TOKEN_MAX_AGE,

    });

    cookieStore.set('refreshToken', newRefreshToken, {

      ...authCookieOptions,

      maxAge: REFRESH_TOKEN_MAX_AGE,

    });



    return accessToken as string;

  } catch {

    return null;

  }

}



async function serverFetch<T>(path: string, init?: RequestInit, retried = false): Promise<T> {

  const cookieStore = await cookies();

  let accessToken = cookieStore.get('accessToken')?.value;



  const headers: Record<string, string> = {

    'Content-Type': 'application/json',

    ...(init?.headers as Record<string, string>),

  };



  if (accessToken) {

    headers.Authorization = `Bearer ${accessToken}`;

  }



  const res = await fetch(`${API_BASE_URL}${path}`, {

    ...init,

    headers,

    cache: 'no-store',

  });



  if (res.status === 401 && !retried) {

    const newToken = await refreshAccessToken();

    if (newToken) {

      return serverFetch<T>(path, init, true);

    }

  }



  if (!res.ok) {

    const body = await res.json().catch(() => ({}));

    throw new ServerApiError(

      body?.message || `Request failed with status ${res.status}`,

      res.status

    );

  }



  return res.json();

}



export async function fetchJobs(params: JobsQueryParams): Promise<PaginatedJobs> {

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {

    if (value !== undefined && value !== '' && value !== null) {

      searchParams.set(key, String(value));

    }

  });



  const res = await serverFetch<ApiResponse<PaginatedJobs>>(

    `/jobs?${searchParams.toString()}`

  );

  return res.data;

}



export async function fetchJob(id: string): Promise<Job> {

  const res = await serverFetch<ApiResponse<Job>>(`/jobs/${id}`);

  return res.data;

}



export async function fetchMe() {

  const res = await serverFetch<ApiResponse<import('@/types').User>>('/me');

  return res.data;

}


