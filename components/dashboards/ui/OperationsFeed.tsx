'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, DollarSign, FileText, Megaphone, CheckCircle, Lock } from 'lucide-react';

// Mock data for operations feed
const operationsFeed = [
  {
    id: 1,
    type: 'rsvp',
    title: 'New RSVP for Spring Formal',
    meta: 'Sarah Johnson confirmed attendance',
    createdAt: '2 minutes ago',
    icon: Users
  },
  {
    id: 2,
    type: 'payment',
    title: 'Dues Payment Received',
    meta: 'Michael Chen paid $150.00',
    createdAt: '15 minutes ago',
    icon: DollarSign
  },
  {
    id: 3,
    type: 'task',
    title: 'Task Completed',
    meta: 'Community service hours submitted by Alex Thompson',
    createdAt: '1 hour ago',
    icon: CheckCircle
  },
  {
    id: 4,
    type: 'document',
    title: 'New Document Uploaded',
    meta: 'Meeting minutes uploaded by Jennifer Rodriguez',
    createdAt: '2 hours ago',
    icon: FileText
  },
  {
    id: 5,
    type: 'announcement',
    title: 'Announcement Sent',
    meta: 'Spring formal details sent to 65 members',
    createdAt: '3 hours ago',
    icon: Megaphone
  }
];

export function OperationsFeed() {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'rsvp': return 'bg-blue-100 text-blue-800';
      case 'payment': return 'bg-green-100 text-green-800';
      case 'task': return 'bg-purple-100 text-purple-800';
      case 'document': return 'bg-orange-100 text-orange-800';
      case 'announcement': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rsvp': return 'RSVP';
      case 'payment': return 'Payment';
      case 'task': return 'Task';
      case 'document': return 'Document';
      case 'announcement': return 'Announcement';
      default: return 'Other';
    }
  };

  return (
    <Card className="bg-white relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 bg-white bg-opacity-90 z-10 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <Lock className="h-10 w-10 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-3 sm:mb-2" />
          <p className="text-base sm:text-sm font-medium text-gray-600">Operations Feed</p>
          <p className="text-sm sm:text-xs text-gray-500">Coming Soon</p>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Clock className="h-5 w-5 text-navy-600" />
          <span>Operations Feed</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {operationsFeed.map((item) => {
            const IconComponent = item.icon;
            return (
              <div key={item.id} className="flex items-start space-x-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 shrink-0">
                  <IconComponent className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                    <Badge className={getTypeColor(item.type)}>
                      {getTypeLabel(item.type)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{item.meta}</p>
                  <p className="text-xs text-gray-500">{item.createdAt}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="pt-4 border-t border-gray-100">
          <Button 
            variant="outline" 
            className="w-full text-navy-600 border-navy-600 hover:bg-navy-50 opacity-60 cursor-not-allowed"
            disabled
            title="Operations feed coming soon!"
          >
            <Lock className="h-4 w-4 mr-2 text-gray-400" />
            View All Activity
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 