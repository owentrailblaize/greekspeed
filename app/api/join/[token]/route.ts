import { NextRequest, NextResponse } from 'next/server';
import { validateInvitationToken } from '@/lib/utils/invitationUtils';
import { logger } from "@/lib/utils/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Await params before accessing its properties
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

    // Return the validated invitation data for the join page
    return NextResponse.json({
      valid: true,
      invitation: {
        id: validation.invitation!.id,
        token: validation.invitation!.token,
        chapter_id: validation.invitation!.chapter_id,
        chapter_name: validation.chapter_name,
        email_domain_allowlist: validation.invitation!.email_domain_allowlist,
        approval_mode: validation.invitation!.approval_mode,
        single_use: validation.invitation!.single_use,
        expires_at: validation.invitation!.expires_at,
        max_uses: validation.invitation!.max_uses,
        usage_count: validation.invitation!.usage_count
      }
    });
  } catch (error) {
    logger.error('API error:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

