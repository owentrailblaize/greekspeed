import { NextResponse } from 'next/server';
import { validateInvitationToken } from '@/lib/utils/invitationUtils';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Token is required' 
      }, { status: 400 });
    }
    
    // Test validation using our utility function
    const validation = await validateInvitationToken(token);
    
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: validation.error,
        token
      });
    }
    
    const invitation = validation.invitation!;
    
    // Check if it's an alumni invitation
    const isAlumniInvitation = invitation.invitation_type === 'alumni';
    
    return NextResponse.json({
      success: true,
      valid: true,
      isAlumniInvitation,
      invitation: {
        id: invitation.id,
        token: invitation.token,
        invitation_type: invitation.invitation_type,
        chapter_id: invitation.chapter_id,
        chapter_name: validation.chapter_name,
        is_active: invitation.is_active,
        expires_at: invitation.expires_at,
        max_uses: invitation.max_uses,
        usage_count: invitation.usage_count
      },
      token
    });
    
  } catch (error) {
    console.error('Error testing alumni validation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}