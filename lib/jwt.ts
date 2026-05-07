import 'server-only';

const ALG_HEADER = { alg: 'HS256', typ: 'JWT' };
const TEXT_ENCODER = new TextEncoder();
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; 

function base64UrlEncode(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === 'string' ? TEXT_ENCODER.encode(input) : new Uint8Array(input);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    Math.ceil(input.length / 4) * 4,
    '='
  );
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'JWT_SECRET is missing or too short (need >= 16 chars). Set it in env.'
    );
  }
  return secret;
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    TEXT_ENCODER.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, TEXT_ENCODER.encode(message));
  return base64UrlEncode(sig);
}

export interface JwtPayload {
  sub: string; 
  exp?: number;
  iat?: number;
}

export async function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'> & { ttlSeconds?: number }
): Promise<string> {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);
  const ttl = payload.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const claims: JwtPayload = {
    sub: payload.sub,
    iat: now,
    exp: now + ttl,
  };

  const header = base64UrlEncode(JSON.stringify(ALG_HEADER));
  const body = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${header}.${body}`;
  const sig = await hmacSign(signingInput, secret);
  return `${signingInput}.${sig}`;
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return null;
  }

  const [header, body, sig] = parts;
  const expectedSig = await hmacSign(`${header}.${body}`, secret);
  if (!timingSafeEqual(sig, expectedSig)) return null;

  try {
    const payloadJson = new TextDecoder().decode(base64UrlDecode(body));
    const claims = JSON.parse(payloadJson) as JwtPayload;
    if (typeof claims.sub !== 'string' || !claims.sub) return null;
    if (claims.exp && claims.exp * 1000 < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
