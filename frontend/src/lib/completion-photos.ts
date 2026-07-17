/** Absolute URL for completion photos on the job-details page. */
export function resolveCompletionPhotoUrl(photo: string): string {
  if (!photo) {
    return photo;
  }

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001').replace(
    /\/$/,
    '',
  );

  if (photo.startsWith('/uploads/')) {
    return `${apiBase}${photo}`;
  }

  try {
    const parsed = new URL(photo);
    if (!parsed.pathname.startsWith('/uploads/files/')) {
      return photo;
    }

    const isLocalHost =
      parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';

    if (isLocalHost) {
      return `${apiBase}${parsed.pathname}`;
    }

    // API already returned a public URL (e.g. Render) — do not replace the host
    return photo;
  } catch {
    return photo;
  }
}

/** Drop empty entries before rendering the gallery. */
export function getDisplayCompletionPhotos(photos: string[] | undefined | null): string[] {
  if (!photos?.length) {
    return [];
  }
  return photos.map((p) => p?.trim()).filter((p): p is string => Boolean(p));
}
