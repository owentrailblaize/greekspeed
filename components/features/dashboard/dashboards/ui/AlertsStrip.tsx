'use client';

import { AlertCircle, DollarSign, Users, Calendar, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Remove mock data - we'll implement real alerts later
// const mockAlerts = [
//   { id: 1, type: 'dues', message: '5 overdue dues payments', severity: 'high', count: 5 },
//   { id: 2, type: 'membership', message: '3 pending membership applications', severity: 'medium', count: 3 },
//   { id: 3, type: 'events', message: '2 upcoming events need approval', severity: 'low', count: 2 }
// ];

export function AlertsStrip() {
  // For now, we'll have no alerts - component won't render
  const alerts: any[] = [];

  // Don't render anything if there are no alerts
  if (alerts.length === 0) {
    return null;
  }

  // This code will only run when we implement real alerts later
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'dues':
        return <DollarSign className="h-4 w-4" />;
      case 'membership':
        return <Users className="h-4 w-4" />;
      case 'events':
        return <Calendar className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-center space-x-2">
              {getAlertIcon(alert.type)}
              <span className="text-sm font-medium text-gray-900">
                {alert.message}
              </span>
              <Badge 
                variant="secondary" 
                className={`${getSeverityColor(alert.severity)}`}
              >
                {alert.count}
              </Badge>
            </div>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            View All
          </Button>
          <Button variant="outline" size="sm">
            Dismiss All
          </Button>
        </div>
      </div>
    </div>
  );
} 