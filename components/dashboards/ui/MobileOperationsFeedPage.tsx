'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, Users, DollarSign, Calendar } from 'lucide-react';
import { useProfile } from '@/lib/hooks/useProfile';

interface Operation {
  id: string;
  title: string;
  description: string;
  type: 'financial' | 'membership' | 'events' | 'compliance' | 'system';
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  timestamp: string;
  user: string;
  priority: 'high' | 'medium' | 'low';
}

export function MobileOperationsFeedPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'in_progress' | 'pending' | 'failed'>('all');
  
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  // Mock operations data - replace with actual API call
  useEffect(() => {
    const mockOperations: Operation[] = [
      {
        id: '1',
        title: 'Monthly Dues Collection',
        description: 'Processed dues payments for 45 members',
        type: 'financial',
        status: 'completed',
        timestamp: '2024-01-15T10:30:00Z',
        user: 'Treasurer',
        priority: 'high'
      },
      {
        id: '2',
        title: 'New Member Onboarding',
        description: 'Added 3 new members to the chapter roster',
        type: 'membership',
        status: 'completed',
        timestamp: '2024-01-14T14:20:00Z',
        user: 'Membership Chair',
        priority: 'medium'
      },
      {
        id: '3',
        title: 'Event Registration System',
        description: 'Setting up registration for Spring Formal',
        type: 'events',
        status: 'in_progress',
        timestamp: '2024-01-13T09:15:00Z',
        user: 'Social Chair',
        priority: 'medium'
      },
      {
        id: '4',
        title: 'Compliance Document Review',
        description: 'Reviewing updated bylaws for approval',
        type: 'compliance',
        status: 'pending',
        timestamp: '2024-01-12T16:45:00Z',
        user: 'Secretary',
        priority: 'high'
      },
      {
        id: '5',
        title: 'System Backup',
        description: 'Automated backup failed - manual intervention required',
        type: 'system',
        status: 'failed',
        timestamp: '2024-01-11T02:00:00Z',
        user: 'System',
        priority: 'high'
      },
      {
        id: '6',
        title: 'Budget Planning Meeting',
        description: 'Scheduled quarterly budget review meeting',
        type: 'financial',
        status: 'completed',
        timestamp: '2024-01-10T11:00:00Z',
        user: 'Treasurer',
        priority: 'low'
      }
    ];

    setTimeout(() => {
      setOperations(mockOperations);
      setLoading(false);
    }, 1000);
  }, [chapterId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Clock;
      case 'pending': return Clock;
      case 'failed': return AlertCircle;
      default: return Activity;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial': return DollarSign;
      case 'membership': return Users;
      case 'events': return Calendar;
      case 'compliance': return AlertCircle;
      case 'system': return Activity;
      default: return Activity;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredOperations = operations.filter(op => {
    if (activeFilter === 'all') return true;
    return op.status === activeFilter;
  });

  const filterButtons = [
    { id: 'all' as const, label: 'All', count: operations.length },
    { id: 'completed' as const, label: 'Completed', count: operations.filter(o => o.status === 'completed').length },
    { id: 'in_progress' as const, label: 'In Progress', count: operations.filter(o => o.status === 'in_progress').length },
    { id: 'pending' as const, label: 'Pending', count: operations.filter(o => o.status === 'pending').length },
    { id: 'failed' as const, label: 'Failed', count: operations.filter(o => o.status === 'failed').length }
  ];

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Loading operations...</p>
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
          <Activity className="h-6 w-6 text-navy-600" />
          <h1 className="text-xl font-semibold text-gray-900">Operations Feed</h1>
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

        {/* Operations List */}
        {filteredOperations.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {activeFilter === 'all' ? 'No operations found' : `No ${activeFilter} operations`}
            </p>
            <p className="text-gray-400 text-sm">
              {activeFilter === 'all' ? 'Operations will appear here as they happen!' : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredOperations.map((operation, index) => {
              const StatusIcon = getStatusIcon(operation.status);
              const TypeIcon = getTypeIcon(operation.type);
              return (
                <div 
                  key={operation.id} 
                  className={`px-4 py-4 ${index !== filteredOperations.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <TypeIcon className={`h-5 w-5 ${getPriorityColor(operation.priority)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">{operation.title}</h3>
                        <StatusIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{operation.description}</p>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(operation.status)}`}>
                          {operation.status.replace('_', ' ')}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600`}>
                          {operation.type}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatTimestamp(operation.timestamp)}</span>
                        <span>By: {operation.user}</span>
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
