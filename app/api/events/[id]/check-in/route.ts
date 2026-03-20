import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { CheckInResponse } from '@/types/events';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
