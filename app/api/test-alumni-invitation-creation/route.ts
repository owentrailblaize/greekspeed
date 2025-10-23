import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get a test chapter (you'll need to replace with actual chapter_id)
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, name')
      .limit(1)
      .single();
    
    if (!chapters) {
      return NextResponse.json({ 
        error: 'No chapters found. Please create a chapter first.' 
      }, { status: 400 });
    }
    
    // Test creating an alumni invitation
    const testInvitationData = {
      chapter_id: chapters.id,
      invitation_type: 'alumni',
      email_domain_allowlist: null,
      approval_mode: 'auto',
      single_use: false,
      expires_at: null,
      max_uses: 10
    };
    
    // Generate a test token
    const testToken = `test_alumni_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        token: testToken,
        chapter_id: chapters.id,
        created_by: '00000000-0000-0000-0000-000000000000', // Test user ID
        email_domain_allowlist: null,
        approval_mode: 'auto',
        single_use: false,
        expires_at: null,
        max_uses: 10,
        invitation_type: 'alumni',
        is_active: true
      })
      .select(`
        *,
        chapters!inner(name)
      `)
      .single();
    
    if (error) {
      return NextResponse.json({ 
        error: 'Failed to create alumni invitation', 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Alumni invitation created successfully',
      invitation: {
        ...invitation,
        invitation_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/alumni-join/${invitation.token}`,
        chapter_name: invitation.chapters?.name
      },
      testData: {
        token: invitation.token,
        chapterId: invitation.chapter_id,
        chapterName: invitation.chapters?.name
      }
    });
    
  } catch (error) {
    console.error('Error testing alumni invitation creation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}