import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, getAccessToken } from '@/lib/auth-cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(_request: NextRequest) {
  const accessToken = await getAccessToken();

  if (accessToken) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      // Best-effort logout on backend
    }
  }

  await clearAuthCookies();

  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
}
