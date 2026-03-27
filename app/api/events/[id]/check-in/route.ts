import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import {
  parseChapterCheckInQrPayload,
  verifyChapterCheckInPayload,
} from '@/lib/checkInQrToken';
import { verifySerializedEventCheckInUrlToken } from '@/lib/eventCheckInUrlToken';
import type { CheckInResponse, EventCheckInRequestBody } from '@/types/events';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** TTL for URL token; prefers EVENT_CHECK_IN_URL_MAX_AGE_SEC, then CHECK_IN_QR_MAX_AGE_SEC. */
function resolveUrlCheckInTokenMaxAgeSec(): number | undefined {
  const urlRaw = process.env.EVENT_CHECK_IN_URL_MAX_AGE_SEC;
  if (urlRaw != null && urlRaw !== '') {
    const n = Number.parseInt(urlRaw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const qrRaw = process.env.CHECK_IN_QR_MAX_AGE_SEC;
  if (qrRaw != null && qrRaw !== '') {
    const n = Number.parseInt(qrRaw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) return { user };
  }
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { user };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = auth;

    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('id, chapter_id, member_status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.member_status !== 'active') {
      return NextResponse.json(
        { error: 'Only active members can check in' },
        { status: 403 }
      );
    }

    const { data: event, error: eventError } = await serviceSupabase
      .from('events')
      .select('id, chapter_id, start_time, end_time, status')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status !== 'published') {
      return NextResponse.json(
        { error: 'Event is not published' },
        { status: 400 }
      );
    }

    if (event.chapter_id !== profile.chapter_id) {
      return NextResponse.json(
        { error: 'You are not a member of this event\'s chapter' },
        { status: 403 }
      );
    }

    let qrPayloadRaw: string | null = null;
    let urlCheckInTokenRaw: string | null = null;
    try {
      const body = (await request.json()) as EventCheckInRequestBody;
      if (body) {
        if (typeof body.qr_payload === 'string') {
          const trimmed = body.qr_payload.trim();
          if (trimmed) qrPayloadRaw = trimmed;
        }
        if (typeof body.url_check_in_token === 'string') {
          const trimmed = body.url_check_in_token.trim();
          if (trimmed) urlCheckInTokenRaw = trimmed;
        }
      }
    } catch {
      // No/invalid JSON body — legacy POST (e.g. /check-in page)
    }

    if (qrPayloadRaw && urlCheckInTokenRaw) {
      return NextResponse.json(
        {
          error:
            'Send only one of qr_payload (in-app scan) or url_check_in_token (camera link)',
        },
        { status: 400 }
      );
    }

    const secret = process.env.CHECK_IN_QR_SECRET;
    if (urlCheckInTokenRaw) {
      if (!secret || secret.length < 16) {
        return NextResponse.json(
          { error: 'QR check-in is not available' },
          { status: 503 }
        );
      }
      const urlPayload = verifySerializedEventCheckInUrlToken(
        urlCheckInTokenRaw,
        secret,
        resolveUrlCheckInTokenMaxAgeSec()
      );
      if (!urlPayload) {
        return NextResponse.json(
          { error: 'Invalid or expired check-in link' },
          { status: 400 }
        );
      }
      if (urlPayload.e !== eventId) {
        return NextResponse.json(
          { error: 'This check-in link is for a different event' },
          { status: 400 }
        );
      }
      if (urlPayload.c !== event.chapter_id) {
        return NextResponse.json(
          { error: 'This check-in link is not valid for this event' },
          { status: 403 }
        );
      }
    }

    if (qrPayloadRaw) {
      if (!secret || secret.length < 16) {
        return NextResponse.json(
          { error: 'QR check-in is not available' },
          { status: 503 }
        );
      }
      const parsed = parseChapterCheckInQrPayload(qrPayloadRaw);
      if (!parsed) {
        return NextResponse.json(
          { error: 'Invalid check-in code' },
          { status: 400 }
        );
      }
      const maxAgeRaw = process.env.CHECK_IN_QR_MAX_AGE_SEC;
      const maxAgeSec =
        maxAgeRaw != null && maxAgeRaw !== ''
          ? Number.parseInt(maxAgeRaw, 10)
          : undefined;
      const maxAge =
        maxAgeSec != null && Number.isFinite(maxAgeSec) && maxAgeSec > 0
          ? maxAgeSec
          : undefined;

      if (!verifyChapterCheckInPayload(parsed, secret, maxAge)) {
        return NextResponse.json(
          { error: 'Invalid or expired check-in code' },
          { status: 400 }
        );
      }
      if (parsed.c !== event.chapter_id) {
        return NextResponse.json(
          { error: 'This check-in code is not for this event\'s chapter' },
          { status: 403 }
        );
      }
    }

    const checkedInAt = new Date().toISOString();

    const { data: existing } = await serviceSupabase
      .from('event_attendance')
      .select('id, checked_in_at')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json<CheckInResponse>({
        data: {
          checked_in_at: existing.checked_in_at,
          already_checked_in: true,
        },
      });
    }

    const { data: row, error: insertError } = await serviceSupabase
      .from('event_attendance')
      .insert({
        event_id: eventId,
        user_id: user.id,
        checked_in_at: checkedInAt,
      })
      .select('checked_in_at')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        const { data: existingRow } = await serviceSupabase
          .from('event_attendance')
          .select('checked_in_at')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .single();
        return NextResponse.json<CheckInResponse>({
          data: {
            checked_in_at: existingRow?.checked_in_at ?? checkedInAt,
            already_checked_in: true,
          },
        });
      }
      console.error('Check-in insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to record check-in' },
        { status: 500 }
      );
    }

    return NextResponse.json<CheckInResponse>({
      data: { checked_in_at: row.checked_in_at },
    });
  } catch (error) {
    console.error('Check-in API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
