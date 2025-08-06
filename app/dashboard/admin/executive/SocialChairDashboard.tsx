'use client';
import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, DollarSign, BookOpen, MapPin, Clock, Plus, Edit, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const eventBudget = {
  totalAllocated: 12000,
  spent: 8500,
  remaining: 3500,
  upcomingEvents: 4
};

const upcomingEvents = [
  { name: "Spring Formal", date: "March 20, 2024", budget: 2500, status: "planning", attendees: 85 },
  { name: "Alumni Mixer", date: "March 15, 2024", budget: 800, status: "confirmed", attendees: 45 },
  { name: "Brotherhood BBQ", date: "March 25, 2024", budget: 600, status: "planning", attendees: 60 },
  { name: "Recruitment Social", date: "April 5, 2024", budget: 1200, status: "pending", attendees: 75 }
];

const vendorContacts = [
  { name: "Oxford Catering Co.", type: "Catering", contact: "Sarah Johnson", phone: "(662) 555-0123", email: "sarah@oxfordcatering.com", rating: 4.8 },
  { name: "Party Perfect Rentals", type: "Equipment", contact: "Mike Davis", phone: "(662) 555-0456", email: "mike@partyrentals.com", rating: 4.6 },
  { name: "Grove Sound Systems", type: "Audio/Visual", contact: "Jessica Wilson", phone: "(662) 555-0789", email: "info@grovesound.com", rating: 4.9 },
  { name: "Elite Security Services", type: "Security", contact: "Robert Brown", phone: "(662) 555-0321", email: "rob@elitesecurity.com", rating: 4.7 }
];

const socialLoreEntries = [
  { title: "Spring Formal Venue Tips", content: "The Depot downtown works best for 80+ people. Book 6 months in advance. Parking can be an issue - coordinate with nearby lots.", date: "2023-03-15", author: "Previous Social Chair" },
  { title: "Successful Alumni Events", content: "Happy hour format works better than dinner for alumni engagement. Thursday evenings 6-8 PM get best attendance. Always provide name tags with graduation year.", date: "2023-05-10", author: "Alumni Relations" },
  { title: "Budget Management", content: "Always budget 10% extra for unexpected costs. DJ equipment rental is cheaper than hiring a full DJ for casual events. Food trucks are popular for outdoor events.", date: "2023-09-20", author: "Treasurer Notes" }
];

// Budget data
const budgetBreakdown = [
  { category: "Spring Formal", allocated: 2500, spent: 1800, remaining: 700, transactions: [
    { item: "Venue Deposit", amount: 800, date: "2024-02-15", status: "paid" },
    { item: "Catering Down Payment", amount: 600, date: "2024-02-20", status: "paid" },
    { item: "Decoration Supplies", amount: 400, date: "2024-03-01", status: "paid" }
  ]},
  { category: "Alumni Events", allocated: 1200, spent: 850, remaining: 350, transactions: [
    { item: "Alumni Mixer Venue", amount: 400, date: "2024-03-05", status: "paid" },
    { item: "Alumni Mixer Catering", amount: 450, date: "2024-03-10", status: "paid" }
  ]},
  { category: "Brotherhood Events", allocated: 800, spent: 600, remaining: 200, transactions: [
    { item: "BBQ Food & Supplies", amount: 350, date: "2024-03-15", status: "paid" },
    { item: "Games & Activities", amount: 250, date: "2024-03-18", status: "paid" }
  ]},
  { category: "Recruitment", allocated: 1500, spent: 980, remaining: 520, transactions: [
    { item: "Recruitment Dinner", amount: 600, date: "2024-02-28", status: "paid" },
    { item: "Welcome Gifts", amount: 380, date: "2024-03-02", status: "paid" }
  ]}
];

// Calendar data
const currentDate = new Date(2024, 2, 15); // March 15, 2024
const calendarEvents = [
  { id: 1, title: "Alumni Mixer", date: new Date(2024, 2, 15), time: "6:00 PM", type: "alumni", location: "Downtown Oxford" },
  { id: 2, title: "Spring Formal", date: new Date(2024, 2, 20), time: "7:00 PM", type: "formal", location: "The Depot" },
  { id: 3, title: "Brotherhood BBQ", date: new Date(2024, 2, 25), time: "12:00 PM", type: "brotherhood", location: "Chapter House" },
  { id: 4, title: "Recruitment Social", date: new Date(2024, 3, 5), time: "6:30 PM", type: "recruitment", location: "Student Union" },
  { id: 5, title: "Committee Meeting", date: new Date(2024, 2, 18), time: "7:00 PM", type: "meeting", location: "Chapter House" },
  { id: 6, title: "Vendor Meeting", date: new Date(2024, 2, 22), time: "3:00 PM", type: "planning", location: "Office" }
];

