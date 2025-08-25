'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X } from 'lucide-react';
import { TaskPriority, CreateTaskRequest } from '@/types/operations';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: CreateTaskRequest) => Promise<void>;
  chapterMembers: Array<{ id: string; full_name: string }>;
  creating: boolean;
}

export function TaskModal({ isOpen, onClose, onSubmit, chapterMembers, creating }: TaskModalProps) {
  const [newTask, setNewTask] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    assignee_id: '',
    due_date: '',
    priority: 'medium',
    chapter_id: '' // Only keep chapter_id
  });

  const handleSubmit = async () => {
    if (!newTask.title || !newTask.assignee_id) return;
    
    await onSubmit(newTask);
    
    // Reset form
    setNewTask({
      title: '',
      description: '',
      assignee_id: '',
      due_date: '',
      priority: 'medium',
      chapter_id: '' // Only keep chapter_id
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-visible rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Create New Task
              </h3>
              <button
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Task Title *
                </Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy-500 focus:ring-navy-500 sm:text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy-500 focus:ring-navy-500 sm:text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="assignee" className="text-sm font-medium text-gray-700">
                  Assign To *
                </Label>
                <Select
                  value={newTask.assignee_id}
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, assignee_id: value }))}
                >
                  <SelectItem value="">Select assignee</SelectItem>
                  {chapterMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              
              <div>
                <Label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                  Due Date
                </Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy-500 focus:ring-navy-500 sm:text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Priority *
                </Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value as TaskPriority }))}
                >
                  <SelectItem value="">Select priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </Select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={creating || !newTask.title || !newTask.assignee_id}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-navy-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Task
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={creating}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
