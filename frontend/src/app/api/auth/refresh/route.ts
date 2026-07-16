import { NextRequest, NextResponse } from 'next/server';
import { getRefreshToken, setAuthCookies } from '@/lib/auth-cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(_request: NextRequest) {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, message: 'No refresh token available' },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const { accessToken, refreshToken: newRefreshToken } = data.data;
    await setAuthCookies(accessToken, newRefreshToken);

    return NextResponse.json({
      success: true,
      message: data.message,
      data: { refreshed: true },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Token refresh failed' },
      { status: 500 }
    );
  }
}
