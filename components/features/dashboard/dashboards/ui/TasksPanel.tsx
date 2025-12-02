'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, User, Calendar, AlertTriangle, Plus, Loader2, X, Eye, Trash2, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest } from '@/types/operations';
import { getTasksByChapter, updateTask, getChapterMembersForTasks, subscribeToTasks } from '@/lib/services/taskService';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { TaskModal } from '@/components/ui/TaskModal';
import { supabase } from '@/lib/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-toastify';

interface TasksPanelProps {
  chapterId?: string;
}

export function TasksPanel({ chapterId }: TasksPanelProps) {
  const { profile } = useProfile();
  
  // Add this debug log to see what's in the profile
  // Current profile in TasksPanel

  const [tasks, setTasks] = useState<Task[]>([]); // Personal tasks only
  const [allChapterTasks, setAllChapterTasks] = useState<Task[]>([]); // All chapter tasks for modal
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [chapterMembers, setChapterMembers] = useState<Array<{ id: string; full_name: string; role: string; chapter_role: string | null }>>([]);
  const [newTask, setNewTask] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    assignee_id: '',
    chapter_id: chapterId || '',
    due_date: '',
    priority: 'medium'
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

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

  // Enhanced real-time subscription with proper state updates
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
            // Real-time update received
            
            if (payload.eventType === 'INSERT') {
              // Add new task to both states
              const newTask = payload.new as Task;
              setTasks(prev => [newTask, ...prev]);
              setAllChapterTasks(prev => [newTask, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              // Update task in both states
              const updatedTask = payload.new as Task;
              setTasks(prev => prev.map(task => 
                task.id === updatedTask.id ? updatedTask : task
              ));
              setAllChapterTasks(prev => prev.map(task => 
                task.id === updatedTask.id ? updatedTask : task
              ));
            } else if (payload.eventType === 'DELETE') {
              // Remove task from both states
              const deletedTaskId = payload.old.id;
              // Removing deleted task
              setTasks(prev => prev.filter(task => task.id !== deletedTaskId));
              setAllChapterTasks(prev => prev.filter(task => task.id !== deletedTaskId));
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
    // TasksPanel: loadAllData called
    
    try {
      setLoading(true);
      
      // Loading personal tasks, all chapter tasks, and members in parallel...
      
      // Load personal tasks, all chapter tasks, and members in parallel
      const [personalTasksData, allTasksData, membersData] = await Promise.all([
        // Personal tasks only (for the main panel) - with user names
        supabase
          .from('tasks')
          .select(`
            *,
            assignee:profiles!tasks_assignee_id_fkey(full_name),
            assigned_by:profiles!tasks_assigned_by_fkey(full_name)
          `)
          .eq('chapter_id', chapterId!)
          .eq('assignee_id', profile!.id)
          .order('due_date', { ascending: true }),
        
        // All chapter tasks (for the modal) - with user names
        supabase
          .from('tasks')
          .select(`
            *,
            assignee:profiles!tasks_assignee_id_fkey(full_name),
            assigned_by:profiles!tasks_assigned_by_fkey(full_name)
          `)
          .eq('chapter_id', chapterId!)
          .order('due_date', { ascending: true }),
        
        getChapterMembersForTasks(chapterId!) // Use the new function that excludes alumni
      ]);
      
      // Personal tasks loaded
      
      // Transform the data to include assignee_name
      const personalTasks = (personalTasksData.data || []).map(task => ({
        ...task,
        assignee_name: task.assignee?.full_name || 'Unassigned',
        assigned_by_name: task.assigned_by?.full_name || 'Unknown'
      }));
      
      const allTasks = (allTasksData.data || []).map(task => ({
        ...task,
        assignee_name: task.assignee?.full_name || 'Unassigned',
        assigned_by_name: task.assigned_by?.full_name || 'Unknown'
      }));
      
      // Sort tasks: completed first, then by due date
      const sortedAllTasks = allTasks.sort((a, b) => {
        // First sort by status: completed tasks first
        if (a.status === 'completed' && b.status !== 'completed') return -1;
        if (a.status !== 'completed' && b.status === 'completed') return 1;
        
        // If both have same status, sort by due date
        const dateA = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
        const dateB = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
        return dateA.getTime() - dateB.getTime();
      });
      
      setTasks(personalTasks); // Personal tasks
      setAllChapterTasks(sortedAllTasks); // All chapter tasks (sorted)
      setChapterMembers(membersData);
      
      // Data loaded successfully
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setTasks([]);
      setAllChapterTasks([]);
      setChapterMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    // TasksPanel: handleCreateTask called
    
    if (!chapterId || !profile?.id) {
      // Missing chapterId or profile.id
      return;
    }
    
    try {
      setCreating(true);
      
      const taskPayload = {
        ...taskData,
        chapter_id: chapterId,
        assigned_by: profile.id
      };
      
      // Creating task with payload
      
      // Handle multiple assignees by creating separate tasks
      if (Array.isArray(taskData.assignee_id)) {
        // Creating multiple tasks for assignees
        
        const tasks = await Promise.all(
          taskData.assignee_id.map((assigneeId, index) => {
            // Creating task for assignee
            return supabase
              .from('tasks')
              .insert({
                ...taskData,
                assignee_id: assigneeId,
                chapter_id: chapterId,
                assigned_by: profile.id,
                status: 'pending'
              })
              .select()
              .single();
          })
        );
        
        // All task creation promises completed
        
        const errors = tasks.filter(result => result.error);
        // Errors found
        
        if (errors.length > 0) {
          console.error('Supabase errors:', errors);
          throw new Error(`Failed to create some tasks: ${errors.map(e => e.error?.message).join(', ')}`);
        }
        
        const createdTasks = tasks.map(r => r.data);
        // Tasks created successfully
      } else {
        // Single assignee (original behavior)
        // Creating single task for assignee
        
        const { data: task, error } = await supabase
          .from('tasks')
          .insert({
            ...taskData,
            assignee_id: taskData.assignee_id as string,
            chapter_id: chapterId,
            assigned_by: profile.id,
            status: 'pending'
          })
          .select()
          .single();

        // Single task creation result

        if (error) {
          console.error('Supabase error:', error);
          throw new Error(`Failed to create task: ${error.message}`);
        }

        // Task created successfully
      }

      // All tasks created, closing modal and refreshing data
      // Close modal
      setIsModalOpen(false);
      
      // Refresh tasks
      await loadAllData();
    } catch (error) {
      console.error('❌ Error creating task:', error);
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

  // Enhanced delete function with immediate state update
  const handleDeleteTask = async (taskId: string) => {
    try {
      // Deleting task
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // Task deleted successfully from Supabase
      
      // Immediately update local state for instant UI feedback
      setAllChapterTasks(prev => prev.filter(task => task.id !== taskId));
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleTaskToggle = async (taskId: string, currentStatus: TaskStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      
      // Update in Supabase
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      setAllChapterTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      // Show toast notification on desktop only
      if (window.innerWidth >= 640) { // sm breakpoint
        if (newStatus === 'completed') {
          toast.success('Task marked as complete and will be removed upon admin approval', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } else {
          toast.info('Task marked as incomplete', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Show error toast on desktop
      if (window.innerWidth >= 640) {
        toast.error('Failed to update task. Please try again.', {
          position: "top-right",
          autoClose: 3000,
        });
      }
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

  const MAX_DESCRIPTION_LENGTH = 100; // Character limit before truncation

  const handleToggleDescription = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  // Show loading state
  if (loading) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <ClipboardList className="h-5 w-5 text-navy-600" />
            <span>Tasks Panel</span>
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

  // Show error state for missing chapterId
  if (!chapterId) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <ClipboardList className="h-5 w-5 text-navy-600" />
            <span>Tasks Panel</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8 text-gray-500">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-2">No Chapter Access</p>
            <p className="text-sm">You need to be associated with a chapter to manage tasks.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <ClipboardList className="h-5 w-5 text-navy-600" />
          <span>Tasks Panel</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Create Task Button */}
        <div className="mb-4">
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-navy-600 hover:bg-navy-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Task
          </Button>
        </div>

        {/* View All Tasks Button */}
        <div className="mb-4">
          <Button 
            onClick={() => setIsViewAllModalOpen(true)}
            variant="outline"
            className="w-full border-navy-600 text-navy-600 hover:bg-navy-50"
          >
            <Eye className="h-4 w-4 mr-2" />
            View All Assigned Tasks
          </Button>
        </div>

        {/* Task Modal */}
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateTask}
          chapterMembers={chapterMembers}
          creating={creating}
        />

        {/* View All Tasks Modal */}
        {isViewAllModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
              <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setIsViewAllModalOpen(false)} />
              
              {/* Modal Container - Full width with better constraints */}
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-6xl max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      All Chapter Tasks
                    </h3>
                    <button
                      onClick={() => setIsViewAllModalOpen(false)}
                      className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content - Flex to fill remaining space */}
                <div className="bg-white flex-1 overflow-y-auto px-2 sm:px-4 py-4">
                  <div className="w-full">
                    {allChapterTasks.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium mb-2">No tasks yet</p>
                        <p className="text-sm">Create your first task to get started!</p>
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {allChapterTasks.map((task) => (
                              <tr key={task.id} className="hover:bg-gray-50">
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(task.status)}
                                    <Badge className={getStatusColor(task.status)}>
                                      {task.status}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                    {task.description && (
                                      <div className="mt-1">
                                        <div className="text-sm text-gray-500">
                                          {expandedTaskId === task.id || task.description.length <= MAX_DESCRIPTION_LENGTH ? (
                                            <span>{task.description}</span>
                                          ) : (
                                            <span>
                                              {task.description.substring(0, MAX_DESCRIPTION_LENGTH)}
                                              <span className="text-gray-400">...</span>
                                            </span>
                                          )}
                                        </div>
                                        {task.description.length > MAX_DESCRIPTION_LENGTH && (
                                          <button
                                            onClick={() => handleToggleDescription(task.id)}
                                            className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 transition-colors"
                                          >
                                            <span>{expandedTaskId === task.id ? 'Show less' : 'Show more'}</span>
                                            {expandedTaskId === task.id ? (
                                              <ChevronUp className="h-3 w-3" />
                                            ) : (
                                              <ChevronDown className="h-3 w-3" />
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {task.assignee_name || 'Unassigned'}
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                  </Badge>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDate(task.due_date)}
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="relative group">
                                    <Button
                                      size="sm"
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="h-8 rounded-full px-3 sm:px-4 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1.5" />
                                      <span>Remove</span>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Existing Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium mb-2">No tasks yet</p>
              <p className="text-sm">Create your first task to get started!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  {/* Checkbox aligned with title */}
                  <Checkbox 
                    checked={task.status === 'completed'}
                    onCheckedChange={() => handleTaskToggle(task.id, task.status)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </h4>
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
                      <p className={`text-sm mb-2 ${task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-xs text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3" />
                        <span>{task.assignee_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3" />
                        <span className={task.is_overdue ? 'text-red-600 font-medium' : ''}>
                          {formatDate(task.due_date)}
                        </span>
                        {task.is_overdue && (
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 