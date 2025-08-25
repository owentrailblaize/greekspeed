export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string;
  assigned_by: string;
  chapter_id: string;
  due_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: string;
  updated_at: string;
  
  // Computed fields (not stored in DB)
  assignee_name?: string;
  assigned_by_name?: string;
  chapter_name?: string;
  is_overdue?: boolean;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  assignee_id: string;
  chapter_id: string;
  due_date?: string;
  priority: TaskPriority;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assignee_id?: string;
  due_date?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface TaskFilters {
  assignee_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date_from?: string;
  due_date_to?: string;
}
