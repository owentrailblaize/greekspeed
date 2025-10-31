import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { EmailService } from '@/lib/services/emailService';
import { logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Current password and new password are required' 
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

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    });

    if (verifyError) {
      return NextResponse.json({ 
        error: 'Current password is incorrect' 
      }, { status: 400 });
    }

    // Update password using the service role key with user ID
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      logger.error('Password update error:', { context: [updateError] });
      return NextResponse.json({ 
        error: 'Failed to update password' 
      }, { status: 500 });
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, chapter')
      .eq('id', user.id)
      .single();

    // Send confirmation email
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
      message: 'Password updated successfully' 
    });

  } catch (error) {
    logger.error('Password change error:', { context: [error] });
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
