"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  Shield,
  Users,
  Wifi,
  Coffee,
  Award,
  DollarSign,
  Clock,
  AlertTriangle,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import { useProfile } from "@/lib/contexts/ProfileContext";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const duesCoverage = [
  {
    icon: Users,
    title: "Alumni Network Access",
    description: "Connect with thousands of alumni across industries",
    included: true,
  },
  {
    icon: Wifi,
    title: "Digital Platform Access",
    description: "Full access to Trailblaize networking platform",
    included: true,
  },
  {
    icon: Coffee,
    title: "Chapter Events",
    description: "Access to networking events, mixers, and meetups",
    included: true,
  },
  {
    icon: Award,
    title: "Professional Development",
    description: "Career workshops, mentorship programs, and resources",
    included: true,
  },
  {
    icon: Shield,
    title: "Premium Support",
    description: "Priority customer support and account management",
    included: true,
  },
];

interface DuesAssignment {
  id: string;
  status: 'required' | 'exempt' | 'reduced' | 'waived' | 'paid';
  amount_assessed: number;
  amount_due: number;
  amount_paid: number;
  cycle: {
    name: string;
    due_date: string;
    allow_payment_plans: boolean;
    plan_options: any[];
  };
}

export default function DuesClient() {
  const { profile } = useProfile();
  const [assignments, setAssignments] = useState<DuesAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  // Add payment history state
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [totalPaymentCount, setTotalPaymentCount] = useState(0);

  // Add success state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadDuesAssignments();
      loadPaymentHistory();
    }
  }, [profile?.id]);

  // Update the success effect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true') {
      console.log('✅ Payment successful! Refreshing data...');
      setShowSuccessMessage(true);
      loadDuesAssignments();
      loadPaymentHistory(); // Refresh payment history
      // Clean up the URL
      window.history.replaceState({}, '', '/dashboard/dues');
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    } else if (canceled === 'true') {
      console.log('❌ Payment canceled');
      window.history.replaceState({}, '', '/dashboard/dues');
    }
  }, []);

  const loadDuesAssignments = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading dues assignments for user:', profile?.id);
      
      const { data, error } = await supabase
        .from('dues_assignments')
        .select(`
          *,
          cycle:dues_cycles!dues_assignments_dues_cycle_id_fkey(
            name,
            due_date,
            allow_payment_plans,
            plan_options
          )
        `)
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('📊 Loaded assignments:', data);
      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading dues assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add function to load payment history
  const loadPaymentHistory = async () => {
    try {
      // Get total count first
      const { count, error: countError } = await supabase
        .from('payments_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile?.id)
        .eq('type', 'dues')
        .eq('status', 'succeeded');

      if (countError) throw countError;
      setTotalPaymentCount(count || 0);

      // Get limited results based on screen size
      const limit = window.innerWidth < 640 ? 3 : 5; // 3 for mobile, 5 for desktop
      
      const { data, error } = await supabase
        .from('payments_ledger')
        .select(`
          *,
          cycle:dues_cycles!payments_ledger_dues_cycle_id_fkey(
            name,
            due_date
          )
        `)
        .eq('user_id', profile?.id)
        .eq('type', 'dues')
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setPaymentHistory(data || []);
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const handlePayDues = async (assignmentId: string, paymentPlan = false) => {
    try {
      setProcessingPayment(true);
      
      const response = await fetch('/api/dues/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, paymentPlan })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        console.error('Payment failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'required': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'exempt': return 'bg-gray-100 text-gray-800';
      case 'waived': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Update the outstanding balance calculation
  const currentAssignment = assignments.find(a => a.status !== 'paid' && a.status !== 'exempt' && a.status !== 'waived');
  const totalOutstanding = assignments.reduce((sum, a) => {
    // Only count outstanding dues (not paid, exempt, or waived)
    if (a.status !== 'paid' && a.status !== 'exempt' && a.status !== 'waived') {
      return sum + (a.amount_due - a.amount_paid);
    }
    return sum;
  }, 0);

  // Add this to ensure the header reflects the correct status
  const isPaidUp = totalOutstanding === 0 && assignments.length > 0;

  // Add payment summary calculation
  const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
  const recentPayment = paymentHistory[0]; // Most recent payment

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div>
              <h1 className="text-navy-900 font-semibold mb-2">Membership Dues</h1>
              <p className="text-gray-600 hidden sm:block">
                Manage your membership payments and view benefits
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Outstanding Balance</p>
                <p
                  className={`font-semibold ${
                    totalOutstanding === 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ${totalOutstanding.toFixed(2)}
                </p>
                {totalPaid > 0 && (
                  <p className="text-xs text-gray-500">
                    Total paid: ${totalPaid.toFixed(2)}
                  </p>
                )}
              </div>
              <Badge
                variant={totalOutstanding === 0 ? "default" : "secondary"}
                className={totalOutstanding === 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
              >
                {totalOutstanding === 0 ? "Paid Up" : "Outstanding"}
              </Badge>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="sm:hidden">
            <div className="mb-4">
              <h1 className="text-navy-900 font-semibold mb-2 text-2xl">Membership Dues</h1>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Outstanding Balance</p>
                <p
                  className={`font-semibold ${
                    totalOutstanding === 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ${totalOutstanding.toFixed(2)}
                </p>
                {totalPaid > 0 && (
                  <p className="text-xs text-gray-500">
                    Total paid: ${totalPaid.toFixed(2)}
                  </p>
                )}
              </div>
              <Badge
                variant={totalOutstanding === 0 ? "default" : "secondary"}
                className={totalOutstanding === 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
              >
                {totalOutstanding === 0 ? "Paid Up" : "Outstanding"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Payment successful! Your dues have been updated.</span>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="hidden sm:block max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Reorder the cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Status Card - Keep at top */}
            <Card className="bg-gradient-to-br from-navy-50 to-blue-50 border-navy-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-navy-600" />
                    <span>Current Dues Status</span>
                  </CardTitle>
                  <Clock className="h-5 w-5 text-navy-500" />
                </div>
              </CardHeader>
              <CardContent>
                {currentAssignment ? (
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-semibold text-navy-900">
                        ${(currentAssignment.amount_due - currentAssignment.amount_paid).toFixed(2)}
                      </p>
                      <p className="text-navy-600">Due on {new Date(currentAssignment.cycle.due_date).toLocaleDateString()}</p>
                      {currentAssignment.cycle.allow_payment_plans && (
                        <p className="text-sm text-gray-600">Payment plans available</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handlePayDues(currentAssignment.id, false)}
                        disabled={processingPayment}
                        className="bg-navy-600 hover:bg-navy-700"
                      >
                        <CreditCard className="h-4 w-4 mr-2" /> Pay Now
                      </Button>
                      {currentAssignment.cycle.allow_payment_plans && (
                        <Button 
                          onClick={() => handlePayDues(currentAssignment.id, true)}
                          disabled={processingPayment}
                          variant="outline"
                        >
                          <Calendar className="h-4 w-4 mr-2" /> Payment Plan
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-green-600">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-lg font-semibold">All dues are current!</p>
                    <p className="text-sm text-gray-600">No outstanding payments required.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History - Move to second position */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-navy-600" />
                    <span>Payment History</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Receipts
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentHistory.length > 0 ? (
                    paymentHistory.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="font-medium">{payment.cycle?.name || 'Chapter Dues'}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(payment.created_at).toLocaleDateString()} • Credit Card
                            </p>
                            {payment.stripe_payment_intent_id && (
                              <p className="text-xs text-gray-500">
                                Transaction: {payment.stripe_payment_intent_id.slice(-8)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${payment.amount.toFixed(2)}</p>
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            Paid
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">No payment history available</p>
                      <p className="text-sm text-gray-400">Your completed payments will appear here</p>
                    </div>
                  )}
                </div>
                {totalPaymentCount > 5 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-500 text-center">
                      Showing 5 of {totalPaymentCount} payments. Contact admin for complete payment history.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information - Move to third position */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-navy-600" />
                  <span>Payment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Payment Methods</p>
                      <p className="text-sm text-gray-600">Credit/Debit Cards via Stripe</p>
                    </div>
                    <CreditCard className="h-5 w-5 text-navy-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Security</p>
                      <p className="text-sm text-gray-600">PCI compliant, encrypted payments</p>
                    </div>
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Receipts</p>
                      <p className="text-sm text-gray-600">Automatically sent to your email</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Remove Quick Actions */}
          <div className="space-y-6">
            {/* Your Membership Includes - Keep this */}
            <Card>
              <CardHeader>
                <CardTitle>Your Membership Includes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {duesCoverage.map((benefit, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start space-x-3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-navy-100 rounded-lg flex items-center justify-center">
                          <benefit.icon className="h-4 w-4 text-navy-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium">{benefit.title}</h4>
                          {benefit.included && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {benefit.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Support - Keep this */}
            <Card className="bg-gradient-to-br from-blue-50 to-navy-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-medium mb-2">Need Help?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Contact our support team for payment assistance
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = 'mailto:devin@trailblaize.net?subject=Dues Support Request&body=Hello,%0D%0A%0D%0AI need assistance with my dues payment.%0D%0A%0D%0APlease provide details about your issue below:%0D%0A%0D%0A'}
                  >
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Cardless */}
      <div className="sm:hidden px-4 py-6">
        {/* Current Dues Status Card - Keep as card */}
        <Card className="bg-gradient-to-br from-navy-50 to-blue-50 border-navy-200 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-navy-600" />
                <span>Current Dues Status</span>
              </CardTitle>
              <Clock className="h-5 w-5 text-navy-500" />
            </div>
          </CardHeader>
          <CardContent>
            {currentAssignment ? (
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-semibold text-navy-900">
                    ${(currentAssignment.amount_due - currentAssignment.amount_paid).toFixed(2)}
                  </p>
                  <p className="text-navy-600">Due on {new Date(currentAssignment.cycle.due_date).toLocaleDateString()}</p>
                  {currentAssignment.cycle.allow_payment_plans && (
                    <p className="text-sm text-gray-600">Payment plans available</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handlePayDues(currentAssignment.id, false)}
                    disabled={processingPayment}
                    className="bg-navy-600 hover:bg-navy-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" /> Pay Now
                  </Button>
                  {currentAssignment.cycle.allow_payment_plans && (
                    <Button 
                      onClick={() => handlePayDues(currentAssignment.id, true)}
                      disabled={processingPayment}
                      variant="outline"
                    >
                      <Calendar className="h-4 w-4 mr-2" /> Payment Plan
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-green-600">
                <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                <p className="text-lg font-semibold">All dues are current!</p>
                <p className="text-sm text-gray-600">No outstanding payments required.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History - Cardless */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-navy-600" />
              <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Receipts
            </Button>
          </div>
          
          <div className="space-y-0">
            {paymentHistory.length > 0 ? (
              paymentHistory.map((payment, index) => (
                <div
                  key={payment.id}
                  className={`px-4 py-4 ${index !== paymentHistory.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">{payment.cycle?.name || 'Chapter Dues'}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.created_at).toLocaleDateString()} • Credit Card
                        </p>
                        {payment.stripe_payment_intent_id && (
                          <p className="text-xs text-gray-500">
                            Transaction: {payment.stripe_payment_intent_id.slice(-8)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${payment.amount.toFixed(2)}</p>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        Paid
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">No payment history available</p>
                <p className="text-sm text-gray-400">Your completed payments will appear here</p>
              </div>
            )}
          </div>
          
          {totalPaymentCount > 3 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center">
                Showing 3 of {totalPaymentCount} payments. Contact admin for complete payment history.
              </p>
            </div>
          )}
        </div>

        {/* Payment Information - Cardless */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="h-5 w-5 text-navy-600" />
            <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
          </div>
          
          <div className="space-y-0">
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Methods</p>
                  <p className="text-sm text-gray-600">Credit/Debit Cards via Stripe</p>
                </div>
                <CreditCard className="h-5 w-5 text-navy-600" />
              </div>
            </div>
            
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Security</p>
                  <p className="text-sm text-gray-600">PCI compliant, encrypted payments</p>
                </div>
                <Shield className="h-5 w-5 text-green-600" />
              </div>
            </div>
            
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Receipts</p>
                  <p className="text-sm text-gray-600">Automatically sent to your email</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Your Membership Includes - Cardless */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Membership Includes</h2>
          <div className="space-y-0">
            {duesCoverage.map((benefit, index) => (
              <div
                key={index}
                className={`px-4 py-4 ${index !== duesCoverage.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-navy-100 rounded-lg flex items-center justify-center">
                      <benefit.icon className="h-4 w-4 text-navy-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium">{benefit.title}</h4>
                      {benefit.included && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support - Cardless */}
        <div className="text-center py-8">
          <h3 className="font-medium mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Contact our support team for payment assistance
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = 'mailto:devin@trailblaize.net?subject=Dues Support Request&body=Hello,%0D%0A%0D%0AI need assistance with my dues payment.%0D%0A%0D%0APlease provide details about your issue below:%0D%0A%0D%0A'}
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
} 