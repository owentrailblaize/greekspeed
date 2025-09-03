'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Trash2
} from 'lucide-react';

interface SubscriptionData {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  price: {
    id: string;
    amount: number;
    currency: string;
    interval: string;
  };
  paymentMethod: any;
  customer: {
    id: string;
    email: string;
    name: string;
  };
  upcomingInvoice: {
    amount: number;
    currency: string;
    nextPaymentDate: string;
    invoiceDate: string;
  } | null;
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user && (profile?.role === 'admin' || profile?.role === 'alumni')) {
      fetchSubscription();
    }
  }, [user, profile]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch(`/api/subscription?userId=${user?.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setSubscription(data.subscription);
      } else {
        setError(data.error || 'Failed to fetch subscription');
      }
    } catch (err) {
      setError('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionAction = async (action: string) => {
    if (!subscription) return;

    setActionLoading(action);
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          subscriptionId: subscription.id
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Refresh subscription data
        await fetchSubscription();
      } else {
        setError(data.error || 'Action failed');
      }
    } catch (err) {
      setError('Failed to perform action');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-800"><Calendar className="w-3 h-3 mr-1" />Trial</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Canceled</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800"><Pause className="w-3 h-3 mr-1" />Paused</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || (profile?.role !== 'admin' && profile?.role !== 'alumni')) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have access to subscription management.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Subscription Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Manage your Trailblaize Admin Access subscription</p>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {subscription ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subscription Details */}
            <Card>
              <CardHeader className="pb-4 sm:pb-0">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-4 pt-0 sm:pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  {getStatusBadge(subscription.status)}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Plan</span>
                  <span className="font-medium">Trailblaize Admin Access</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Price</span>
                  <span className="font-medium">
                    ${subscription.price.amount}/{subscription.price.interval}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Next Payment</span>
                  <span className="font-medium">
                    {subscription.upcomingInvoice ? (
                      <>
                        ${subscription.upcomingInvoice.amount} on{' '}
                        {new Date(subscription.upcomingInvoice.nextPaymentDate).toLocaleDateString()}
                      </>
                    ) : (
                      'No upcoming payment'
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Invoice Date</span>
                  <span className="font-medium">
                    {subscription.upcomingInvoice ? (
                      new Date(subscription.upcomingInvoice.invoiceDate).toLocaleDateString()
                    ) : (
                      'No invoice date'
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader className="pb-4 sm:pb-0">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-4 pt-0 sm:pt-6">
                {subscription.paymentMethod ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Card ending in</span>
                      <span className="font-medium">
                        **** **** **** {subscription.paymentMethod.card.last4}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Expires</span>
                      <span className="font-medium">
                        {subscription.paymentMethod.card.exp_month}/{subscription.paymentMethod.card.exp_year}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No payment method on file</p>
                )}
              </CardContent>
            </Card>

            {/* Subscription Actions */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2 sm:pb-0">
                <CardTitle>Manage Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {subscription.cancelAtPeriodEnd ? (
                    <Button
                      onClick={() => handleSubscriptionAction('reactivate')}
                      disabled={actionLoading === 'reactivate'}
                      className="w-full"
                    >
                      {actionLoading === 'reactivate' ? 'Reactivating...' : 'Reactivate Subscription'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubscriptionAction('cancel')}
                      disabled={actionLoading === 'cancel'}
                      variant="outline"
                      className="w-full"
                    >
                      {actionLoading === 'cancel' ? 'Canceling...' : 'Cancel Subscription'}
                    </Button>
                  )}
                </div>
                
                {subscription.cancelAtPeriodEnd && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Your subscription will be canceled at the end of the current billing period on{' '}
                      {subscription.upcomingInvoice ? 
                        new Date(subscription.upcomingInvoice.nextPaymentDate).toLocaleDateString() : 
                        'the end of the current period'
                      }.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
              <p className="text-gray-600 mb-4">
                You don't have an active subscription. Subscribe to access premium features.
              </p>
              <Button onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
