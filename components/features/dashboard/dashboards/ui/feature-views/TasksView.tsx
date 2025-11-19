'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, CheckCircle, Clock, UserCheck, Bell, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { supabase } from '@/lib/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Task } from '@/types/operations';

export function TasksView() {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<'deadline' | 'status' | 'priority' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const tasksPerPage = 10;

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!profile?.chapter_id) {
        return;
      }
      
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(full_name)
        `)
        .eq('chapter_id', profile.chapter_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.chapter_id]);

  useEffect(() => {
    if (chapterId) {
      loadTasks();
    }
  }, [chapterId, loadTasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate task statistics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    const compliance = total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;
    
    return {
      total,
      completed,
      pending,
      compliance
    };
  }, [tasks]);

  // Sort tasks based on selected column and direction
  const sortedTasks = useMemo(() => {
    const tasksCopy = [...tasks];
    
    if (!sortColumn) {
      // Default: sort by deadline (earliest first)
      return tasksCopy.sort((a, b) => {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return dateA - dateB;
      });
    }

    return tasksCopy.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'deadline':
          const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          comparison = dateA - dateB;
          break;
        case 'status':
          // Sort by status order: completed, pending, overdue
          const statusOrder: Record<string, number> = {
            'completed': 1,
            'pending': 2,
            'in_progress': 2,
            'overdue': 3
          };
          const statusA = statusOrder[a.status] || 99;
          const statusB = statusOrder[b.status] || 99;
          comparison = statusA - statusB;
          break;
        case 'priority':
          // Sort by priority order: urgent, high, medium, low
          const priorityOrder: Record<string, number> = {
            'urgent': 1,
            'high': 2,
            'medium': 3,
            'low': 4
          };
          const priorityA = priorityOrder[a.priority] || 99;
          const priorityB = priorityOrder[b.priority] || 99;
          comparison = priorityA - priorityB;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tasks, sortColumn, sortDirection]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedTasks.length / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const paginatedTasks = sortedTasks.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to page 1 when tasks change or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tasks.length, sortColumn, sortDirection]);

  const handleSort = (column: 'deadline' | 'status' | 'priority') => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handleSendReminder = async (taskId: string) => {
    // TODO: Implement reminder functionality
    console.log('Send reminder for task:', taskId);
  };

  const handleMarkComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);

      if (error) throw error;

      // Reload tasks
      loadTasks();
    } catch (error) {
      console.error('Error marking task as complete:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Tasks</h2>
          <p className="text-sm text-gray-600 mt-1">Track and manage chapter tasks</p>
        </div>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20 transition-all duration-300 hover:shadow-xl hover:shadow-navy-100/30 hover:scale-[1.02] hover:bg-white/90">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-navy-700 text-sm font-medium mb-1">Total Tasks</p>
                <p className="text-2xl font-semibold text-navy-900">
                  {loading ? '...' : taskStats.total}
                </p>
              </div>
              <Settings className="h-8 w-8 text-navy-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20 transition-all duration-300 hover:shadow-xl hover:shadow-navy-100/30 hover:scale-[1.02] hover:bg-white/90">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-navy-700 text-sm font-medium mb-1">Completed</p>
                <p className="text-2xl font-semibold text-navy-900">
                  {loading ? '...' : taskStats.completed}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-navy-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20 transition-all duration-300 hover:shadow-xl hover:shadow-navy-100/30 hover:scale-[1.02] hover:bg-white/90">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-navy-700 text-sm font-medium mb-1">Pending</p>
                <p className="text-2xl font-semibold text-navy-900">
                  {loading ? '...' : taskStats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-navy-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20 transition-all duration-300 hover:shadow-xl hover:shadow-navy-100/30 hover:scale-[1.02] hover:bg-white/90">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-navy-700 text-sm font-medium mb-1">Compliance</p>
                <p className="text-2xl font-semibold text-navy-900">
                  {loading ? '...' : `${taskStats.compliance}%`}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-navy-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Completion Progress */}
      <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20">
        <CardHeader className="border-b border-navy-100/30">
          <CardTitle className="text-navy-900">Task Completion Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overall Progress</span>
              <span className="font-medium text-sm">
                {loading ? '...' : taskStats.total > 0 ? `${((taskStats.completed / taskStats.total) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
            <Progress 
              value={loading ? 0 : taskStats.total > 0 ? ((taskStats.completed / taskStats.total) * 100) : 0} 
              className="h-3" 
            />
            
            <div className="flex justify-between items-center mt-6">
              <div>
                <p className="text-xl font-semibold text-green-600">
                  {loading ? '...' : taskStats.completed}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-yellow-600">
                  {loading ? '...' : taskStats.pending}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Task Tracking Table */}
      <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20">
        <CardHeader className="pb-2 border-b border-navy-100/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-navy-900">
              <Settings className="h-5 w-5 mr-2 text-navy-600" />
              Member Task Tracking
            </CardTitle>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {sortedTasks.length} {sortedTasks.length === 1 ? 'task' : 'tasks'}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="h-8 px-3 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 p-0 text-xs flex-shrink-0 ${
                          currentPage === page
                            ? 'bg-navy-600 text-white hover:bg-navy-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3 text-xs"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              )}
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Send Reminders
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="font-medium mb-2">No tasks found</p>
              <p className="text-sm">No tasks have been assigned to chapter members yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('deadline')}
                        className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                      >
                        <span>Deadline</span>
                        {sortColumn === 'deadline' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                      >
                        <span>Status</span>
                        {sortColumn === 'status' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('priority')}
                        className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                      >
                        <span>Priority</span>
                        {sortColumn === 'priority' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {(task as any).assignee?.full_name || 'Unassigned'}
                      </TableCell>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'No due date'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {task.status === 'completed' ? (
                          <span className="text-sm text-green-600">Done</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendReminder(task.id)}
                            className="text-xs"
                          >
                            <Bell className="h-3 w-3 mr-1" />
                            Follow Up
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

