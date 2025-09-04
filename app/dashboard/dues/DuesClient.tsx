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

  useEffect(() => {
    if (profile?.id) {
      loadDuesAssignments();
    }
  }, [profile?.id]);

  // Add this effect to check for success/cancel parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true') {
      console.log(' Payment successful! Refreshing data...');
      loadDuesAssignments(); // Refresh the data
      // Clean up the URL
      window.history.replaceState({}, '', '/dashboard/dues');
    } else if (canceled === 'true') {
      console.log('❌ Payment canceled');
      // Clean up the URL
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

  const currentAssignment = assignments.find(a => a.status !== 'paid' && a.status !== 'exempt' && a.status !== 'waived');
  const totalOutstanding = assignments.reduce((sum, a) => sum + (a.amount_due - a.amount_paid), 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-navy-900 font-semibold mb-2">Membership Dues</h1>
              <p className="text-gray-600">
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Status Card */}
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

            {/* Payment Information */}
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

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.filter(a => a.amount_paid > 0).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">{assignment.cycle.name}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(assignment.cycle.due_date).toLocaleDateString()} • Credit Card
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${assignment.amount_paid.toFixed(2)}</p>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          Paid
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {assignments.filter(a => a.amount_paid > 0).length === 0 && (
                    <p className="text-center text-gray-500">No payment history available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Sidebar */}
          <div className="space-y-6">
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="h-4 w-4 mr-2" /> Update Payment Method
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" /> Change Payment Schedule
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" /> Download Receipt
                </Button>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="bg-gradient-to-br from-blue-50 to-navy-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-medium mb-2">Need Help?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Contact our support team for payment assistance
                  </p>
                  <Button variant="outline" size="sm">
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 