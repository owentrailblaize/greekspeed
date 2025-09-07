'use client';

import { Zap, Users, DollarSign, FileText, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MobileQuickActionsPage() {
  const quickActions = [
    {
      id: 'add-member',
      title: 'Add Member',
      description: 'Add a new member to the chapter',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      id: 'collect-dues',
      title: 'Collect Dues',
      description: 'Process member dues payments',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      id: 'upload-docs',
      title: 'Upload Documents',
      description: 'Upload compliance documents',
      icon: FileText,
      color: 'bg-purple-500'
    },
    {
      id: 'create-event',
      title: 'Create Event',
      description: 'Schedule a new chapter event',
      icon: Calendar,
      color: 'bg-orange-500'
    },
    {
      id: 'manage-settings',
      title: 'Manage Settings',
      description: 'Update chapter settings',
      icon: Settings,
      color: 'bg-gray-500'
    }
  ];

  const handleActionClick = (actionId: string) => {
    // Mock functionality - would be implemented based on actual requirements
    console.log(`Quick action clicked: ${actionId}`);
    // You can add actual navigation or modal opening logic here
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-6">
          <Zap className="h-6 w-6 text-navy-600" />
          <h1 className="text-xl font-semibold text-gray-900">Quick Actions</h1>
        </div>

        {/* Quick Actions List */}
        <div className="space-y-0">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div 
                key={action.id}
                className={`px-4 py-4 ${index !== quickActions.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <button
                  onClick={() => handleActionClick(action.id)}
                  className="w-full flex items-center space-x-3 text-left hover:bg-gray-50 rounded-lg p-2 -m-2"
                >
                  <div className={`${action.color} rounded-lg p-2 flex-shrink-0`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm">{action.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Additional Admin Tools */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Tools</h2>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={() => handleActionClick('member-management')}
            >
              <Users className="h-4 w-4 mr-3" />
              Member Management
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={() => handleActionClick('financial-reports')}
            >
              <DollarSign className="h-4 w-4 mr-3" />
              Financial Reports
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={() => handleActionClick('compliance-dashboard')}
            >
              <FileText className="h-4 w-4 mr-3" />
              Compliance Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
