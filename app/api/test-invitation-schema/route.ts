import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Test 1: Check if invitation_type column exists
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('id, token, invitation_type, created_at')
      .limit(5);
    
    if (error) {
      return NextResponse.json({ 
        error: 'Failed to query invitations table', 
        details: error.message 
      }, { status: 500 });
    }
    
    // Test 2: Check column structure
    const sampleInvitation = invitations?.[0];
    const hasInvitationType = sampleInvitation && 'invitation_type' in sampleInvitation;
    
    return NextResponse.json({
      success: true,
      message: 'Invitation schema test completed',
      hasInvitationTypeColumn: hasInvitationType,
      sampleInvitation,
      totalInvitations: invitations?.length || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error testing invitation schema:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}