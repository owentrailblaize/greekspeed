'use client';
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, Calendar, MessageSquare, AlertCircle, CheckCircle, Clock, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { TasksPanel } from '@/components/dashboards/ui/TasksPanel';
import { ChapterDocumentManager } from '@/components/dashboards/ui/ChapterDocumentManager';
import { useProfile } from '@/lib/hooks/useProfile';

const chapterStats = {
  totalMembers: 156,
  activeMembers: 142,
  newPledges: 23,
  graduatingMembers: 18,
  membershipGrowth: 12.5
};

const upcomingEvents = [
  { name: "Executive Board Meeting", date: "Tomorrow, 7:00 PM", type: "meeting" },
  { name: "Alumni Networking Event", date: "Friday, 6:00 PM", type: "networking" },
  { name: "Chapter Retreat Planning", date: "Next Monday, 5:00 PM", type: "planning" }
];

const pendingApprovals = [
  { item: "Budget Amendment - Social Events", amount: "$2,500", priority: "high" },
  { item: "New Member Initiation Ceremony", date: "March 15", priority: "medium" },
  { item: "Alumni Speaker Request", contact: "Dr. Johnson", priority: "low" }
];

export function PresidentDashboard() {
  const [announcement, setAnnouncement] = useState("");
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Total Members</p>
                  <p className="text-2xl font-semibold text-purple-900">{chapterStats.totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
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
                  <p className="text-green-600 text-sm font-medium">Active Members</p>
                  <p className="text-2xl font-semibold text-green-900">{chapterStats.activeMembers}</p>
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
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">New Pledges</p>
                  <p className="text-2xl font-semibold text-blue-900">{chapterStats.newPledges}</p>
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
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Membership Growth</p>
                  <p className="text-2xl font-semibold text-orange-900">+{chapterStats.membershipGrowth}%</p>
                </div>
                <Crown className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chapter Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                <span>Chapter Announcements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Write a chapter announcement..."
                  value={announcement}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnnouncement(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">Add Photo</Button>
                    <Button size="sm" variant="outline">Schedule Send</Button>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Send Announcement
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span>Pending Approvals</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {pendingApprovals.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((approval, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{approval.item}</h4>
                      <p className="text-sm text-gray-600">
                        {approval.amount && `Amount: ${approval.amount}`}
                        {approval.date && `Date: ${approval.date}`}
                        {approval.contact && `Contact: ${approval.contact}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={approval.priority === 'high' ? 'destructive' : 
                                approval.priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {approval.priority}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">Deny</Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chapter Health */}
          <Card>
            <CardHeader>
              <CardTitle>Chapter Health Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Member Engagement</span>
                    <span className="text-sm text-gray-600">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Dues Collection</span>
                    <span className="text-sm text-gray-600">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Event Attendance</span>
                    <span className="text-sm text-gray-600">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Alumni Engagement</span>
                    <span className="text-sm text-gray-600">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NEW: Chapter Document Management */}
          {chapterId && (
            <ChapterDocumentManager 
              chapterId={chapterId} 
              className="w-full"
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span>Upcoming Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-sm">{event.name}</h4>
                    <p className="text-xs text-gray-600 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {event.date}
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View Full Calendar
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Members
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </CardContent>
          </Card>

          {/* Executive Notes */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader>
              <CardTitle className="text-purple-900">Executive Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Personal notes and reminders..."
                className="min-h-[120px] bg-white/50"
              />
              <Button size="sm" className="mt-3 bg-purple-600 hover:bg-purple-700">
                Save Notes
              </Button>
            </CardContent>
          </Card>

          {/* Add Tasks Panel */}
          {chapterId && <TasksPanel chapterId={chapterId} />}
        </div>
      </div>
    </div>
  );
}