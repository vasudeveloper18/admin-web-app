import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies } from '@/lib/auth-cookies';
import { API_BASE_URL } from '@/lib/branding';

function getRoleFromAccessToken(accessToken: string): string | null {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof decoded.role === 'string' ? decoded.role : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot reach the API server. Please ensure the backend is running on port 3001.',
        },
        { status: 503 }
      );
    }

    const data = await res.json().catch(() => ({
      success: false,
      message: 'Invalid response from authentication server.',
    }));

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const { accessToken, refreshToken } = data.data;

    const tokenRole = getRoleFromAccessToken(accessToken);
    if (tokenRole !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only admin accounts can sign in to this panel.',
        },
        { status: 403 }
      );
    }

    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({
      success: true,
      message: data.message,
      data: { authenticated: true },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred during login.' },
      { status: 500 }
    );
  }
}
