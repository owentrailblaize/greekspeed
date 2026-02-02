'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';

// Mock data for compliance snapshot
const complianceData = {
  openItems: 12,
  overdueItems: 3,
  totalItems: 25,
  completedItems: 10
};

export function ComplianceSnapshot() {
  const completionPercentage = (complianceData.completedItems / complianceData.totalItems) * 100;

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Shield className="h-5 w-5 text-navy-600" />
          <span>Compliance Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Open Items</span>
              <Badge className="bg-yellow-100 text-yellow-800">
                {complianceData.openItems}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overdue Items</span>
              <div className="flex items-center space-x-2">
                <Badge className="bg-red-100 text-red-800">
                  {complianceData.overdueItems}
                </Badge>
                {complianceData.overdueItems > 0 && (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed</span>
              <Badge className="bg-green-100 text-green-800">
                {complianceData.completedItems}
              </Badge>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Overall Progress</span>
              <span className="text-gray-900 font-medium">{completionPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-navy-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <Button variant="outline" className="w-full text-navy-600 border-navy-600 hover:bg-navy-50">
              View Checklist
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 