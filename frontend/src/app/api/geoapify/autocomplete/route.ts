import { NextRequest, NextResponse } from 'next/server';

interface GeoapifyResult {
  formatted: string;
  lat: number;
  lon: number;
}

const GEOAPIFY_FALLBACK_KEY = 'dd169350433c40e0b14f33365d5f1927';

function getGeoapifyApiKey(): string {
  const key = process.env.GEOAPIFY_API_KEY?.trim();
  if (key) {
    return key;
  }
  return GEOAPIFY_FALLBACK_KEY;
}

function normalizeGeoapifyResults(data: Record<string, unknown>): GeoapifyResult[] {
  const results = data.results as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(results) && results.length > 0) {
    return results
      .map((item) => {
        const props = item.properties as Record<string, unknown> | undefined;
        const source = props ?? item;
        const formatted = String(source.formatted ?? '');
        const lat = Number(source.lat);
        const lon = Number(source.lon);
        if (!formatted || Number.isNaN(lat) || Number.isNaN(lon)) return null;
        return { formatted, lat, lon };
      })
      .filter((item): item is GeoapifyResult => item !== null);
  }

  const features = data.features as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(features) && features.length > 0) {
    return features
      .map((feature) => {
        const props = feature.properties as Record<string, unknown> | undefined;
        if (!props) return null;
        const formatted = String(props.formatted ?? '');
        const lat = Number(props.lat);
        const lon = Number(props.lon);
        if (!formatted || Number.isNaN(lat) || Number.isNaN(lon)) return null;
        return { formatted, lat, lon };
      })
      .filter((item): item is GeoapifyResult => item !== null);
  }

  return [];
}

/** Proxies Geoapify autocomplete (API key stays server-side). Auth enforced by middleware. */
export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get('text');

  if (!text || text.trim().length < 1) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = getGeoapifyApiKey();

  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
  url.searchParams.set('text', text.trim());
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '8');
  url.searchParams.set('lang', 'en');
  url.searchParams.set('filter', 'countrycode:us');
  url.searchParams.set('apiKey', apiKey);

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' });
    const data = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      const apiMessage =
        (typeof data?.message === 'string' && data.message) ||
        (typeof data?.error === 'string' && data.error) ||
        'Address lookup failed';
      return NextResponse.json({ success: false, message: apiMessage }, { status: res.status });
    }

    return NextResponse.json({ results: normalizeGeoapifyResults(data) });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Address lookup failed. Check your network connection.' },
      { status: 500 },
    );
  }
}
