import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json({ error: 'Failed to get current user', details: userError }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'No authenticated user found' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Failed to get profile', details: profileError }, { status: 500 });
    }

    // Get user's alumni data if they are alumni
    let alumni = null;
    let alumniError = null;
    
    if (profile.role === 'Alumni') {
      const { data: alumniData, error: alumniErr } = await supabase
        .from('alumni')
        .select('*')
        .eq('user_id', user.id)
        .single();

      alumni = alumniData;
      alumniError = alumniErr;
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        profile: {
          ...profile,
          role: profile.role,
          isAlumni: profile.role === 'Alumni'
        },
        alumni: profile.role === 'Alumni' ? {
          data: alumni,
          error: alumniError,
          hasAlumniRecord: !!alumni
        } : null
      }
    });

  } catch (error) {
    console.error('Error testing current user:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 