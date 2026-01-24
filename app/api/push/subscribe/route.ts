// app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playerId, subscriptionToken, deviceInfo } = await request.json();

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
    }

    // Get user profile for chapter_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('chapter_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Store push subscription in database
    const { error: insertError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        onesignal_player_id: playerId,
        subscription_token: subscriptionToken,
        device_info: deviceInfo || {},
        subscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,onesignal_player_id'
      });

    if (insertError) {
      console.error('Error saving push subscription:', insertError);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    // Update notification settings to enable push
    await supabase
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        chapter_id: profile.chapter_id,
        push_enabled: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    return NextResponse.json({ 
      success: true,
      playerId 
    });
  } catch (error) {
    console.error('Error in push subscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playerId } = await request.json();

    if (playerId) {
      // Delete specific subscription
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('onesignal_player_id', playerId);
    } else {
      // Delete all subscriptions for user
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);
    }

    // Update notification settings to disable push
    await supabase
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        push_enabled: false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in push unsubscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


