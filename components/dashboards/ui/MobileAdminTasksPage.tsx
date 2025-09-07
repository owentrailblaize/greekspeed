'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Clock, AlertCircle, Users, Calendar, FileText, Plus, Loader2, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfile } from '@/lib/hooks/useProfile';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest } from '@/types/operations';
import { getTasksByChapter, updateTask, getChapterMembers } from '@/lib/services/taskService';
import { TaskModal } from '@/components/ui/TaskModal';
import { supabase } from '@/lib/supabase/client';

export function MobileAdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chapterMembers, setChapterMembers] = useState<Array<{ id: string; full_name: string }>>([]);
  
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  // Load tasks and chapter members
  useEffect(() => {
    if (!chapterId) {
      setLoading(false);
      return;
    }

    if (!profile?.id) {
      setLoading(false);
      return;
    }

    loadAllData();
  }, [chapterId, profile?.id]);

  // Real-time subscription for task updates
  useEffect(() => {
    if (chapterId) {
      const subscription = supabase
        .channel(`tasks-${chapterId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: `chapter_id=eq.${chapterId}`
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            
            if (payload.eventType === 'INSERT') {
              const newTask = payload.new as Task;
              setTasks(prev => [newTask, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedTask = payload.new as Task;
              setTasks(prev => prev.map(task => 
                task.id === updatedTask.id ? updatedTask : task
              ));
            } else if (payload.eventType === 'DELETE') {
              const deletedTaskId = payload.old.id;
              setTasks(prev => prev.filter(task => task.id !== deletedTaskId));
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [chapterId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load all chapter tasks and members in parallel
      const [allTasksData, membersData] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('chapter_id', chapterId!)
          .order('due_date', { ascending: true }),
        getChapterMembers(chapterId!)
      ]);
      
      setTasks(allTasksData.data || []);
      setChapterMembers(membersData);
    } catch (error) {
      console.error('Error loading data:', error);
      setTasks([]);
      setChapterMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    if (!chapterId || !profile?.id) return;
    
    try {
      setCreating(true);
      
      console.log('Creating task with data:', {
        ...taskData,
        chapter_id: chapterId,
        assigned_by: profile.id
      });
      
      // Use Supabase directly instead of API route
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          chapter_id: chapterId,
          assigned_by: profile.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to create task: ${error.message}`);
      }

      console.log('Task created successfully:', task);

      // Close modal
      setIsModalOpen(false);
      
      // Refresh tasks
      await loadAllData();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTask(taskId, { status: newStatus as TaskStatus });
      // Real-time update will handle the UI update
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: string) => {
    try {
      await updateTask(taskId, { priority: newPriority as TaskPriority });
      // Real-time update will handle the UI update
    } catch (error) {
      console.error('Error updating task priority:', error);
    }
  };

  const handleReassign = async (taskId: string, newAssigneeId: string) => {
    try {
      await updateTask(taskId, { assignee_id: newAssigneeId });
      // Real-time update will handle the UI update
    } catch (error) {
      console.error('Error reassigning task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      console.log('Deleting task:', taskId);
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      console.log('Task deleted successfully from Supabase');
      
      // Immediately update local state for instant UI feedback
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'all') return true;
    return task.status === activeFilter;
  });

  const filterButtons = [
    { id: 'all' as const, label: 'All', count: tasks.length },
    { id: 'pending' as const, label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
    { id: 'in_progress' as const, label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
    { id: 'completed' as const, label: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
    { id: 'overdue' as const, label: 'Overdue', count: tasks.filter(t => t.status === 'overdue').length }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-navy-600" />
            <span className="ml-2 text-gray-600">Loading tasks...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state for missing chapterId
  if (!chapterId) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8 text-gray-500">
            <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-2">No Chapter Access</p>
            <p className="text-sm">You need to be associated with a chapter to manage tasks.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-6">
          <CheckSquare className="h-6 w-6 text-navy-600" />
          <h1 className="text-xl font-semibold text-gray-900">Admin Tasks</h1>
        </div>

        {/* Create Task Button */}
        <div className="mb-6">
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-navy-600 hover:bg-navy-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Task
          </Button>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {filterButtons.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {activeFilter === 'all' ? 'No tasks found' : `No ${activeFilter} tasks`}
            </p>
            <p className="text-gray-400 text-sm">
              {activeFilter === 'all' ? 'Create your first task to get started!' : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredTasks.map((task, index) => (
              <div 
                key={task.id} 
                className={`px-4 py-4 ${index !== filteredTasks.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">{task.title}</h3>
                  <div className="flex space-x-2">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
                
                {task.description && (
                  <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                )}
                
                <div className="space-y-1 text-xs text-gray-600 mb-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3" />
                    <span>{task.assignee_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span className={task.is_overdue ? 'text-red-600 font-medium' : ''}>
                      {formatDate(task.due_date)}
                    </span>
                    {task.is_overdue && (
                      <AlertCircle className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <Select 
                    value={task.status} 
                    onValueChange={(value) => handleStatusChange(task.id, value)}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={task.priority}
                    onValueChange={(value) => handlePriorityChange(task.id, value)}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={task.assignee_id}
                    onValueChange={(value) => handleReassign(task.id, value)}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {chapterMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {task.status === 'completed' && (
                    <Button
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="h-7 px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Task Modal */}
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateTask}
          chapterMembers={chapterMembers}
          creating={creating}
        />
      </div>
    </div>
  );
}
