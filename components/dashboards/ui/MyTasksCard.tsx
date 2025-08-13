'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ListTodo } from 'lucide-react';

// Mock data for tasks
const initialTasks = [
  { id: 1, title: "Complete profile setup", due_date: "March 20, 2024", status: 'open' as 'open' | 'done' },
  { id: 2, title: "Submit community service hours", due_date: "March 25, 2024", status: 'open' as 'open' | 'done' },
  { id: 3, title: "Attend mandatory meeting", due_date: "March 28, 2024", status: 'done' as 'open' | 'done' },
  { id: 4, title: "Pay chapter dues", due_date: "March 31, 2024", status: 'open' as 'open' | 'done' },
  { id: 5, title: "Submit event feedback", due_date: null, status: 'open' as 'open' | 'done' }
];

export function MyTasksCard() {
  const [tasks, setTasks] = useState(initialTasks);

  const handleTaskToggle = (taskId: number) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: task.status === 'open' ? 'done' : 'open' } : task
    ));
  };

  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (tasks.length === 0) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <ListTodo className="h-5 w-5 text-navy-600" />
            <span>My Tasks</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-2">You&apos;re all caught up 🎉</p>
            <Button variant="outline" size="sm" className="text-navy-600 border-navy-600 hover:bg-navy-50">
              Complete your profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <ListTodo className="h-5 w-5 text-navy-600" />
          <span>My Tasks</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900 font-medium">{completedTasks}/{totalTasks}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-navy-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={task.status === 'done'}
                  onCheckedChange={() => handleTaskToggle(task.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </div>
                  {task.due_date && (
                    <div className={`text-xs ${task.status === 'done' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Due: {task.due_date}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalTasks > 5 && (
            <div className="pt-2 border-t border-gray-100">
              <Button variant="outline" size="sm" className="w-full text-navy-600 border-navy-600 hover:bg-navy-50">
                View All Tasks
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 