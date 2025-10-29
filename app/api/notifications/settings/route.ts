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

    // Get user's profile to get chapter_id, phone, and sms_consent
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, chapter_id, phone, sms_consent')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get or create notification settings record
    let { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('sms_enabled')
      .eq('user_id', userId)
      .single();

    // Handle case where settings don't exist (not found error)
    if (settingsError && settingsError.code === 'PGRST116') {
      // Settings record doesn't exist - create it from profile.sms_consent
      const { data: newSettings, error: createError } = await supabase
        .from('notification_settings')
        .insert({
          user_id: userId,
          chapter_id: profile.chapter_id,
          sms_enabled: profile.sms_consent || false, // Sync from profile
          sms_phone: profile.phone || null
        })
        .select('sms_enabled')
        .single();

      if (createError) {
        console.error('Error creating notification settings:', createError);
        // Fall through to use profile.sms_consent as fallback
        settings = null;
      } else {
        settings = newSettings;
      }
    } else if (settingsError) {
      // Other error (not "not found") - return error
      console.error('Error fetching notification settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Prioritize profiles.sms_consent as source of truth
    // Only use notification_settings if profile doesn't have sms_consent set
    let smsEnabled: boolean;
    
    if (profile.sms_consent !== null && profile.sms_consent !== undefined) {
      // Profile has explicit consent value - use that as source of truth
      smsEnabled = profile.sms_consent;
      
      // If notification_settings exists but is out of sync, update it
      if (settings && settings.sms_enabled !== profile.sms_consent) {
        // Auto-sync: update notification_settings to match profile
        supabase
          .from('notification_settings')
          .update({ 
            sms_enabled: profile.sms_consent,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .then(({ error }) => {
            if (error) {
              console.error('Failed to sync notification_settings:', error);
            } else {
              console.log('✅ Auto-synced notification_settings to match profile.sms_consent');
            }
          });
      } else if (!settings && profile.sms_consent) {
        // Settings don't exist but profile has consent - create them
        supabase
          .from('notification_settings')
          .insert({
            user_id: userId,
            chapter_id: profile.chapter_id,
            sms_enabled: profile.sms_consent,
            sms_phone: profile.phone || null
          })
          .then(({ error }) => {
            if (error) {
              console.error('Failed to create notification_settings:', error);
            }
          });
      }
    } else {
      // Profile doesn't have sms_consent - fallback to notification_settings
      smsEnabled = settings?.sms_enabled ?? false;
    }

    console.log('📋 SMS settings fetched:', {
      userId,
      profile_sms_consent: profile.sms_consent,
      settings_sms_enabled: settings?.sms_enabled,
      final_sms_enabled: smsEnabled
    });

    return NextResponse.json({ 
      sms_enabled: smsEnabled,
      phone: profile.phone || null
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sms_enabled } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (sms_enabled === undefined) {
      return NextResponse.json({ error: 'sms_enabled value required' }, { status: 400 });
    }

    // Get profile to ensure user exists and get chapter_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('chapter_id, phone')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Update BOTH tables: notification_settings AND profiles.sms_consent
    const updatePromises = [
      // Update profiles.sms_consent
      supabase
        .from('profiles')
        .update({ sms_consent: sms_enabled })
        .eq('id', userId),
      
      // Update or create notification_settings
      supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          chapter_id: profile.chapter_id,
          sms_enabled: sms_enabled,
          sms_phone: profile.phone || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
    ];

    const [profileResult, settingsResult] = await Promise.all(updatePromises);

    if (profileResult.error) {
      console.error('Error updating profiles.sms_consent:', profileResult.error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    if (settingsResult.error) {
      console.error('Error updating notification_settings:', settingsResult.error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    console.log('✅ SMS preference updated:', {
      userId,
      sms_enabled,
      profiles_updated: !profileResult.error,
      settings_updated: !settingsResult.error
    });

    return NextResponse.json({ 
      success: true, 
      sms_enabled: sms_enabled,
      message: 'SMS preference updated in both profiles and notification_settings tables'
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}