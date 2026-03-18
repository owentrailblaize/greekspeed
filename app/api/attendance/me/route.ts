import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { MyAttendanceListResponse, MyAttendanceEntry } from '@/types/events';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: rows, error: attError } = await serviceSupabase
      .from('event_attendance')
      .select('event_id, checked_in_at')
      .eq('user_id', user.id)
      .order('checked_in_at', { ascending: false });

    if (attError) {
      console.error('Error fetching my attendance:', attError);
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      );
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json<MyAttendanceListResponse>({
        data: { attendance: [] },
      });
    }

    const eventIds = [...new Set(rows.map((r) => r.event_id))];
    const { data: events, error: eventsError } = await serviceSupabase
      .from('events')
      .select('id, title, start_time')
      .in('id', eventIds);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    const eventMap = new Map(events?.map((e) => [e.id, e]) ?? []);
    const attendance: MyAttendanceEntry[] = rows.map((r) => {
      const ev = eventMap.get(r.event_id);
      return {
        event_id: r.event_id,
        event_title: ev?.title ?? 'Unknown Event',
        event_start_time: ev?.start_time ?? r.checked_in_at,
        checked_in_at: r.checked_in_at,
      };
    });

    return NextResponse.json<MyAttendanceListResponse>({
      data: { attendance },
    });
  } catch (error) {
    console.error('My attendance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
