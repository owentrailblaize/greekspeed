'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, User, Calendar, AlertTriangle } from 'lucide-react';

// Mock data for tasks panel
const tasksData = [
  {
    id: 1,
    title: "Complete profile setup",
    assigneeName: "Sarah Johnson",
    dueISO: "2024-03-20T23:59:59Z",
    status: 'overdue' as 'pending' | 'overdue' | 'done'
  },
  {
    id: 2,
    title: "Submit community service hours",
    assigneeName: "Michael Chen",
    dueISO: "2024-03-25T23:59:59Z",
    status: 'pending' as 'pending' | 'overdue' | 'done'
  },
  {
    id: 3,
    title: "Attend mandatory meeting",
    assigneeName: "Alex Thompson",
    dueISO: "2024-03-28T23:59:59Z",
    status: 'done' as 'pending' | 'overdue' | 'done'
  },
  {
    id: 4,
    title: "Pay chapter dues",
    assigneeName: "Jennifer Rodriguez",
    dueISO: "2024-03-31T23:59:59Z",
    status: 'pending' as 'pending' | 'overdue' | 'done'
  },
  {
    id: 5,
    title: "Submit event feedback",
    assigneeName: "David Wilson",
    dueISO: null,
    status: 'pending' as 'pending' | 'overdue' | 'done'
  }
];

export function TasksPanel() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      case 'done': return 'Done';
      default: return 'Unknown';
    }
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'No due date';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    console.log('Task status changed:', taskId, newStatus);
    // TODO: Update task status in backend
  };

  const handleReassign = (taskId: number) => {
    console.log('Reassign task:', taskId);
    // TODO: Open reassignment modal
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <ClipboardList className="h-5 w-5 text-navy-600" />
          <span>Tasks Panel</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {tasksData.map((task) => (
            <div key={task.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                <Badge className={getStatusColor(task.status)}>
                  {getStatusText(task.status)}
                </Badge>
              </div>
              
              <div className="space-y-2 text-xs text-gray-600 mb-3">
                <div className="flex items-center space-x-2">
                  <User className="h-3 w-3" />
                  <span>{task.assigneeName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3" />
                  <span className={task.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                    {formatDate(task.dueISO)}
                  </span>
                  {task.status === 'overdue' && (
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Select 
                  value={task.status} 
                  onValueChange={(value) => handleStatusChange(task.id, value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleReassign(task.id)}
                  className="text-navy-600 border-navy-600 hover:bg-navy-50 text-xs h-7 px-2"
                >
                  Reassign
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t border-gray-100">
          <Button variant="outline" className="w-full text-navy-600 border-navy-600 hover:bg-navy-50">
            View All Tasks
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 