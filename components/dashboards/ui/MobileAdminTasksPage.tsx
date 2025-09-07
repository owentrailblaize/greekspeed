'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Clock, AlertCircle, Users, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/lib/hooks/useProfile';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  assignedTo: string;
  category: 'compliance' | 'financial' | 'events' | 'membership';
}

export function MobileAdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  // Mock tasks data - replace with actual API call
  useEffect(() => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Review Member Applications',
        description: 'Review and approve pending member applications',
        priority: 'high',
        status: 'pending',
        dueDate: '2024-01-15',
        assignedTo: 'Admin Team',
        category: 'membership'
      },
      {
        id: '2',
        title: 'Submit Financial Report',
        description: 'Prepare and submit monthly financial report to nationals',
        priority: 'high',
        status: 'in_progress',
        dueDate: '2024-01-20',
        assignedTo: 'Treasurer',
        category: 'financial'
      },
      {
        id: '3',
        title: 'Update Compliance Documents',
        description: 'Update chapter bylaws and compliance documentation',
        priority: 'medium',
        status: 'pending',
        dueDate: '2024-01-25',
        assignedTo: 'Secretary',
        category: 'compliance'
      },
      {
        id: '4',
        title: 'Plan Spring Formal',
        description: 'Coordinate venue booking and logistics for spring formal',
        priority: 'medium',
        status: 'in_progress',
        dueDate: '2024-02-01',
        assignedTo: 'Social Chair',
        category: 'events'
      }
    ];

    setTimeout(() => {
      setTasks(mockTasks);
      setLoading(false);
    }, 1000);
  }, [chapterId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'compliance': return FileText;
      case 'financial': return Users;
      case 'events': return Calendar;
      case 'membership': return Users;
      default: return CheckSquare;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'all') return true;
    return task.status === activeFilter;
  });

  const filterButtons = [
    { id: 'all' as const, label: 'All', count: tasks.length },
    { id: 'pending' as const, label: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
    { id: 'in_progress' as const, label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length },
    { id: 'completed' as const, label: 'Completed', count: tasks.filter(t => t.status === 'completed').length }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Loading tasks...</p>
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
            {filteredTasks.map((task, index) => {
              const CategoryIcon = getCategoryIcon(task.category);
              return (
                <div 
                  key={task.id} 
                  className={`px-4 py-4 ${index !== filteredTasks.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <CategoryIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm mb-1">{task.title}</h3>
                      <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        <span>Assigned: {task.assignedTo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
