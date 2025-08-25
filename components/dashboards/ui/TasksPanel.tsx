'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, User, Calendar, AlertTriangle, Plus, Loader2, X } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest } from '@/types/operations';
import { getTasksByChapter, updateTask, getChapterMembers, subscribeToTasks } from '@/lib/services/taskService';
import { useProfile } from '@/lib/hooks/useProfile';
import { TaskModal } from '@/components/ui/TaskModal';

interface TasksPanelProps {
  chapterId?: string;
}

export function TasksPanel({ chapterId }: TasksPanelProps) {
  const { profile } = useProfile();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [chapterMembers, setChapterMembers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [newTask, setNewTask] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    assignee_id: '',
    chapter_id: chapterId || '',
    due_date: '',
    priority: 'medium'
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debug logging
  console.log('TasksPanel render:', { 
    chapterId, 
    profileId: profile?.id, 
    profileChapterId: profile?.chapter_id,
    loading, 
    tasksCount: tasks.length 
  });

  // Load tasks and chapter members
  useEffect(() => {
    console.log('TasksPanel useEffect triggered:', { 
      chapterId, 
      profileId: profile?.id,
      profileChapterId: profile?.chapter_id 
    });
    
    if (!chapterId) {
      console.log('No chapterId provided, setting loading to false');
      setLoading(false);
      return;
    }

    if (!profile?.id) {
      console.log('No profile ID, setting loading to false');
      setLoading(false);
      return;
    }

    console.log('Starting to load data for chapter:', chapterId);
    loadAllData();
  }, [chapterId, profile?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (chapterId) {
      const subscription = subscribeToTasks(chapterId, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(task => 
            task.id === payload.new.id ? payload.new : task
          ));
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(task => task.id !== payload.old.id));
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [chapterId]);

  const loadAllData = async () => {
    console.log('loadAllData started');
    try {
      setLoading(true);
      console.log('Loading tasks for chapter:', chapterId);
      
      // Load both tasks and members in parallel
      const [tasksData, membersData] = await Promise.all([
        getTasksByChapter(chapterId!),
        getChapterMembers(chapterId!)
      ]);
      
      console.log('Data loaded:', { tasks: tasksData.length, members: membersData.length });
      
      setTasks(tasksData);
      setChapterMembers(membersData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays on error so UI can still render
      setTasks([]);
      setChapterMembers([]);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    if (!chapterId || !profile?.id) return;
    
    try {
      setCreating(true);
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskData,
          chapter_id: chapterId,
          assigned_by: profile.id
        })
      });

      if (!response.ok) throw new Error('Failed to create task');

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

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'overdue': return 'Overdue';
      default: return 'Unknown';
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

        {/* Task Modal */}
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateTask}
          chapterMembers={chapterMembers}
          creating={creating}
        />

        {/* Tasks List */}
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
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                  <div className="flex space-x-2">
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusText(task.status)}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
                
                {task.description && (
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
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
                
                <div className="flex space-x-2">
                  <Select 
                    value={task.status} 
                    onValueChange={(value) => handleStatusChange(task.id, value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
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
                    <SelectTrigger className="h-7 text-xs">
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
                    <SelectTrigger className="h-7 text-xs">
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
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 