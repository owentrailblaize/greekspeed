'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ListTodo, Loader2 } from 'lucide-react';
import { useProfile } from '@/lib/hooks/useProfile';
import { supabase } from '@/lib/supabase/client'; // Add this import
import { Task, TaskStatus } from '@/types/operations';

export function MyTasksCard() {
  const { profile } = useProfile();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks for the current user
  useEffect(() => {
    if (!profile?.chapter_id || !profile?.id) {
      setLoading(false);
      return;
    }

    const loadMyTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use Supabase directly to fetch tasks
        const { data: allTasks, error: fetchError } = await supabase
          .from('tasks')
          .select(`
            *,
            assignee:profiles!tasks_assignee_id_fkey(full_name),
            assigned_by:profiles!tasks_assigned_by_fkey(full_name),
            chapter:chapters!tasks_chapter_id_fkey(name)
          `)
          .eq('chapter_id', profile.chapter_id)
          .eq('assignee_id', profile.id) // Only get tasks assigned to current user
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Transform data to include computed fields
        const transformedTasks = allTasks.map(task => ({
          ...task,
          assignee_name: task.assignee?.full_name || 'Unassigned',
          assigned_by_name: task.assigned_by?.full_name || 'Unknown',
          chapter_name: task.chapter?.name || 'Unknown Chapter',
          is_overdue: task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date()
        }));

        setTasks(transformedTasks);
      } catch (error) {
        console.error('Error loading my tasks:', error);
        setError('Failed to load tasks');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadMyTasks();
  }, [profile?.chapter_id, profile?.id]);

  const handleTaskToggle = async (taskId: string, currentStatus: TaskStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      
      // Update in Supabase
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() // Track when it was updated
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      // Task marked as newStatus
    } catch (error) {
      console.error('Error updating task:', error);
      // Could add toast notification here
    }
  };

  // Calculate progress based on completed tasks
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Show loading state
  if (loading) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <ListTodo className="h-5 w-5 text-navy-600" />
            <span>My Tasks</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-navy-600" />
            <span className="ml-2 text-gray-600">Loading tasks...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <ListTodo className="h-5 w-5 text-navy-600" />
            <span>My Tasks</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8 text-red-600">
            <p className="font-medium mb-2">Error loading tasks</p>
            <p className="text-sm">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-3 bg-navy-600 hover:bg-navy-700 h-10 sm:h-8"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state (no tasks)
  if (tasks.length === 0) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <ListTodo className="h-5 w-5 text-navy-600" />
            <span>My Tasks</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-2">You&apos;re all caught up 🎉</p>
            <p className="text-gray-400 text-xs mb-3">No tasks assigned to you yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show tasks (exact same UI as before)
  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <ListTodo className="h-5 w-5 text-navy-600" />
          <span>My Tasks</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4 sm:space-y-3">
          {/* Progress Bar - Exact same as before */}
          <div className="space-y-2">
            <div className="flex justify-between text-base sm:text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900 font-medium">{completedTasks}/{totalTasks}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 sm:h-2">
              <div 
                className="bg-navy-600 h-3 sm:h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Task List - Exact same as before, but with real data */}
          <div className="space-y-3 sm:space-y-2 max-h-48 overflow-y-auto">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-start space-x-3 sm:space-x-3 p-3 sm:p-2 rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={() => handleTaskToggle(task.id, task.status)}
                  className="mt-1 sm:mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-base sm:text-sm break-words ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div className={`text-sm sm:text-xs break-words ${task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {task.description}
                    </div>
                  )}
                  {task.due_date && (
                    <div className={`text-sm sm:text-xs ${task.status === 'completed' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Due: {new Date(task.due_date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                  )}
                  {/* Show priority badge */}
                  <div className="mt-2 sm:mt-1">
                    <span className={`inline-block px-3 py-1 sm:px-2 sm:py-1 text-sm sm:text-xs rounded-full ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      task.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Tasks button - Exact same as before */}
          {totalTasks > 5 && (
            <div className="pt-3 sm:pt-2 border-t border-gray-100">
              <Button variant="outline" size="sm" className="w-full text-navy-600 border-navy-600 hover:bg-navy-50 h-10 sm:h-8">
                View All Tasks
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 