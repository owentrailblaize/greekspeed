import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Protocol version baked into the HMAC message (bump if payload shape changes).
 * Distinct from chapter in-app QR (`checkInQrToken.ts` uses version 1).
 */
const SIGNING_VERSION = 2;

/**
 * Canonical string signed with HMAC-SHA256 (server secret).
 * Format: `version|event_id|chapter_id|issued_at_unix_sec`
 */
export function buildEventCheckInUrlSigningString(
  eventId: string,
  chapterId: string,
  issuedAtUnixSec: number
): string {
  return `${SIGNING_VERSION}|${eventId}|${chapterId}|${issuedAtUnixSec}`;
}

export function signEventCheckInUrlToken(
  eventId: string,
  chapterId: string,
  issuedAtUnixSec: number,
  secret: string
): string {
  const h = createHmac('sha256', secret);
  h.update(buildEventCheckInUrlSigningString(eventId, chapterId, issuedAtUnixSec));
  return h.digest('hex');
}

/**
 * Payload embedded in check-in URL query param `t` (after base64url encoding).
 * `e` = event UUID, `c` = chapter UUID, `i` = issued-at (unix seconds), `s` = hex HMAC.
 */
export interface EventCheckInUrlPayload {
  e: string;
  c: string;
  i: number;
  s: string;
}

export function createEventCheckInUrlPayload(
  eventId: string,
  chapterId: string,
  secret: string
): EventCheckInUrlPayload {
  const i = Math.floor(Date.now() / 1000);
  const s = signEventCheckInUrlToken(eventId, chapterId, i, secret);
  return { e: eventId, c: chapterId, i, s };
}

/**
 * Single URL-safe token for `?t=` (base64url of JSON; no padding).
 */
export function serializeEventCheckInUrlToken(payload: EventCheckInUrlPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json, 'utf8').toString('base64url');
}

export function parseEventCheckInUrlToken(raw: string): EventCheckInUrlPayload | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const json = Buffer.from(trimmed, 'base64url').toString('utf8');
    const o = JSON.parse(json) as unknown;
    if (typeof o !== 'object' || o === null) return null;
    const rec = o as Record<string, unknown>;
    const e = rec.e;
    const c = rec.c;
    const i = rec.i;
    const s = rec.s;
    if (
      typeof e !== 'string' ||
      typeof c !== 'string' ||
      typeof i !== 'number' ||
      typeof s !== 'string'
    ) {
      return null;
    }
    if (!e || !c || !Number.isFinite(i) || !s) return null;
    return { e, c, i, s };
  } catch {
    return null;
  }
}

/**
 * Verify HMAC and optional max age (seconds since issue).
 *
 * Callers typically pass `maxAgeSec` from `CHECK_IN_QR_MAX_AGE_SEC` or
 * `EVENT_CHECK_IN_URL_MAX_AGE_SEC` (see env docs). Omit to skip TTL checks.
 */
export function verifyEventCheckInUrlPayload(
  payload: EventCheckInUrlPayload,
  secret: string,
  maxAgeSec?: number
): boolean {
  if (!payload.e || !payload.c || !payload.i || !payload.s) return false;
  if (maxAgeSec != null) {
    const now = Math.floor(Date.now() / 1000);
    if (now - payload.i > maxAgeSec) return false;
  }
  const expected = signEventCheckInUrlToken(payload.e, payload.c, payload.i, secret);
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(payload.s, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Decode `t`, then verify signature and optional TTL. Does not assert event/chapter ids;
 * the API route must compare `payload.e` / `payload.c` to the target event.
 */
export function verifySerializedEventCheckInUrlToken(
  raw: string,
  secret: string,
  maxAgeSec?: number
): EventCheckInUrlPayload | null {
  const payload = parseEventCheckInUrlToken(raw);
  if (!payload) return null;
  if (!verifyEventCheckInUrlPayload(payload, secret, maxAgeSec)) return null;
  return payload;
}
