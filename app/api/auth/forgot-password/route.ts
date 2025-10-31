import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { EmailService } from '@/lib/services/emailService';
import { getEmailBaseUrl } from '@/lib/utils/urlUtils';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Check if user exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, chapter')
      .eq('email', email.toLowerCase())
      .single();

    if (!profile) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({ 
        success: true, 
        message: 'If an account with that email exists, reset instructions have been sent.' 
      });
    }

    // Use the email base URL for consistent redirects
    const baseUrl = getEmailBaseUrl();

    // Generate a reset token using Supabase's admin API (doesn't send email)
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${baseUrl}/auth/reset-password`,
      }
    });

    if (resetError) {
      logger.error('Password reset link generation failed', { resetError, email });
      return NextResponse.json({ 
        error: 'Failed to initiate password reset' 
      }, { status: 500 });
    }

    // Send ONLY your custom email with reset instructions
    const emailSent = await EmailService.sendPasswordResetInstructions({
      to: email,
      firstName: profile.first_name || 'User',
      chapterName: profile.chapter || 'Unknown Chapter',
      resetLink: resetData.properties?.action_link || `${baseUrl}/auth/reset-password`,
      timestamp: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      })
    });

    if (!emailSent) {
      logger.error('Failed to send password reset email', { email });
      return NextResponse.json({ 
        error: 'Failed to send reset email' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset instructions have been sent to your email.' 
    });

  } catch (error) {
    logger.error('Forgot password route error', { error });
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
