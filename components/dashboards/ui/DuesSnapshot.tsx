'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertTriangle } from 'lucide-react';

// Mock data for dues snapshot
const duesData = {
  monthLabel: "March 2024",
  totalDue: 15000.00,
  paidCount: 45,
  overdueCount: 8,
  totalMembers: 65
};

export function DuesSnapshot() {
  const paidPercentage = (duesData.paidCount / duesData.totalMembers) * 100;
  const overduePercentage = (duesData.overdueCount / duesData.totalMembers) * 100;

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-navy-600" />
          <span>Dues Snapshot</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{duesData.monthLabel}</div>
            <div className="text-sm text-gray-600">Total Due: ${duesData.totalDue.toLocaleString()}</div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Paid</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-green-600">{duesData.paidCount}</span>
                <Badge className="bg-green-100 text-green-800 text-xs">
                  {paidPercentage.toFixed(0)}%
                </Badge>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overdue</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-red-600">{duesData.overdueCount}</span>
                {duesData.overdueCount > 0 && (
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    {overduePercentage.toFixed(0)}%
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {duesData.overdueCount > 0 && (
            <div className="flex items-center space-x-2 text-red-600 text-sm p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span>{duesData.overdueCount} members have overdue dues</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 