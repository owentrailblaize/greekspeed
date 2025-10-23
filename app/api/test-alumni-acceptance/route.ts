import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const { token, testEmail } = await request.json();
    
    if (!token || !testEmail) {
      return NextResponse.json({ 
        error: 'Token and testEmail are required' 
      }, { status: 400 });
    }
    
    const supabase = createServerSupabaseClient();
    
    // Test alumni acceptance data
    const testAlumniData = {
      email: testEmail,
      password: 'TestPassword123!',
      full_name: 'Test Alumni User',
      first_name: 'Test',
      last_name: 'Alumni',
      phone: '(555) 123-4567',
      sms_consent: true,
      industry: 'Technology',
      company: 'Test Company Inc.',
      job_title: 'Senior Software Engineer',
      graduation_year: 2020,
      location: 'San Francisco, CA',
      linkedin_url: 'https://linkedin.com/in/testalumni'
    };
    
    // Call our alumni acceptance API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/alumni-invitations/accept/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testAlumniData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: result.error,
        status: response.status,
        token,
        testEmail
      });
    }
    
    // Verify the user was created correctly
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role, chapter_id, chapter')
      .eq('email', testEmail)
      .single();
    
    const { data: alumni } = await supabase
      .from('alumni')
      .select('user_id, industry, company, job_title, graduation_year')
      .eq('email', testEmail)
      .single();
    
    return NextResponse.json({
      success: true,
      message: 'Alumni invitation acceptance test completed',
      apiResponse: result,
      verification: {
        profileCreated: !!profile,
        alumniRecordCreated: !!alumni,
        profileRole: profile?.role,
        alumniData: alumni ? {
          industry: alumni.industry,
          company: alumni.company,
          job_title: alumni.job_title,
          graduation_year: alumni.graduation_year
        } : null
      },
      token,
      testEmail
    });
    
  } catch (error) {
    console.error('Error testing alumni acceptance:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}