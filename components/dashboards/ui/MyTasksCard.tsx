'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ListTodo, Loader2 } from 'lucide-react';
import { useProfile } from '@/lib/hooks/useProfile';
import { getTasksByChapter } from '@/lib/services/taskService';
import { Task, TaskStatus } from '@/types/operations';

export function MyTasksCard() {
  const { profile } = useProfile();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks for the current user
  useEffect(() => {
    if (!profile?.chapter_id) {
      setLoading(false);
      return;
    }

    const loadMyTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all tasks for the chapter - profile.chapter_id is guaranteed to be string here
        const allTasks = await getTasksByChapter(profile.chapter_id!);
        
        // Filter to only show tasks assigned to the current user
        const myTasks = allTasks.filter(task => task.assignee_id === profile.id);
        
        setTasks(myTasks);
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
      
      // Update task status via API
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
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
              className="mt-3 bg-navy-600 hover:bg-navy-700"
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
            <Button variant="outline" size="sm" className="text-navy-600 border-navy-600 hover:bg-navy-50">
              Complete your profile
            </Button>
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
        <div className="space-y-3">
          {/* Progress Bar - Exact same as before */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900 font-medium">{completedTasks}/{totalTasks}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-navy-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Task List - Exact same as before, but with real data */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={() => handleTaskToggle(task.id, task.status)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div className={`text-xs ${task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {task.description}
                    </div>
                  )}
                  {task.due_date && (
                    <div className={`text-xs ${task.status === 'completed' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Due: {new Date(task.due_date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                  )}
                  {/* Show priority badge */}
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
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
            <div className="pt-2 border-t border-gray-100">
              <Button variant="outline" size="sm" className="w-full text-navy-600 border-navy-600 hover:bg-navy-50">
                View All Tasks
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 