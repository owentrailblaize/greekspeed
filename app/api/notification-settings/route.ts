import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user's notification settings
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching notification settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Return settings or defaults if none exist
    return NextResponse.json({
      settings: settings || {
        sms_enabled: false,
        sms_phone: '',
        email_enabled: true,
        push_enabled: false,
        announcement_notifications: true,
        event_notifications: true,
        event_reminder_notifications: true,
        urgent_notifications: true,
        connection_notifications: true,
        connection_accepted_notifications: true,
        message_notifications: true,
        password_reset_notifications: true,
        password_change_notifications: true,
        support_notifications: true
      }
    });

  } catch (error) {
    console.error('Notification settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user's profile to get chapter_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('chapter_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.chapter_id) {
      return NextResponse.json({ error: 'User not associated with a chapter' }, { status: 400 });
    }

    const body = await request.json();
    const {
      sms_enabled,
      sms_phone,
      email_enabled,
      push_enabled,
      announcement_notifications,
      event_notifications,
      event_reminder_notifications,
      urgent_notifications,
      connection_notifications,
      connection_accepted_notifications,
      message_notifications,
      password_reset_notifications,
      password_change_notifications,
      support_notifications
    } = body;

    // Validate SMS settings
    if (sms_enabled && (!sms_phone || !sms_phone.trim())) {
      return NextResponse.json({ 
        error: 'Phone number is required when SMS notifications are enabled' 
      }, { status: 400 });
    }

    // Prepare settings data
    const settingsData = {
      user_id: user.id,
      chapter_id: profile.chapter_id,
      sms_enabled: Boolean(sms_enabled),
      sms_phone: sms_enabled ? sms_phone?.trim() : null,
      email_enabled: Boolean(email_enabled),
      push_enabled: Boolean(push_enabled),
      announcement_notifications: Boolean(announcement_notifications),
      event_notifications: Boolean(event_notifications),
      event_reminder_notifications: Boolean(event_reminder_notifications),
      urgent_notifications: Boolean(urgent_notifications),
      connection_notifications: Boolean(connection_notifications),
      connection_accepted_notifications: Boolean(connection_accepted_notifications),
      message_notifications: Boolean(message_notifications),
      password_reset_notifications: Boolean(password_reset_notifications),
      password_change_notifications: Boolean(password_change_notifications),
      support_notifications: Boolean(support_notifications),
      updated_at: new Date().toISOString()
    };

    // Upsert notification settings
    const { data: settings, error: upsertError } = await supabase
      .from('notification_settings')
      .upsert(settingsData, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error saving notification settings:', upsertError);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      settings,
      message: 'Notification preferences saved successfully!' 
    });

  } catch (error) {
    console.error('Notification settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
