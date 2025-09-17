import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Create a new Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    // Fetch users with pagination
    const { data: users, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ 
      users: users || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role, isDeveloper, firstName, lastName, chapter, memberStatus } = body;

    // Create a new Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First, create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // Then, create the profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        role,
        chapter,
        member_status: memberStatus,
        is_developer: isDeveloper,
        developer_permissions: isDeveloper ? ['view_users'] : [],
        access_level: isDeveloper ? 'standard' : 'standard'
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'User created successfully',
      user: authData.user 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Create a new Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log(`🗑️ Attempting to delete user: ${userId}`);

    // First, try to delete the user from Supabase Auth
    console.log(' Deleting auth user...');
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('❌ Auth user deletion failed:', authError);
      
      // Check if it's a permission issue or user not found
      if (authError.message.includes('not found') || authError.message.includes('does not exist')) {
        console.log('ℹ️ Auth user not found, proceeding with profile deletion only');
      } else {
        // For other auth errors, we'll still try to delete the profile
        console.log('⚠️ Auth deletion failed, but proceeding with profile cleanup');
      }
    } else {
      console.log('✅ Auth user deleted successfully');
    }

    // Then, delete the profile from the profiles table
    console.log('🗃️ Deleting profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('❌ Profile deletion error:', profileError);
      return NextResponse.json({ error: 'Failed to delete user profile' }, { status: 500 });
    }

    console.log('✅ Profile deleted successfully');

    // Also clean up any related data (connections, etc.)
    try {
      console.log('🧹 Cleaning up related data...');
      
      // Delete connections where this user is involved
      const { error: connectionsError } = await supabase
        .from('connections')
        .delete()
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

      if (connectionsError) {
        console.log('⚠️ Connections cleanup failed:', connectionsError.message);
      } else {
        console.log('✅ Connections cleaned up');
      }

      // Delete any other related data as needed
      // Add more cleanup operations here if you have other tables with user references

    } catch (cleanupError) {
      console.log('⚠️ Additional cleanup failed:', cleanupError);
      // Don't fail the entire operation for cleanup issues
    }

    return NextResponse.json({ 
      message: 'User deletion completed',
      userId: userId,
      authDeleted: !authError,
      profileDeleted: true,
      details: authError ? `Auth deletion failed: ${authError.message}` : 'All data deleted successfully'
    });

  } catch (error) {
    console.error('❌ Unexpected error during user deletion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
