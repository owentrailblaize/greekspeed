// app/api/notifications/settings/route.ts (proposed GET + PATCH updates)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, chapter_id, phone, sms_consent')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    let { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select(`
        sms_enabled,
        email_enabled,
        announcement_notifications,
        event_notifications,
        event_reminder_notifications,
        message_notifications,
        connection_notifications
      `)
      .eq('user_id', userId)
      .single();

    // If not found, attempt to create a base row from profile
    if (settingsError && settingsError.code === 'PGRST116') {
      const { data: newSettings, error: createError } = await supabase
        .from('notification_settings')
        .insert({
          user_id: userId,
          chapter_id: profile.chapter_id,
          sms_enabled: profile.sms_consent || false,
          sms_phone: profile.phone || null,
          // Email defaults: opt-in by default
          email_enabled: true,
          announcement_notifications: true,
          event_notifications: true,
          event_reminder_notifications: true,
          message_notifications: true,
          connection_notifications: true,
        })
        .select(`
          sms_enabled,
          email_enabled,
          announcement_notifications,
          event_notifications,
          event_reminder_notifications,
          message_notifications,
          connection_notifications
        `)
        .single();

      settings = createError ? null : newSettings;
      settingsError = createError || null;
    } else if (settingsError) {
      console.error('Error fetching notification settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // SMS: profiles.sms_consent is source of truth; fallback to settings
    const sms_enabled =
      profile.sms_consent !== null && profile.sms_consent !== undefined
        ? profile.sms_consent
        : settings?.sms_enabled ?? false;

    // Email: default to opt-in (true) for all if missing
    const email_enabled = settings?.email_enabled ?? true;
    const announcement_notifications = settings?.announcement_notifications ?? true;
    const event_notifications = settings?.event_notifications ?? true;
    const event_reminder_notifications = settings?.event_reminder_notifications ?? true;
    const message_notifications = settings?.message_notifications ?? true;
    const connection_notifications = settings?.connection_notifications ?? true;

    return NextResponse.json({
      // SMS
      sms_enabled,
      phone: profile.phone || null,
      // Email
      email_enabled,
      announcement_notifications,
      event_notifications,
      event_reminder_notifications,
      message_notifications,
      connection_notifications,
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      // SMS payload
      sms_enabled,
      // Email payload (all optional)
      email_enabled,
      announcement_notifications,
      event_notifications,
      event_reminder_notifications,
      message_notifications,
      connection_notifications,
    } = body || {};

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Fetch profile for chapter_id and phone
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('chapter_id, phone')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Build settings update object only with provided fields
    const settingsUpdate: Record<string, unknown> = {
      user_id: userId,
      chapter_id: profile.chapter_id,
      updated_at: new Date().toISOString(),
    };

    // Master SMS toggle syncs with profiles.sms_consent
    const updates: Promise<any>[] = [];
    if (typeof sms_enabled === 'boolean') {
      updates.push(
        Promise.resolve(
          supabase
            .from('profiles')
            .update({ sms_consent: sms_enabled })
            .eq('id', userId)
            .select('*')
        )
      );
      settingsUpdate.sms_enabled = sms_enabled;
      settingsUpdate.sms_phone = profile.phone || null;
    }

    // Email master toggle
    if (typeof email_enabled === 'boolean') {
      settingsUpdate.email_enabled = email_enabled;
    }

    // Granular email toggles
    if (typeof announcement_notifications === 'boolean') {
      settingsUpdate.announcement_notifications = announcement_notifications;
    }
    if (typeof event_notifications === 'boolean') {
      settingsUpdate.event_notifications = event_notifications;
    }
    if (typeof event_reminder_notifications === 'boolean') {
      settingsUpdate.event_reminder_notifications = event_reminder_notifications;
    }
    if (typeof message_notifications === 'boolean') {
      settingsUpdate.message_notifications = message_notifications;
    }
    if (typeof connection_notifications === 'boolean') {
      settingsUpdate.connection_notifications = connection_notifications;
    }

    // Upsert notification_settings with provided fields
    updates.push(
      Promise.resolve(
        supabase
          .from('notification_settings')
          .upsert(settingsUpdate, { onConflict: 'user_id' })
          .select('*')
      )
    );
    const results = await Promise.all(updates);

    const failed = results.find((r) => r?.error);
    if (failed?.error) {
      console.error('Error updating settings:', failed.error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated',
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}