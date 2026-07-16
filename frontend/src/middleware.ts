import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  authCookieOptions,
} from '@/lib/auth-cookie-config';

import { API_BASE_URL } from '@/lib/branding';

const PUBLIC_API_PREFIXES = ['/api/auth/login', '/api/auth/refresh'];

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

function setAuthCookiesOnResponse(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  response.cookies.set('accessToken', accessToken, {
    ...authCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  response.cookies.set('refreshToken', refreshToken, {
    ...authCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
  return response;
}

async function refreshTokens(refreshToken: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      accessToken: data.data.accessToken as string,
      refreshToken: data.data.refreshToken as string,
    };
  } catch {
    return null;
  }
}

async function verifyAccessToken(accessToken: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

function buildAuthenticatedResponse(
  request: NextRequest,
  auth: { accessToken: string; refreshed: false } | { accessToken: string; refreshed: true; tokens: { accessToken: string; refreshToken: string } }
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-access-token', auth.accessToken);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (auth.refreshed) {
    setAuthCookiesOnResponse(response, auth.tokens.accessToken, auth.tokens.refreshToken);
  }

  return response;
}

async function authenticateRequest(request: NextRequest) {
  let accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  if (accessToken) {
    const valid = await verifyAccessToken(accessToken);
    if (valid) {
      return { accessToken, refreshed: false as const };
    }
  }

  if (!refreshToken) return null;

  const tokens = await refreshTokens(refreshToken);
  if (!tokens) return null;

  return { accessToken: tokens.accessToken, refreshed: true as const, tokens };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/login')) {
    const auth = await authenticateRequest(request);
    if (auth) {
      const url = request.nextUrl.clone();
      url.pathname = '/jobs';
      const response = NextResponse.redirect(url);
      if (auth.refreshed) {
        setAuthCookiesOnResponse(response, auth.tokens.accessToken, auth.tokens.refreshToken);
      }
      return response;
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    const isPublic = PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (isPublic) {
      return NextResponse.next();
    }

    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    return buildAuthenticatedResponse(request, auth);
  }

  const auth = await authenticateRequest(request);
  if (!auth) {
    return redirectToLogin(request);
  }

  return buildAuthenticatedResponse(request, auth);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
