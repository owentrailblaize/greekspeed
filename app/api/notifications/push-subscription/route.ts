import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return { user: null, error: 'missing_token' };
  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return { user: error ? null : user, error: error?.message ?? null };
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: devices, error } = await supabase
      .from('push_subscriptions')
      .select('id, onesignal_player_id, device_type, platform, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Push subscriptions fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
    }
    return NextResponse.json({ devices: devices ?? [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const playerId = typeof body?.playerId === 'string' ? body.playerId.trim() : '';
    if (!playerId) {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
    }

    const deviceType = typeof body?.deviceType === 'string' ? body.deviceType.trim() || null : null;
    const platform = typeof body?.platform === 'string' ? body.platform.trim() || null : null;

    const supabase = getSupabase();
    const { data: row, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          onesignal_player_id: playerId,
          device_type: deviceType,
          platform: platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,onesignal_player_id' }
      )
      .select('id, onesignal_player_id, device_type, platform, created_at')
      .single();

    if (error) {
      console.error('Push subscription upsert error:', error);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }
    return NextResponse.json({ success: true, subscription: row });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const playerId = typeof body?.playerId === 'string' ? body.playerId.trim() : '';
    if (!playerId) {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('onesignal_player_id', playerId);

    if (error) {
      console.error('Push subscription delete error:', error);
      return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
