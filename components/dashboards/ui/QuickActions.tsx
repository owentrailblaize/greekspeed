'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, ClipboardList, Upload, Megaphone } from 'lucide-react';

export function QuickActions() {
  const handleCreateEvent = () => {
    console.log('Create Event clicked');
    // TODO: Open event creation modal/form
  };

  const handleAssignTask = () => {
    console.log('Assign Task clicked');
    // TODO: Open task assignment modal/form
  };

  const handleUploadDoc = () => {
    console.log('Upload Doc clicked');
    // TODO: Open document upload modal/form
  };

  const handleSendAnnouncement = () => {
    console.log('Send Announcement clicked');
    // TODO: Open announcement creation modal/form
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Plus className="h-5 w-5 text-navy-600" />
          <span>Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <Button 
            onClick={handleCreateEvent}
            className="w-full justify-start bg-navy-600 hover:bg-navy-700"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Create Event
          </Button>
          
          <Button 
            onClick={handleAssignTask}
            variant="outline"
            className="w-full justify-start text-navy-600 border-navy-600 hover:bg-navy-50"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Assign Task
          </Button>
          
          <Button 
            onClick={handleUploadDoc}
            variant="outline"
            className="w-full justify-start text-navy-600 border-navy-600 hover:bg-navy-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Doc
          </Button>
          
          <Button 
            onClick={handleSendAnnouncement}
            variant="outline"
            className="w-full justify-start text-navy-600 border-navy-600 hover:bg-navy-50"
          >
            <Megaphone className="h-4 w-4 mr-2" />
            Send Announcement
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 