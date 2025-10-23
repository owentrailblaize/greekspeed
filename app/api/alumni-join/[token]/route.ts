import { NextRequest, NextResponse } from 'next/server';
import { validateInvitationToken } from '@/lib/utils/invitationUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Validate the invitation token
    const validation = await validateInvitationToken(token);
    if (!validation.valid) {
      return NextResponse.json({ 
        valid: false,
        error: validation.error 
      }, { status: 400 });
    }

    const invitation = validation.invitation!;

    // Ensure this is an alumni invitation
    if (invitation.invitation_type !== 'alumni') {
      return NextResponse.json({ 
        valid: false,
        error: 'This invitation is not for alumni' 
      }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        ...invitation,
        chapter_name: validation.chapter_name
      }
    });
  } catch (error) {
    console.error('Error validating alumni invitation:', error);
    return NextResponse.json({ 
      valid: false,
      error: 'Failed to validate invitation' 
    }, { status: 500 });
  }
}