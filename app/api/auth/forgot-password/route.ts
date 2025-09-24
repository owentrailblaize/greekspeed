import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { EmailService } from '@/lib/services/emailService';

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

    // Generate a reset token using Supabase's admin API (doesn't send email)
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
      }
    });

    if (resetError) {
      console.error('Password reset error:', resetError);
      return NextResponse.json({ 
        error: 'Failed to initiate password reset' 
      }, { status: 500 });
    }

    // Send ONLY your custom email with reset instructions
    const emailSent = await EmailService.sendPasswordResetInstructions({
      to: email,
      firstName: profile.first_name || 'User',
      chapterName: profile.chapter || 'Unknown Chapter',
      resetLink: resetData.properties?.action_link || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
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
      console.error('Failed to send custom email');
      return NextResponse.json({ 
        error: 'Failed to send reset email' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset instructions have been sent to your email.' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
