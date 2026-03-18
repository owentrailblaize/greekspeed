import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { updateTask, deleteTask } from '@/lib/services/taskService';
import { canManageMembersForContext } from '@/lib/permissions';
import { getManagedChapterIds } from '@/lib/services/governanceService';

async function getTaskChapterId(supabase: any, taskId: string): Promise<string | null> {
  const { data } = await supabase.from('tasks').select('chapter_id').eq('id', taskId).single();
  return data?.chapter_id ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createServerComponentClient({ cookies });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, chapter_id, chapter_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const taskChapterId = await getTaskChapterId(supabase, id);
    if (!taskChapterId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    let managedChapterIds: string[] | undefined;
    if (profile.role === 'governance') {
      managedChapterIds = await getManagedChapterIds(supabase, user.id);
    }
    if (!canManageMembersForContext(profile, taskChapterId, managedChapterIds)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const task = await updateTask(id, body);

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createServerComponentClient({ cookies });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, chapter_id, chapter_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const taskChapterId = await getTaskChapterId(supabase, id);
    if (!taskChapterId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    let managedChapterIds: string[] | undefined;
    if (profile.role === 'governance') {
      managedChapterIds = await getManagedChapterIds(supabase, user.id);
    }
    if (!canManageMembersForContext(profile, taskChapterId, managedChapterIds)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await deleteTask(id);

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}