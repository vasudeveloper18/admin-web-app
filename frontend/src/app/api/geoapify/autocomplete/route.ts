import { NextRequest, NextResponse } from 'next/server';

import { getAccessToken } from '@/lib/auth-cookies';



const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;



export async function GET(request: NextRequest) {

  const accessToken = await getAccessToken();

  if (!accessToken) {

    return NextResponse.json(

      { success: false, message: 'Unauthorized' },

      { status: 401 }

    );

  }



  const text = request.nextUrl.searchParams.get('text');



  if (!text || text.trim().length < 3) {

    return NextResponse.json({ results: [] });

  }



  if (!GEOAPIFY_API_KEY) {

    return NextResponse.json(

      { success: false, message: 'Geoapify API key is not configured' },

      { status: 500 }

    );

  }



  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');

  url.searchParams.set('text', text.trim());

  url.searchParams.set('format', 'json');

  url.searchParams.set('limit', '5');

  url.searchParams.set('apiKey', GEOAPIFY_API_KEY);



  try {

    const res = await fetch(url.toString(), { cache: 'no-store' });

    const data = await res.json();



    if (!res.ok) {

      return NextResponse.json(

        { success: false, message: 'Address lookup failed' },

        { status: res.status }

      );

    }



    return NextResponse.json(data);

  } catch {

    return NextResponse.json(

      { success: false, message: 'Address lookup failed' },

      { status: 500 }

    );

  }

}

