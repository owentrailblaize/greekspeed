'use client';


import { useState, useEffect, useMemo } from 'react';
import { CheckSquare, Clock, AlertCircle, Users, Calendar, FileText, Plus, Loader2, Trash2, Upload, Download, ChevronLeft, ChevronRight, Check, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest } from '@/types/operations';
import { getTasksByChapter, updateTask, getChapterMembersForTasks } from '@/lib/services/taskService';
import { TaskModal } from '@/components/ui/TaskModal';
import { supabase } from '@/lib/supabase/client';

import { toast } from 'react-toastify';
import { documentUploadService } from '@/lib/services/documentUploadService';

interface ChapterDocument {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  file_size: number | null;
  owner_id: string | null;
  chapter_id: string | null;
  visibility: string[];
  document_type: 'chapter_document' | 'general';
  created_at: string;
  updated_at: string;
  owner_name?: string;
  tags?: string[];
  storage_path?: string;
}

export function MobileAdminTasksPage() {

  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;
  const [activeTab, setActiveTab] = useState<'tasks' | 'docs'>('tasks');
  
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);

  const [tasksLoading, setTasksLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'>('all');

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [chapterMembers, setChapterMembers] = useState<Array<{ id: string; full_name: string; role: string; chapter_role: string | null }>>([]);

  const [tasksPage, setTasksPage] = useState(1);
  const tasksPerPage = 6;

  // Docs state
  const [documents, setDocuments] = useState<ChapterDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    documentType: 'general' as 'chapter_document' | 'general',
    visibility: ['chapter_all'] as string[],
  });
  const [docsPage, setDocsPage] = useState(1);
  const docsPerPage = 6;

  // Load tasks and chapter members
  useEffect(() => {

    if (!chapterId || activeTab !== 'tasks') return;
    if (!profile?.id) {

      setTasksLoading(false);
      return;
    }

    loadAllData();
  }, [chapterId, profile?.id, activeTab]);

  // Load documents
  useEffect(() => {
    if (!chapterId || activeTab !== 'docs') return;
    loadDocuments();
  }, [chapterId, activeTab]);

  // Real-time subscription for task updates
  useEffect(() => {

    if (chapterId && activeTab === 'tasks') {
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

  }, [chapterId, activeTab]);

  // Reset pages when switching tabs
  useEffect(() => {
    if (activeTab !== 'tasks') {
      setTasksPage(1);
    }
    if (activeTab !== 'docs') {
      setDocsPage(1);
    }
  }, [activeTab]);

  const loadAllData = async () => {
    try {

      setTasksLoading(true);
      
      const [allTasksData, membersData] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('chapter_id', chapterId!)
          .order('due_date', { ascending: true }),

        getChapterMembersForTasks(chapterId!)
      ]);
      
      setTasks(allTasksData.data || []);
      setChapterMembers(membersData);
    } catch (error) {

      console.error('Error loading data:', error);
      setTasks([]);
      setChapterMembers([]);
    } finally {

      setTasksLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setDocsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDocuments([]);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('chapter_id, role')
        .eq('id', user.id)
        .single();

      if (!profile?.chapter_id) {
        setDocuments([]);
      return;
    }


      let visibilityFilter = ['chapter_all', 'active_members', 'alumni', 'admins'];
      if (profile.role === 'active_member') {
        visibilityFilter = ['chapter_all', 'active_members'];
      } else if (profile.role === 'alumni') {
        visibilityFilter = ['chapter_all', 'alumni'];
      }

      const { data: documents, error } = await supabase
        .from('documents')
        .select(`
          *,
          profiles!documents_owner_id_fkey(full_name)
        `)
        .eq('chapter_id', profile.chapter_id)
        .eq('is_active', true)
        .overlaps('visibility', visibilityFilter)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        setDocuments([]);
      } else {
        const transformedDocuments: ChapterDocument[] = (documents || []).map(doc => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          file_url: doc.file_url,
          file_type: doc.mime_type,
          file_size: doc.file_size,
          owner_id: doc.owner_id,
          chapter_id: doc.chapter_id,
          visibility: doc.visibility,
          document_type: doc.document_type === 'chapter_document' ? 'chapter_document' : 'general',
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          owner_name: doc.profiles?.full_name,
          tags: doc.tags || [],
          storage_path: doc.storage_path
        }));
        
        setDocuments(transformedDocuments);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    if (!chapterId || !profile?.id) return;
    
    try {
      setCreating(true);
      
      if (Array.isArray(taskData.assignee_id)) {
        const tasks = await Promise.all(

          taskData.assignee_id.map((assigneeId) => {
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
        
        const errors = tasks.filter(result => result.error);
        if (errors.length > 0) {
          throw new Error(`Failed to create some tasks: ${errors.map(e => e.error?.message).join(', ')}`);
        }
      } else {

        const { error } = await supabase
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

        if (error) {
          throw new Error(`Failed to create task: ${error.message}`);
        }

      }

      setIsTaskModalOpen(false);
      await loadAllData();

      toast.success('Task created successfully!');
    } catch (error) {

      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const handleReassign = async (taskId: string, newAssigneeId: string) => {
    try {
      await updateTask(taskId, { assignee_id: newAssigneeId });
    } catch (error) {
      console.error('Error reassigning task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      setTasks(prev => prev.filter(task => task.id !== taskId));

      toast.success('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);

      toast.error('Failed to delete task');
    }
  };

  const handleMarkComplete = async (taskId: string) => {
    try {
      await updateTask(taskId, { status: 'completed' as TaskStatus });
      toast.success('Task marked as complete!');
    } catch (error) {
      console.error('Error marking task as complete:', error);
      toast.error('Failed to mark task as complete');
    }
  };

  const handleUnassign = async (taskId: string) => {
    try {
      await updateTask(taskId, { assignee_id: null });
      toast.success('Task unassigned successfully!');
    } catch (error) {
      console.error('Error unassigning task:', error);
      toast.error('Failed to unassign task');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadFormData.title) {
        setUploadFormData(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, '')
        }));
      }
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !chapterId) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      
      const uploadData = {
        title: uploadFormData.title,
        description: uploadFormData.description,
        documentType: uploadFormData.documentType,
        visibility: uploadFormData.visibility,
        tags: [],
        effectiveDate: new Date().toISOString().split('T')[0],
        file: selectedFile
      };

      await documentUploadService.uploadDocument(uploadData);
      
      toast.success('Document uploaded successfully!');
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadFormData({
        title: '',
        description: '',
        documentType: 'general',
        visibility: ['chapter_all'],
      });
      await loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: ChapterDocument) => {
    try {
      if (doc.file_url) {
        const link = document.createElement('a');
        link.href = doc.file_url;
        link.download = `${doc.title}.${doc.file_type || 'pdf'}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download started!');
      } else {
        toast.error('Document not accessible for download');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed. Please try again.');
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

      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {

      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
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


  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-4 w-4" />;
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileText className="h-4 w-4 text-green-600" />;
    if (fileType.includes('word')) return <FileText className="h-4 w-4 text-blue-600" />;
    return <FileText className="h-4 w-4" />;
  };

  const getFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Filter and paginate tasks
  const filteredTasks = useMemo(() => {
    if (activeFilter === 'all') return tasks;
    return tasks.filter(t => t.status === activeFilter);
  }, [tasks, activeFilter]);

  const paginatedTasks = useMemo(() => {
    const startIndex = (tasksPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    return filteredTasks.slice(startIndex, endIndex);
  }, [filteredTasks, tasksPage, tasksPerPage]);

  const tasksTotalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const tasksTotal = filteredTasks.length;
  const tasksStartIndex = (tasksPage - 1) * tasksPerPage;
  const tasksEndIndex = Math.min(tasksPage * tasksPerPage, tasksTotal);
  const tasksStart = tasksStartIndex + 1;

  // Paginate documents
  const paginatedDocs = useMemo(() => {
    const startIndex = (docsPage - 1) * docsPerPage;
    const endIndex = startIndex + docsPerPage;
    return documents.slice(startIndex, endIndex);
  }, [documents, docsPage, docsPerPage]);

  const docsTotalPages = Math.ceil(documents.length / docsPerPage);
  const docsTotal = documents.length;
  const docsStartIndex = (docsPage - 1) * docsPerPage;
  const docsEndIndex = Math.min(docsPage * docsPerPage, docsTotal);
  const docsStart = docsStartIndex + 1;

  const filterButtons = [
    { id: 'all' as const, label: 'All', count: tasks.length },
    { id: 'pending' as const, label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
    { id: 'in_progress' as const, label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
    { id: 'completed' as const, label: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
    { id: 'overdue' as const, label: 'Overdue', count: tasks.filter(t => t.status === 'overdue').length }
  ];

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

    <div className="min-h-screen bg-gray-50 pt-0 pb-20 px-4">
      <div className="max-w-md mx-auto">

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="tasks" className="text-xs">Tasks</TabsTrigger>
            <TabsTrigger value="docs" className="text-xs">Docs</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
        {/* Create Task Button */}
          <Button 

              onClick={() => setIsTaskModalOpen(true)}
              className="rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 w-full md:w-auto transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Task
          </Button>

        {/* Filter Buttons */}
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

        {/* Tasks List */}

            {tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-navy-600" />
              </div>
            ) : filteredTasks.length === 0 ? (
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

              <>
                <div className="space-y-2">
                  {paginatedTasks.map((task) => (
                    <Card key={task.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-900 text-sm flex-1">{task.title}</h3>
                          <div className="flex space-x-2 ml-2">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
                
                {task.description && (

                          <p className="text-xs text-gray-600">{task.description}</p>
                )}
                

                        <div className="space-y-1 text-xs text-gray-600">
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
                

                        <div className="flex space-x-2 pt-2 border-t border-gray-100">
                          {task.status !== 'completed' ? (
                            <Button
                              size="sm"
                              onClick={() => handleMarkComplete(task.id)}
                              className="h-7 px-3 text-xs flex-1 rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300"
                              variant="outline"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark Complete
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUnassign(task.id)}
                                className="h-7 px-3 text-xs flex-1 rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300"
                                variant="outline"
                              >
                                <UserMinus className="h-3 w-3 mr-1" />
                                Unassign
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDeleteTask(task.id)}
                                className="h-7 px-3 text-xs flex-1 rounded-full bg-white/80 backdrop-blur-md border border-red-300 shadow-lg shadow-red-100/20 hover:shadow-xl hover:shadow-red-100/30 hover:bg-red-50/90 text-red-600 hover:text-red-700 hover:border-red-400 transition-all duration-300"
                                variant="outline"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination Controls */}
                {tasksTotalPages > 1 && (
                  <div className="flex flex-col items-center space-y-3 pt-4 border-t border-gray-200 mt-4">
                    <div className="text-xs text-gray-600">
                      Showing {tasksStart} to {tasksEndIndex} of {tasksTotal} tasks
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTasksPage(prev => Math.max(1, prev - 1))}
                        disabled={tasksPage === 1 || tasksLoading}
                        className="h-8 px-3 text-xs"
                      >
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1 px-2">
                        <span className="text-xs text-gray-600">Page</span>
                        <span className="text-xs font-medium">{tasksPage}</span>
                        <span className="text-xs text-gray-600">of</span>
                        <span className="text-xs font-medium">{tasksTotalPages}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTasksPage(prev => Math.min(tasksTotalPages, prev + 1))}
                        disabled={tasksPage === tasksTotalPages || tasksLoading}
                        className="h-8 px-3 text-xs"
                      >
                        Next
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                    {tasksTotalPages <= 5 && (
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: tasksTotalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={tasksPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTasksPage(page)}
                            className={`h-8 w-8 p-0 text-xs ${
                              tasksPage === page
                                ? 'bg-navy-600 text-white hover:bg-navy-700'
                                : 'hover:bg-gray-50'
                            }`}
                            disabled={tasksLoading}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Docs Tab */}
          <TabsContent value="docs" className="space-y-4">
            {/* Upload Button */}
            <Button 
              onClick={() => setShowUploadModal(true)}
              className="rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 w-full md:w-auto transition-all duration-300"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>

            {/* Stats */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Documents</p>
                    <p className="text-xl font-semibold">{documents.length}</p>
                  </div>
                  <FileText className="h-5 w-5 text-navy-500" />
                </div>
              </CardContent>
            </Card>

            {/* Documents List */}
            {docsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-navy-600" />
              </div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No documents found</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUploadModal(true)}
                    size="sm"
                  >
                    Upload First Document
                    </Button>

                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-2">
                  {paginatedDocs.map((doc) => (
                    <Card key={doc.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1 min-w-0">
                            {getFileIcon(doc.file_type)}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                              {doc.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{doc.description}</p>
                  )}
                </div>
              </div>

                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            {doc.file_size && (
                              <span>{getFileSize(doc.file_size)}</span>
                            )}
                            {doc.owner_name && (
                              <>
                                <span>•</span>
                                <span>{doc.owner_name}</span>
                              </>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(doc)}
                            className="h-7 px-2"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination Controls */}
                {docsTotalPages > 1 && (
                  <div className="flex flex-col items-center space-y-3 pt-4 border-t border-gray-200 mt-4">
                    <div className="text-xs text-gray-600">
                      Showing {docsStart} to {docsEndIndex} of {docsTotal} documents
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDocsPage(prev => Math.max(1, prev - 1))}
                        disabled={docsPage === 1 || docsLoading}
                        className="h-8 px-3 text-xs"
                      >
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1 px-2">
                        <span className="text-xs text-gray-600">Page</span>
                        <span className="text-xs font-medium">{docsPage}</span>
                        <span className="text-xs text-gray-600">of</span>
                        <span className="text-xs font-medium">{docsTotalPages}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDocsPage(prev => Math.min(docsTotalPages, prev + 1))}
                        disabled={docsPage === docsTotalPages || docsLoading}
                        className="h-8 px-3 text-xs"
                      >
                        Next
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                    {docsTotalPages <= 5 && (
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: docsTotalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={docsPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setDocsPage(page)}
                            className={`h-8 w-8 p-0 text-xs ${
                              docsPage === page
                                ? 'bg-navy-600 text-white hover:bg-navy-700'
                                : 'hover:bg-gray-50'
                            }`}
                            disabled={docsLoading}
                          >
                            {page}
                          </Button>
            ))}
          </div>
        )}

                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Task Modal */}
        <TaskModal

          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSubmit={handleCreateTask}
          chapterMembers={chapterMembers}
          creating={creating}
        />


        {/* Upload Document Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">File</label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full text-sm"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  {selectedFile && (
                    <p className="text-xs text-gray-600 mt-1">{selectedFile.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={uploadFormData.title}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Document title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={uploadFormData.description}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setUploadFormData({
                        title: '',
                        description: '',
                        documentType: 'general',
                        visibility: ['chapter_all'],
                      });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUploadDocument}
                    disabled={!selectedFile || !uploadFormData.title || uploading}
                    className="flex-1 bg-navy-600 hover:bg-navy-700"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

