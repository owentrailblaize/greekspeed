import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🔍 Test Alumni Profiles API: Called');

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }, { status: 500 });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get alumni with profiles
    const { data: alumniWithProfiles, error: alumniError } = await supabase
      .from('alumni')
      .select(`
        *,
        profiles!inner(*)
      `)
      .limit(5);

    if (alumniError) {
      console.error('❌ Test Alumni Profiles API: Error fetching alumni with profiles:', alumniError);
      return NextResponse.json({
        error: 'Failed to fetch alumni with profiles',
        details: alumniError.message
      }, { status: 500 });
    }

    // Get alumni without profiles
    const { data: alumniWithoutProfiles, error: alumniWithoutError } = await supabase
      .from('alumni')
      .select('*')
      .is('user_id', null)
      .limit(5);

    if (alumniWithoutError) {
      console.error('❌ Test Alumni Profiles API: Error fetching alumni without profiles:', alumniWithoutError);
    }

    // Get profiles without alumni
    const { data: profilesWithoutAlumni, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .not('id', 'in', `(select user_id from alumni where user_id is not null)`)
      .limit(5);

    if (profilesError) {
      console.error('❌ Test Alumni Profiles API: Error fetching profiles without alumni:', profilesError);
    }

    // Get total counts
    const { count: totalAlumni } = await supabase
      .from('alumni')
      .select('*', { count: 'exact', head: true });

    const { count: totalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: linkedAlumni } = await supabase
      .from('alumni')
      .select('*', { count: 'exact', head: true })
      .not('user_id', 'is', null);

    console.log('✅ Test Alumni Profiles API: Successfully fetched data');

    return NextResponse.json({
      success: true,
      summary: {
        totalAlumni: totalAlumni || 0,
        totalProfiles: totalProfiles || 0,
        linkedAlumni: linkedAlumni || 0,
        unlinkedAlumni: (totalAlumni || 0) - (linkedAlumni || 0)
      },
      alumniWithProfiles: alumniWithProfiles || [],
      alumniWithoutProfiles: alumniWithoutProfiles || [],
      profilesWithoutAlumni: profilesWithoutAlumni || [],
      recommendations: [
        'Run the ALUMNI_USER_ID_MIGRATION.sql to add user_id field to alumni table',
        'Update alumni records to link to profiles based on email matching',
        'Ensure all alumni who should be connectable have linked profiles'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test Alumni Profiles API: Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 