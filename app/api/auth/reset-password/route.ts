import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { EmailService } from '@/lib/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const { newPassword } = await request.json();
    
    if (!newPassword) {
      return NextResponse.json({ 
        error: 'New password is required' 
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Update password using the service role key with user ID
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update password' 
      }, { status: 500 });
    }

    // Get user profile for email notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, chapter')
      .eq('id', user.id)
      .single();

    // Send password change confirmation email
    if (profile) {
      await EmailService.sendPasswordChangeConfirmation({
        to: user.email!,
        firstName: profile.first_name || 'User',
        chapterName: profile.chapter || 'Unknown Chapter',
        timestamp: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        deviceInfo: request.headers.get('user-agent') || 'Unknown Device'
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
