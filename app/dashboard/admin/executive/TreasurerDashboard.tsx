'use client';
import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Users, AlertTriangle, CheckCircle, Download, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const financialOverview = {
  totalCollected: 21450,
  totalOutstanding: 3850,
  collectionRate: 84.8,
  totalBudget: 45000,
  spentBudget: 28750
};

const memberDuesStatus = [
  { name: "Connor McMullan", class: "Senior", amount: 150, status: "paid", dueDate: "2024-01-15", method: "Credit Card" },
  { name: "Brett Ashy", class: "Junior", amount: 150, status: "paid", dueDate: "2024-01-15", method: "Bank Transfer" },
  { name: "Margaret Dye", class: "Sophomore", amount: 150, status: "overdue", dueDate: "2024-01-15", daysPast: 15 },
  { name: "Rush Bland", class: "Freshman", amount: 150, status: "pending", dueDate: "2024-02-01", daysLeft: 7 },
  { name: "Kinkead Dent", class: "Senior", amount: 150, status: "paid", dueDate: "2024-01-15", method: "Credit Card" },
  { name: "Victor Razi", class: "Graduate", amount: 150, status: "overdue", dueDate: "2024-01-15", daysPast: 8 },
  { name: "Anabel McCraney", class: "Junior", amount: 150, status: "pending", dueDate: "2024-02-01", daysLeft: 7 },
  { name: "Denton Smith", class: "Alumni", amount: 100, status: "paid", dueDate: "2024-01-15", method: "Auto-Pay" }
];

const budgetCategories = [
  { name: "Social Events", allocated: 12000, spent: 8500, remaining: 3500 },
  { name: "Chapter Operations", allocated: 8000, spent: 6200, remaining: 1800 },
  { name: "Professional Development", allocated: 5000, spent: 3200, remaining: 1800 },
  { name: "Alumni Relations", allocated: 4000, spent: 2800, remaining: 1200 },
  { name: "Recruitment", allocated: 6000, spent: 4200, remaining: 1800 },
  { name: "Emergency Fund", allocated: 10000, spent: 3850, remaining: 6150 }
];

export function TreasurerDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total Collected</p>
                  <p className="text-2xl font-semibold text-green-900">${financialOverview.totalCollected.toLocaleString()}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Outstanding</p>
                  <p className="text-2xl font-semibold text-red-900">${financialOverview.totalOutstanding.toLocaleString()}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Collection Rate</p>
                  <p className="text-2xl font-semibold text-blue-900">{financialOverview.collectionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Budget Used</p>
                  <p className="text-2xl font-semibold text-purple-900">
                    {((financialOverview.spentBudget / financialOverview.totalBudget) * 100).toFixed(1)}%
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { value: "overview", label: "Overview" },
            { value: "dues", label: "Member Dues" },
            { value: "budget", label: "Budget Tracking" }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedTab(tab.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedTab === tab.value
                  ? "bg-white text-navy-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Dues Collection Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Spring 2024 Collection</span>
                  <span className="font-medium">{financialOverview.collectionRate}%</span>
                </div>
                <Progress value={financialOverview.collectionRate} className="h-3" />
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-green-600">
                      {memberDuesStatus.filter(m => m.status === 'paid').length}
                    </p>
                    <p className="text-sm text-gray-600">Paid</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-yellow-600">
                      {memberDuesStatus.filter(m => m.status === 'pending').length}
                    </p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-red-600">
                      {memberDuesStatus.filter(m => m.status === 'overdue').length}
                    </p>
                    <p className="text-sm text-gray-600">Overdue</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Export Financial Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Overdue Reminders
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Bulk Payment Processing
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Update Payment Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === "dues" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Member Dues Status</CardTitle>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reminders
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberDuesStatus.map((member, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.class}</TableCell>
                    <TableCell>${member.amount}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(member.status)}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.dueDate}
                      {member.daysPast && (
                        <span className="text-red-600 text-sm ml-2">
                          ({member.daysPast} days past)
                        </span>
                      )}
                      {member.daysLeft && (
                        <span className="text-yellow-600 text-sm ml-2">
                          ({member.daysLeft} days left)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.status === "overdue" && (
                        <Button size="sm" variant="outline">
                          Send Reminder
                        </Button>
                      )}
                      {member.status === "pending" && (
                        <Button size="sm" variant="outline">
                          Follow Up
                        </Button>
                      )}
                      {member.status === "paid" && (
                        <span className="text-green-600 text-sm">✓ {member.method}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedTab === "budget" && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Tracking by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {budgetCategories.map((category, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">{category.name}</h4>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        ${category.spent.toLocaleString()} / ${category.allocated.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${category.remaining.toLocaleString()} remaining
                      </p>
                    </div>
                  </div>
                  <Progress 
                    value={(category.spent / category.allocated) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {((category.spent / category.allocated) * 100).toFixed(1)}% used
                    </span>
                    <Badge 
                      variant={category.remaining > 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {category.remaining > 0 ? "On Track" : "Over Budget"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}