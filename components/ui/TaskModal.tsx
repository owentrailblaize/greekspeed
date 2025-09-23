'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X, Users, UserCheck } from 'lucide-react';
import { TaskPriority, CreateTaskRequest } from '@/types/operations';
import { Checkbox } from '@/components/ui/checkbox';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: CreateTaskRequest) => Promise<void>;
  chapterMembers: Array<{ id: string; full_name: string; role: string; chapter_role: string | null }>;
  creating: boolean;
}

export function TaskModal({ isOpen, onClose, onSubmit, chapterMembers, creating }: TaskModalProps) {
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const executiveMembers = chapterMembers.filter(member => 
    member.role === 'admin' || 
    (member.chapter_role && ['president', 'vice_president', 'treasurer', 'secretary', 'rush_chair', 'social_chair', 'philanthropy_chair', 'risk_management_chair', 'alumni_relations_chair'].includes(member.chapter_role))
  );

  const activeMembers = chapterMembers.filter(member => 
    member.role === 'active_member' && 
    (!member.chapter_role || !['president', 'vice_president', 'treasurer', 'secretary', 'rush_chair', 'social_chair', 'philanthropy_chair', 'risk_management_chair', 'alumni_relations_chair'].includes(member.chapter_role))
  );

  const handleAssigneeToggle = (memberId: string) => {
    console.log('=== TaskModal: handleAssigneeToggle called ===');
    console.log('memberId:', memberId);
    console.log('current selectedAssignees:', selectedAssignees);
    
    setSelectedAssignees(prev => {
      const newSelection = prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId];
      
      console.log('newSelection:', newSelection);
      
      setNewTask(prevTask => ({
        ...prevTask,
        assignee_id: newSelection
      }));
      
      console.log('✅ TaskModal: Updated assignee_id to:', newSelection);
      return newSelection;
    });
  };

  const handleSelectAllExecutive = () => {
    console.log('=== TaskModal: handleSelectAllExecutive called ===');
    const executiveIds = executiveMembers.map(member => member.id);
    console.log('executiveIds:', executiveIds);
    const allExecutiveSelected = executiveIds.every(id => selectedAssignees.includes(id));
    console.log('allExecutiveSelected:', allExecutiveSelected);
    
    if (allExecutiveSelected) {
      console.log('Deselecting all executive members');
      setSelectedAssignees(prev => prev.filter(id => !executiveIds.includes(id)));
      setNewTask(prevTask => ({
        ...prevTask,
        assignee_id: Array.isArray(prevTask.assignee_id) 
          ? prevTask.assignee_id.filter((id: string) => !executiveIds.includes(id))
          : []
      }));
    } else {
      console.log('Selecting all executive members');
      setSelectedAssignees(prev => [...new Set([...prev, ...executiveIds])]);
      setNewTask(prevTask => ({
        ...prevTask,
        assignee_id: [...new Set([...(prevTask.assignee_id as string[]), ...executiveIds])]
      }));
    }
  };

  const handleSelectAllActive = () => {
    console.log('=== TaskModal: handleSelectAllActive called ===');
    const activeIds = activeMembers.map(member => member.id);
    console.log('activeIds:', activeIds);
    const allActiveSelected = activeIds.every(id => selectedAssignees.includes(id));
    console.log('allActiveSelected:', allActiveSelected);
    
    if (allActiveSelected) {
      console.log('Deselecting all active members');
      setSelectedAssignees(prev => prev.filter(id => !activeIds.includes(id)));
      setNewTask(prevTask => ({
        ...prevTask,
        assignee_id: Array.isArray(prevTask.assignee_id) 
          ? prevTask.assignee_id.filter((id: string) => !activeIds.includes(id))
          : []
      }));
    } else {
      console.log('Selecting all active members');
      setSelectedAssignees(prev => [...new Set([...prev, ...activeIds])]);
      setNewTask(prevTask => ({
        ...prevTask,
        assignee_id: [...new Set([...(prevTask.assignee_id as string[]), ...activeIds])]
      }));
    }
  };

  const [newTask, setNewTask] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    assignee_id: [],
    due_date: '',
    priority: 'medium',
    chapter_id: ''
  });

  const handleSubmit = async () => {
    console.log('=== TaskModal: handleSubmit called ===');
    console.log('newTask:', newTask);
    console.log('selectedAssignees:', selectedAssignees);
    console.log('Array.isArray(newTask.assignee_id):', Array.isArray(newTask.assignee_id));
    console.log('newTask.assignee_id length:', Array.isArray(newTask.assignee_id) ? newTask.assignee_id.length : 'not array');
    
    if (!newTask.title || (Array.isArray(newTask.assignee_id) && newTask.assignee_id.length === 0)) {
      console.log('❌ TaskModal: Validation failed - missing title or assignees');
      return;
    }
    
    console.log('✅ TaskModal: Validation passed, calling onSubmit with:', {
      title: newTask.title,
      description: newTask.description,
      assignee_id: newTask.assignee_id,
      due_date: newTask.due_date,
      priority: newTask.priority,
      chapter_id: newTask.chapter_id
    });
    
    await onSubmit(newTask);
    
    console.log('✅ TaskModal: onSubmit completed, resetting form');
    
    // Reset form
    setNewTask({
      title: '',
      description: '',
      assignee_id: [],
      due_date: '',
      priority: 'medium',
      chapter_id: ''
    });
    setSelectedAssignees([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative transform rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-[95vw] sm:max-w-lg h-[70vh] sm:h-auto flex flex-col">

        {/* Header - Fixed */}
        <div className="rounded-t-lg bg-white px-4 pt-4 pb-3 sm:px-6 sm:pt-4 sm:pb-3 flex-shrink-0 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Create New Task
            </h3>
            <button
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="bg-white px-4 pt-3 pb-4 sm:px-6 sm:pt-4 sm:pb-4 flex-1 overflow-y-auto">
          <div className="space-y-4 sm:space-y-3">
            {/* Task Title - Reduced spacing */}
            <div>
              <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy-500 focus:ring-navy-500 text-sm h-9"
              />
            </div>
            
            {/* Description - Resizable with smaller initial height */}
            <div>
              <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy-500 focus:ring-navy-500 text-sm min-h-[60px] max-h-[120px] resize-y"
              />
            </div>
            
            {/* Assign To Section - Reduced spacing */}
            <div>
              <Label htmlFor="assignee" className="text-sm font-medium text-gray-700 mb-2">
                Assign To * ({selectedAssignees.length} selected)
              </Label>
              
              {/* Desktop: Two-column layout, Mobile: Stacked */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Executive Members Section */}
                {executiveMembers.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-navy-600" />
                        <span className="text-xs font-medium text-gray-700">Executive</span>
                        <span className="text-xs text-gray-500">({executiveMembers.length})</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllExecutive}
                        className="h-5 px-2 text-xs"
                      >
                        {executiveMembers.every(member => selectedAssignees.includes(member.id)) ? 'None' : 'All'}
                      </Button>
                    </div>
                    <div className="space-y-1 max-h-20 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                      {executiveMembers.map((member) => (
                        <div key={member.id} className="flex items-center space-x-1">
                          <Checkbox
                            id={`exec-${member.id}`}
                            checked={selectedAssignees.includes(member.id)}
                            onCheckedChange={() => handleAssigneeToggle(member.id)}
                            className="h-3 w-3"
                          />
                          <Label 
                            htmlFor={`exec-${member.id}`} 
                            className="text-xs text-gray-700 cursor-pointer flex-1 truncate"
                          >
                            {member.full_name}
                            {member.chapter_role && (
                              <span className="ml-1 text-xs text-gray-500 capitalize">
                                ({member.chapter_role.replace('_', ' ')})
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Members Section */}
                {activeMembers.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <UserCheck className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium text-gray-700">Active</span>
                        <span className="text-xs text-gray-500">({activeMembers.length})</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllActive}
                        className="h-5 px-2 text-xs"
                      >
                        {activeMembers.every(member => selectedAssignees.includes(member.id)) ? 'None' : 'All'}
                      </Button>
                    </div>
                    <div className="space-y-1 max-h-20 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                      {activeMembers.map((member) => (
                        <div key={member.id} className="flex items-center space-x-1">
                          <Checkbox
                            id={`active-${member.id}`}
                            checked={selectedAssignees.includes(member.id)}
                            onCheckedChange={() => handleAssigneeToggle(member.id)}
                            className="h-3 w-3"
                          />
                          <Label 
                            htmlFor={`active-${member.id}`} 
                            className="text-xs text-gray-700 cursor-pointer flex-1 truncate"
                          >
                            {member.full_name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedAssignees.length === 0 && (
                <div className="text-xs text-gray-500 italic mt-1">
                  Select at least one member to assign this task to
                </div>
              )}
            </div>
            
            {/* Due Date and Priority - Side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy-500 focus:ring-navy-500 text-sm h-9"
                />
              </div>
              
              <div>
                <Label htmlFor="priority" className="block text-base sm:text-sm font-medium text-gray-700 mb-2 sm:mb-1">
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
        </div>

        {/* Footer - Fixed */}
        <div className="rounded-b-lg bg-gray-50 px-4 py-2 sm:px-6 sm:py-3 flex-shrink-0 border-t border-gray-200">
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={creating}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2 h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={creating || !newTask.title || (Array.isArray(newTask.assignee_id) && newTask.assignee_id.length === 0)}
              className="inline-flex justify-center rounded-md border border-transparent bg-navy-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2 h-8"
            >
              {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              {Array.isArray(newTask.assignee_id) && newTask.assignee_id.length > 1 
                ? `Create ${newTask.assignee_id.length} Tasks` 
                : 'Create Task'
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}