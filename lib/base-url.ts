function clean(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit && explicit.trim().length > 0) {
    return clean(explicit);
  }
  const vercel = process.env.VERCEL_URL;
  if (vercel && vercel.trim().length > 0) {
    const v = vercel.trim();
    return clean(v.startsWith('http') ? v : `https://${v}`);
  }
  return 'http://localhost:3000';
}