export function SocialChairDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [newLoreEntry, setNewLoreEntry] = useState({ title: "", content: "" });
  const [calendarDate, setCalendarDate] = useState(currentDate);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string | null>(null);

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case 'formal': return 'bg-purple-100 text-purple-800';
      case 'alumni': return 'bg-blue-100 text-blue-800';
      case 'brotherhood': return 'bg-green-100 text-green-800';
      case 'recruitment': return 'bg-orange-100 text-orange-800';
      case 'meeting': return 'bg-gray-100 text-gray-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const days = [];
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
      const events = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div key={day} className={`h-24 border border-gray-200 p-1 ${isToday ? 'bg-orange-50 border-orange-300' : 'bg-white'}`}>
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-orange-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {events.slice(0, 2).map(event => (
              <div key={event.id} className={`text-xs px-1 py-0.5 rounded truncate ${getEventTypeColor(event.type)}`}>
                {event.title}
              </div>
            ))}
            {events.length > 2 && (
              <div className="text-xs text-gray-500">+{events.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-lg">
            {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
          </h3>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-600 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Event Budget</p>
                  <p className="text-2xl font-semibold text-orange-900">${eventBudget.remaining.toLocaleString()}</p>
                  <p className="text-xs text-orange-600">Remaining</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Upcoming Events</p>
                  <p className="text-2xl font-semibold text-blue-900">{eventBudget.upcomingEvents}</p>
                  <p className="text-xs text-blue-600">This month</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total Attendees</p>
                  <p className="text-2xl font-semibold text-green-900">
                    {upcomingEvents.reduce((sum, event) => sum + event.attendees, 0)}
                  </p>
                  <p className="text-xs text-green-600">Expected</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
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
                  <p className="text-purple-600 text-sm font-medium">Vendor Contacts</p>
                  <p className="text-2xl font-semibold text-purple-900">{vendorContacts.length}</p>
                  <p className="text-xs text-purple-600">Active</p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-600" />
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
            { value: "budget", label: "Budget" },
            { value: "calendar", label: "Calendar" },
            { value: "contacts", label: "Contacts" },
            { value: "lore", label: "Social Lore" }
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
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{event.name}</h4>
                      <Badge 
                        variant={event.status === 'confirmed' ? 'default' : 
                                event.status === 'planning' ? 'secondary' : 'destructive'}
                      >
                        {event.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center mb-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {event.date}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Budget: ${event.budget} • {event.attendees} attendees
                      </span>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Plan New Event
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                View Full Calendar
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Vendors
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Budget Report
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === "budget" && (
        <div className="space-y-6">
          {/* Budget Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Allocated</p>
                    <p className="text-2xl font-semibold text-gray-900">${eventBudget.totalAllocated.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-semibold text-red-600">${eventBudget.spent.toLocaleString()}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Remaining</p>
                    <p className="text-2xl font-semibold text-green-600">${eventBudget.remaining.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Breakdown by Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {budgetBreakdown.map((category, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">{category.category}</h4>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ${category.spent.toLocaleString()} / ${category.allocated.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${category.remaining.toLocaleString()} remaining
                        </p>
                      </div>
                    </div>
                    
                    <Progress 
                      value={(category.spent / category.allocated) * 100} 
                      className="h-2 mb-3"
                    />
                    
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">Recent Transactions:</h5>
                      {category.transactions.map((transaction, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{transaction.item}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">${transaction.amount}</span>
                            <Badge 
                              variant={transaction.status === 'paid' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === "calendar" && (
        <div className="space-y-6">
          {/* Calendar Controls */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Event Calendar</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
              <Button variant="outline" size="sm">
                Export Calendar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-3">
              {renderCalendar()}
            </div>

            {/* Event List */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {calendarEvents
                      .filter(event => event.date >= new Date())
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .slice(0, 5)
                      .map(event => (
                        <div key={event.id} className="p-3 border border-gray-200 rounded-lg">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {event.date.toLocaleDateString()} at {event.time}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {event.location}
                          </p>
                          <Badge className={`mt-2 text-xs ${getEventTypeColor(event.type)}`}>
                            {event.type}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Event Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['formal', 'alumni', 'brotherhood', 'recruitment', 'meeting', 'planning'].map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getEventTypeColor(type).replace('text-', 'bg-').replace('800', '500')}`}></div>
                        <span className="text-sm capitalize">{type}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {selectedTab === "contacts" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Vendor Contacts</CardTitle>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorContacts.map((vendor, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>{vendor.type}</TableCell>
                    <TableCell>{vendor.contact}</TableCell>
                    <TableCell>{vendor.phone}</TableCell>
                    <TableCell>{vendor.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1">{vendor.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        Contact
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedTab === "lore" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Social Lore Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Entry title..."
                  value={newLoreEntry.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLoreEntry({ ...newLoreEntry, title: e.target.value })}
                />
                <Textarea
                  placeholder="Share insights, tips, and lessons learned for future social chairs..."
                  value={newLoreEntry.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewLoreEntry({ ...newLoreEntry, content: e.target.value })}
                  className="min-h-[120px]"
                />
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Lore Archive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {socialLoreEntries.map((entry, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{entry.title}</h4>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{entry.date}</p>
                        <p className="text-xs text-gray-600">{entry.author}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{entry.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}