import { supabase } from '@/lib/supabase/client';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilters } from '@/types/operations';

// Task Management
export async function createTask(taskData: CreateTaskRequest, assignedBy: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      assigned_by: assignedBy,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTasksByChapter(chapterId: string, filters?: TaskFilters): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(full_name),
      assigned_by:profiles!tasks_assigned_by_fkey(full_name),
      chapter:chapters!tasks_chapter_id_fkey(name)
    `)
    .eq('chapter_id', chapterId);

  if (filters?.assignee_id) {
    query = query.eq('assignee_id', filters.assignee_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters?.due_date_from) {
    query = query.gte('due_date', filters.due_date_from);
  }
  if (filters?.due_date_to) {
    query = query.lte('due_date', filters.due_date_to);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  // Transform data to include computed fields
  return data.map(task => ({
    ...task,
    assignee_name: task.assignee?.full_name || 'Unassigned',
    assigned_by_name: task.assigned_by?.full_name || 'Unknown',
    chapter_name: task.chapter?.name || 'Unknown Chapter',
    is_overdue: task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date()
  }));
}

export async function updateTask(taskId: string, updates: UpdateTaskRequest): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

// Get chapter members for task assignment
export async function getChapterMembers(chapterId: string): Promise<Array<{ id: string; full_name: string }>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('chapter_id', chapterId)
    .in('role', ['admin', 'active_member', 'alumni']) // Include all relevant roles
    .order('full_name');

  if (error) throw error;
  return data || [];
}

// Subscribe to real-time task updates
export function subscribeToTasks(chapterId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`tasks-${chapterId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `chapter_id=eq.${chapterId}`
      },
      callback
    )
    .subscribe();
}
