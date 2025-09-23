import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createTask } from '@/lib/services/taskService';
import { canManageMembers } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {}, // No-op for API routes
          remove() {}, // No-op for API routes
        },
      }
    );
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, chapter_id, chapter_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check permissions
    if (!canManageMembers(profile.role as any, profile.chapter_role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID required' }, { status: 400 });
    }

    // Verify user has access to this chapter
    if (profile.role !== 'admin' && profile.chapter_id !== chapterId) {
      return NextResponse.json({ error: 'Access denied to this chapter' }, { status: 403 });
    }

    // Import the service function here to avoid circular dependencies
    const { getTasksByChapter } = await import('@/lib/services/taskService');
    const tasks = await getTasksByChapter(chapterId);

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Use createServerClient instead of createRouteHandlerClient
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // This won't work in API routes, but we don't need to set cookies here
          },
          remove(name: string, options: any) {
            // This won't work in API routes, but we don't need to remove cookies here
          },
        },
      }
    );
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Auth check result
    
    if (authError || !user) {
      // Authentication failed
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, chapter_id, chapter_role')
      .eq('id', user.id)
      .single();

    // Profile data

    if (profileError || !profile) {
      // Profile not found
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check permissions
    const hasPermission = canManageMembers(profile.role as any, profile.chapter_role);
    // Permission check

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, assignee_id, chapter_id, due_date, priority } = body;

    // Validate required fields
    if (!title || !assignee_id || !chapter_id || !priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user has access to this chapter
    if (profile.role !== 'admin' && profile.chapter_id !== chapter_id) {
      return NextResponse.json({ error: 'Access denied to this chapter' }, { status: 403 });
    }

    // Create the task
    const task = await createTask(body, user.id);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
