'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, X } from 'lucide-react';

// Mock data for alerts
const alertsData = [
  {
    id: 1,
    priority: 'critical',
    message: '5 overdue dues payments',
    count: 5,
    type: 'dues'
  },
  {
    id: 2,
    priority: 'critical',
    message: '2 overdue compliance items',
    count: 2,
    type: 'compliance'
  }
];

export function AlertsStrip() {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());

  const handleDismiss = (alertId: number) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };

  const activeAlerts = alertsData.filter(alert => !dismissedAlerts.has(alert.id));

  if (activeAlerts.length === 0) {
    return null;
  }

  // Show only the highest priority alert
  const topAlert = activeAlerts[0];

  return (
    <Card className="bg-red-50 border-red-200">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div className="flex items-center space-x-2">
              <Badge className="bg-red-100 text-red-800">
                {topAlert.count}
              </Badge>
              <span className="text-sm font-medium text-red-800">
                {topAlert.message}
              </span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleDismiss(topAlert.id)}
            className="text-red-600 hover:text-red-800 hover:bg-red-100 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 