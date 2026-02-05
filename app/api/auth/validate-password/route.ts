import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json({ 
        error: 'Password is required' 
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
      password: password
    });

    if (verifyError) {
      return NextResponse.json({ 
        valid: false,
        error: 'Current password is incorrect' 
      });
    }

    return NextResponse.json({ 
      valid: true,
      message: 'Password is correct' 
    });

  } catch (error) {
    console.error('Password validation error:', error);
    return NextResponse.json({ 
      valid: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
