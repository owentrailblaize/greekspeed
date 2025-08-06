'use client';
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle, Clock, AlertCircle, Calendar, MessageSquare, UserCheck, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const operationsOverview = {
  totalTasks: 24,
  completedTasks: 18,
  pendingTasks: 6,
  memberCompliance: 89.5
};

const memberTasks = [
  { member: "Connor McMullan", task: "Complete Leadership Training", deadline: "2024-03-15", status: "completed", priority: "high" },
  { member: "Brett Ashy", task: "Submit Committee Report", deadline: "2024-03-10", status: "pending", priority: "medium" },
  { member: "Margaret Dye", task: "Attend Risk Management Session", deadline: "2024-03-20", status: "overdue", priority: "high" },
  { member: "Rush Bland", task: "Update Contact Information", deadline: "2024-03-05", status: "completed", priority: "low" },
  { member: "Kinkead Dent", task: "Community Service Hours", deadline: "2024-03-25", status: "pending", priority: "medium" },
  { member: "Victor Razi", task: "Alumni Mentorship Meeting", deadline: "2024-03-12", status: "pending", priority: "low" }
];

const committeeStatus = [
  { name: "Risk Management", chair: "John Smith", members: 8, completion: 92, nextMeeting: "March 10" },
  { name: "Professional Development", chair: "Mike Johnson", members: 12, completion: 78, nextMeeting: "March 12" },
  { name: "Community Service", chair: "David Wilson", members: 15, completion: 85, nextMeeting: "March 15" },
  { name: "Alumni Relations", chair: "Chris Brown", members: 10, completion: 95, nextMeeting: "March 18" }
];

const upcomingMeetings = [
  { name: "Executive Board Meeting", date: "Tomorrow, 7:00 PM", attendees: 8, location: "Chapter House" },
  { name: "Committee Chairs Meeting", date: "Thursday, 6:00 PM", attendees: 6, location: "Student Union" },
  { name: "Member Orientation", date: "Saturday, 2:00 PM", attendees: 25, location: "Library Room 204" }
];

export function VicePresidentDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Operations Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Tasks</p>
                  <p className="text-2xl font-semibold text-blue-900">{operationsOverview.totalTasks}</p>
                </div>
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-semibold text-green-900">{operationsOverview.completedTasks}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-semibold text-yellow-900">{operationsOverview.pendingTasks}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
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
                  <p className="text-purple-600 text-sm font-medium">Compliance</p>
                  <p className="text-2xl font-semibold text-purple-900">{operationsOverview.memberCompliance}%</p>
                </div>
                <UserCheck className="h-8 w-8 text-purple-600" />
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
            { value: "tasks", label: "Member Tasks" },
            { value: "committees", label: "Committees" },
            { value: "meetings", label: "Meetings" }
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
              <CardTitle>Task Completion Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Overall Progress</span>
                  <span className="font-medium">
                    {((operationsOverview.completedTasks / operationsOverview.totalTasks) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={(operationsOverview.completedTasks / operationsOverview.totalTasks) * 100} 
                  className="h-3" 
                />
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-green-600">{operationsOverview.completedTasks}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-yellow-600">{operationsOverview.pendingTasks}</p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Committee Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {committeeStatus.map((committee, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">{committee.name}</h4>
                      <span className="text-xs text-gray-600">{committee.completion}%</span>
                    </div>
                    <Progress value={committee.completion} className="h-2 mb-2" />
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>Chair: {committee.chair}</span>
                      <span>{committee.members} members</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === "tasks" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Member Task Tracking</CardTitle>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Reminders
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberTasks.map((task, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{task.member}</TableCell>
                    <TableCell>{task.task}</TableCell>
                    <TableCell>{task.deadline}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.status !== "completed" && (
                        <Button size="sm" variant="outline">
                          Follow Up
                        </Button>
                      )}
                      {task.status === "completed" && (
                        <span className="text-green-600 text-sm">✓ Done</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedTab === "committees" && (
        <Card>
          <CardHeader>
            <CardTitle>Committee Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {committeeStatus.map((committee, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">{committee.name}</h4>
                    <Badge variant="outline">{committee.members} members</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium">{committee.completion}%</span>
                      </div>
                      <Progress value={committee.completion} className="h-2" />
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p>Chair: {committee.chair}</p>
                      <p>Next Meeting: {committee.nextMeeting}</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">View Details</Button>
                      <Button size="sm" variant="outline">Contact Chair</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === "meetings" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Upcoming Meetings</CardTitle>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingMeetings.map((meeting, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{meeting.name}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <p className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {meeting.date}
                        </p>
                        <p className="flex items-center mt-1">
                          <Users className="h-3 w-3 mr-1" />
                          {meeting.attendees} attendees
                        </p>
                        <p className="flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {meeting.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Join</Button>
                    </div>
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