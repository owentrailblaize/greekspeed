import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Test 1: Check alumni table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('alumni')
      .select('*')
      .limit(5);

    if (tableError) {
      return NextResponse.json({ error: 'Failed to query alumni table', details: tableError }, { status: 500 });
    }

    // Test 2: Check if there are any alumni records
    const { count: alumniCount, error: countError } = await supabase
      .from('alumni')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({ error: 'Failed to count alumni records', details: countError }, { status: 500 });
    }

    // Test 3: Check profiles with role 'Alumni'
    const { data: alumniProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role, email')
      .eq('role', 'Alumni')
      .limit(10);

    if (profilesError) {
      return NextResponse.json({ error: 'Failed to query alumni profiles', details: profilesError }, { status: 500 });
    }

    // Test 4: Check if alumni records exist for these profiles
    const alumniWithProfiles = [];
    for (const profile of alumniProfiles || []) {
      const { data: alumniRecord, error: alumniError } = await supabase
        .from('alumni')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      alumniWithProfiles.push({
        profile,
        alumniRecord: alumniError ? null : alumniRecord,
        alumniError: alumniError ? alumniError.message : null
      });
    }

    // Test 5: Check for any orphaned alumni records (without corresponding profiles)
    const { data: orphanedAlumni, error: orphanedError } = await supabase
      .from('alumni')
      .select('user_id, created_at')
      .limit(10);

    const orphanedDetails = [];
    for (const alumni of orphanedAlumni || []) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', alumni.user_id)
        .single();

      orphanedDetails.push({
        alumniUserId: alumni.user_id,
        profileExists: !!profile,
        profileRole: profile?.role,
        profileError: profileError ? profileError.message : null
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        tableStructure: {
          sampleRecords: tableInfo,
          totalCount: alumniCount
        },
        alumniProfiles: {
          count: alumniProfiles?.length || 0,
          profiles: alumniProfiles,
          alumniRecords: alumniWithProfiles
        },
        orphanedAlumni: {
          count: orphanedAlumni?.length || 0,
          details: orphanedDetails
        }
      }
    });

  } catch (error) {
    console.error('Error testing alumni table:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 