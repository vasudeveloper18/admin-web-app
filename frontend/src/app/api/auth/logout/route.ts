import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, getAccessToken } from '@/lib/auth-cookies';

import { API_BASE_URL } from '@/lib/branding';

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
