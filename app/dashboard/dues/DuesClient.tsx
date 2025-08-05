"use client";

import { useState } from "react";
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

const paymentHistory = [
  {
    date: "2024-01-15",
    amount: "$150.00",
    status: "Paid",
    period: "Spring 2024",
    method: "Credit Card",
  },
  {
    date: "2023-08-15",
    amount: "$150.00",
    status: "Paid",
    period: "Fall 2023",
    method: "Credit Card",
  },
  {
    date: "2023-01-15",
    amount: "$150.00",
    status: "Paid",
    period: "Spring 2023",
    method: "Bank Transfer",
  },
];

export default function DuesClient() {
  const [selectedPlan, setSelectedPlan] = useState("semester");

  const currentBalance = 0;
  const nextDueDate = "August 15, 2025";
  const nextDueAmount = "$150.00";

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
                <p className="text-sm text-gray-500">Current Balance</p>
                <p
                  className={`font-semibold ${
                    currentBalance === 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ${currentBalance.toFixed(2)}
                </p>
              </div>
              <Badge
                variant={currentBalance === 0 ? "default" : "secondary"}
                className="bg-green-100 text-green-800"
              >
                {currentBalance === 0 ? "Paid Up" : "Outstanding"}
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
                    <span>Next Payment Due</span>
                  </CardTitle>
                  <Clock className="h-5 w-5 text-navy-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-semibold text-navy-900">
                      {nextDueAmount}
                    </p>
                    <p className="text-navy-600">Due on {nextDueDate}</p>
                  </div>
                  <Button className="bg-navy-600 hover:bg-navy-700">
                    <CreditCard className="h-4 w-4 mr-2" /> Pay Now
                  </Button>
                </div>
                <Progress value={75} className="mb-2" />
                <p className="text-sm text-gray-600">
                  75% of semester completed
                </p>
              </CardContent>
            </Card>

            {/* Payment Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-navy-600" />
                  <span>Payment Plans</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      selectedPlan === "semester"
                        ? "border-navy-500 bg-navy-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPlan("semester")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Semester Plan</h3>
                      <Badge variant="secondary">Popular</Badge>
                    </div>
                    <p className="text-2xl font-semibold text-navy-900 mb-1">
                      $150
                    </p>
                    <p className="text-sm text-gray-600 mb-3">Per semester</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Full semester access</li>
                      <li>• Payment flexibility</li>
                      <li>• Automatic renewal</li>
                    </ul>
                  </motion.div>

                  <motion.div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      selectedPlan === "annual"
                        ? "border-navy-500 bg-navy-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPlan("annual")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Annual Plan</h3>
                      <Badge className="bg-green-100 text-green-800">Save 10%</Badge>
                    </div>
                    <p className="text-2xl font-semibold text-navy-900 mb-1">
                      $270
                    </p>
                    <p className="text-sm text-gray-600 mb-3">Per year</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Full year access</li>
                      <li>• 10% discount</li>
                      <li>• Priority support</li>
                    </ul>
                  </motion.div>
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
                  {paymentHistory.map((payment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">{payment.period}</p>
                          <p className="text-sm text-gray-600">
                            {payment.date} • {payment.method}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{payment.amount}</p>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
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