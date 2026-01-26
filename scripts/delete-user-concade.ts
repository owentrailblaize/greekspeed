// app/api/developer/delete-user-by-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = profile.id;
    const deletions: string[] = [];
    const errors: string[] = [];

    // Delete in order (child tables first)
    const deleteOperations = [
      { table: 'messages', condition: `sender_id.eq.${userId}` },
      { table: 'post_likes', condition: `user_id.eq.${userId}` },
      { table: 'comment_likes', condition: `user_id.eq.${userId}` },
      { table: 'post_comments', condition: `author_id.eq.${userId}` },
      { table: 'posts', condition: `author_id.eq.${userId}` },
      { table: 'event_rsvps', condition: `user_id.eq.${userId}` },
      { table: 'events', condition: `created_by.eq.${userId}` },
      { table: 'announcement_recipients', condition: `recipient_id.eq.${userId}` },
      { table: 'announcements', condition: `sender_id.eq.${userId}` },
      { table: 'dues_assignments', condition: `user_id.eq.${userId}` },
      { table: 'notifications_settings', condition: `user_id.eq.${userId}` },
      { table: 'invitation_usage', condition: `user_id.eq.${userId}` },
      { table: 'connections', condition: `requester_id.eq.${userId},recipient_id.eq.${userId}` },
      { table: 'alumni', condition: `user_id.eq.${userId}` },
    ];

    for (const op of deleteOperations) {
      try {
        let query = supabase.from(op.table).delete();
        
        if (op.condition.includes(',')) {
          // Handle OR condition for connections
          const [reqCond, recCond] = op.condition.split(',');
          query = query.or(`${reqCond},${recCond}`);
        } else {
          const [field, operator, value] = op.condition.split('.');
          if (operator === 'eq') {
            query = query.eq(field, value);
          }
        }
        
        const { error } = await query;
        if (error) {
          errors.push(`${op.table}: ${error.message}`);
        } else {
          deletions.push(op.table);
        }
      } catch (err) {
        errors.push(`${op.table}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Delete profile
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      errors.push(`profiles: ${profileDeleteError.message}`);
    } else {
      deletions.push('profiles');
    }

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      errors.push(`auth: ${authError.message}`);
    } else {
      deletions.push('auth');
    }

    return NextResponse.json({
      success: errors.length === 0,
      userId,
      email,
      deletions,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}