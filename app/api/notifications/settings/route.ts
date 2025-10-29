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

    // For now, get preferences from profiles table (sms_consent field)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('sms_consent, phone')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({ 
      sms_enabled: profile?.sms_consent || false,
      phone: profile?.phone || null
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

    const { error } = await supabase
      .from('profiles')
      .update({ sms_consent: sms_enabled })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true, sms_enabled });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}