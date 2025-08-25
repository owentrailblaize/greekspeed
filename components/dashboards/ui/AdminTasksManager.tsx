'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, CheckCircle, Clock } from 'lucide-react';
import { useProfile } from '@/lib/hooks/useProfile';
import { supabase } from '@/lib/supabase/client';
import { Task, TaskStatus } from '@/types/operations';

export function AdminTasksManager() {
  const { profile } = useProfile();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.chapter_id) return;
    loadAllTasks();
  }, [profile?.chapter_id]);

  const loadAllTasks = async () => {
    try {
      setLoading(true);
      
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(full_name),
          assigned_by:profiles!tasks_assigned_by_fkey(full_name)
        `)
        .eq('chapter_id', profile?.chapter_id) // Add optional chaining
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAllTasks(tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // Remove from local state
      setAllTasks(prev => prev.filter(task => task.id !== taskId));
      console.log('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading tasks...</div>;
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Chapter Tasks Management</span>
          <Badge variant="secondary">{allTasks.length} total tasks</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allTasks.map((task) => (
            <div key={task.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(task.status)}
                    <h4 className="font-medium">{task.title}</h4>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  )}
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Assigned to: {(task as any).assignee?.full_name || 'Unknown'}</div>
                    <div>Assigned by: {(task as any).assigned_by?.full_name || 'Unknown'}</div>
                    <div>Priority: {task.priority}</div>
                    {task.due_date && (
                      <div>Due: {new Date(task.due_date).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {task.status === 'completed' && (
                    <Button
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
