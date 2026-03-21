import { createHmac, timingSafeEqual } from 'crypto';

/** Protocol version baked into the HMAC message (bump if payload shape changes). */
const SIGNING_VERSION = 1;

/**
 * Canonical string signed with HMAC-SHA256 (server secret).
 * Format: `version|chapter_id|issued_at_unix_sec`
 */
export function buildChapterCheckInSigningString(
  chapterId: string,
  issuedAtUnixSec: number
): string {
  return `${SIGNING_VERSION}|${chapterId}|${issuedAtUnixSec}`;
}

export function signChapterCheckInToken(
  chapterId: string,
  issuedAtUnixSec: number,
  secret: string
): string {
  const h = createHmac('sha256', secret);
  h.update(buildChapterCheckInSigningString(chapterId, issuedAtUnixSec));
  return h.digest('hex');
}

/**
 * Compact JSON placed in chapter check-in QR codes.
 * `c` = chapter UUID, `i` = issued-at (unix seconds), `s` = hex HMAC.
 */
export interface ChapterCheckInQrPayload {
  c: string;
  i: number;
  s: string;
}

export function createChapterCheckInQrPayload(
  chapterId: string,
  secret: string
): ChapterCheckInQrPayload {
  const i = Math.floor(Date.now() / 1000);
  const s = signChapterCheckInToken(chapterId, i, secret);
  return { c: chapterId, i, s };
}

/** String to embed in QRCodeSVG `value` (single-line JSON). */
export function serializeChapterCheckInQrPayload(
  payload: ChapterCheckInQrPayload
): string {
  return JSON.stringify(payload);
}

export function parseChapterCheckInQrPayload(
  raw: string
): ChapterCheckInQrPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== 'object' || o === null) return null;
    const rec = o as Record<string, unknown>;
    const c = rec.c;
    const i = rec.i;
    const s = rec.s;
    if (typeof c !== 'string' || typeof i !== 'number' || typeof s !== 'string') {
      return null;
    }
    if (!c || !Number.isFinite(i) || !s) return null;
    return { c, i, s };
  } catch {
    return null;
  }
}

/**
 * Verify HMAC and optional max age (seconds since issue).
 */
export function verifyChapterCheckInPayload(
  payload: ChapterCheckInQrPayload,
  secret: string,
  maxAgeSec?: number
): boolean {
  if (!payload.c || !payload.i || !payload.s) return false;
  if (maxAgeSec != null) {
    const now = Math.floor(Date.now() / 1000);
    if (now - payload.i > maxAgeSec) return false;
  }
  const expected = signChapterCheckInToken(payload.c, payload.i, secret);
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(payload.s, 'hex'));
  } catch {
    return false;
  }
}
