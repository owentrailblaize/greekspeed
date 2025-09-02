'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertTriangle, Lock } from 'lucide-react';

// Mock data for dues status
const duesData = {
  period_label: "Spring 2024",
  amount_due: 150.00,
  due_date: "March 31, 2024",
  status: "unpaid" as 'paid' | 'unpaid' | 'overdue'
};

export function DuesStatusCard() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'unpaid': return 'Unpaid';
      case 'overdue': return 'Overdue';
      default: return 'Unknown';
    }
  };

  const handlePayNow = () => {
    console.log('Opening Stripe portal...');
    // Placeholder for Stripe integration
  };

  return (
    <Card className="bg-white relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 bg-white bg-opacity-90 z-10 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <Lock className="h-10 w-10 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-3 sm:mb-2" />
          <p className="text-base sm:text-sm font-medium text-gray-600">Dues Management</p>
          <p className="text-sm sm:text-xs text-gray-500">Coming Soon</p>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-navy-600" />
          <span>Dues Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4 sm:space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-base sm:text-sm text-gray-600 break-words">{duesData.period_label}</span>
            <Badge className={`${getStatusColor(duesData.status)} text-sm sm:text-xs`}>
              {getStatusText(duesData.status)}
            </Badge>
          </div>
          
          {duesData.status !== 'paid' && (
            <>
              <div className="text-center">
                <div className="text-3xl sm:text-2xl font-bold text-gray-900">${duesData.amount_due.toFixed(2)}</div>
                <div className="text-base sm:text-sm text-gray-600 break-words">Due {duesData.due_date}</div>
              </div>
              
              {duesData.status === 'overdue' && (
                <div className="flex items-center justify-center space-x-2 text-red-600 text-base sm:text-sm">
                  <AlertTriangle className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="break-words">Payment is overdue</span>
                </div>
              )}
              
              <Button 
                onClick={handlePayNow}
                className="w-full bg-navy-600 hover:bg-navy-700 opacity-60 cursor-not-allowed h-12 sm:h-10"
                disabled
                title="Dues payment functionality coming soon!"
              >
                <span className="text-base sm:text-sm">Pay Now</span>
                <Lock className="h-4 w-4 sm:h-3 sm:w-3 ml-2 text-gray-400" />
              </Button>
            </>
          )}
          
          {duesData.status === 'paid' && (
            <div className="text-center text-green-600 text-base sm:text-sm">
              ✅ All dues are current
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 