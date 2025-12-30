'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, GraduationCap } from 'lucide-react';
import { JoinForm } from '@/components/features/join/JoinForm';
import { AlumniJoinForm } from '@/components/features/join/AlumniJoinForm';
import { Invitation } from '@/types/invitations';

// Mock invitation data for preview
const mockActiveMemberInvitation: Invitation = {
  id: 'mock-active-member',
  token: 'mock-token-active-member',
  chapter_id: 'mock-chapter-id',
  created_by: 'mock-creator',
  email_domain_allowlist: null,
  approval_mode: 'auto',
  single_use: false,
  expires_at: null,
  usage_count: 0,
  max_uses: null,
  is_active: true,
  invitation_type: 'active_member',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  chapter_name: 'Trailblaize Demo'
};

const mockAlumniInvitation: Invitation = {
  id: 'mock-alumni',
  token: 'mock-token-alumni',
  chapter_id: 'mock-chapter-id',
  created_by: 'mock-creator',
  email_domain_allowlist: null,
  approval_mode: 'auto',
  single_use: false,
  expires_at: null,
  usage_count: 0,
  max_uses: null,
  is_active: true,
  invitation_type: 'alumni',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  chapter_name: 'Trailblaize Demo'
};

export default function TestInvitationsPage() {
  const [activeTab, setActiveTab] = useState<'active_member' | 'alumni'>('active_member');

  // Mock handlers that prevent actual submission
  const handleMockSuccess = () => {
    console.log('Form submission prevented - this is a preview only');
  };

  const handleMockCancel = () => {
    console.log('Cancel clicked - this is a preview only');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h1 className="text-2xl font-bold text-yellow-900 mb-2">
            🧪 Invitation Forms UI Preview
          </h1>
          <p className="text-sm text-yellow-800">
            This page shows a preview of the invitation signup forms. Forms are displayed in read-only/preview mode.
            <strong className="block mt-1">⚠️ This is for UI preview only - no actual submissions will be processed!</strong>
          </p>
        </div>

        {/* Tabs for switching between forms */}
        <Card>
          <CardHeader>
            <CardTitle>Invitation Forms Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active_member' | 'alumni')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active_member" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Active Member Form</span>
                </TabsTrigger>
                <TabsTrigger value="alumni" className="flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Alumni Form</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active_member" className="mt-6">
                <div className="bg-white rounded-lg p-4 border-2 border-dashed border-blue-200">
                  <p className="text-xs text-blue-600 mb-4 font-medium">
                    📋 Active Member Invitation Form Preview
                  </p>
                  <JoinForm
                    invitation={mockActiveMemberInvitation}
                    onSuccess={handleMockSuccess}
                    onCancel={handleMockCancel}
                  />
                </div>
              </TabsContent>

              <TabsContent value="alumni" className="mt-6">
                <div className="bg-white rounded-lg p-4 border-2 border-dashed border-purple-200">
                  <p className="text-xs text-purple-600 mb-4 font-medium">
                    📋 Alumni Invitation Form Preview
                  </p>
                  <AlumniJoinForm
                    invitation={mockAlumniInvitation}
                    onSuccess={handleMockSuccess}
                    onCancel={handleMockCancel}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

