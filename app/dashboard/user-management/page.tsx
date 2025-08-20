'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { hasDeveloperPermission } from '@/lib/developerPermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Table, Shield } from 'lucide-react';
import { UsersTab } from '@/components/user-management/UsersTab';

export default function UserManagementPage() {
  const { profile, isDeveloper } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  if (!isDeveloper) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have access to user management.</p>
        </div>
      </div>
    );
  }

  const userPermissions = profile?.developer_permissions || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-navy-900">User Management</h1>
              <p className="text-gray-600">Manage users, profiles, and database tables</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Developer Access
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="profiles" className="flex items-center space-x-2">
              <Table className="h-4 w-4" />
              <span>Profiles</span>
            </TabsTrigger>
            <TabsTrigger value="chapters" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Chapters</span>
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex items-center space-x-2">
              <Table className="h-4 w-4" />
              <span>All Tables</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UsersTab />
          </TabsContent>

          {/* Comment out until you create these components */}
          {/* <TabsContent value="profiles" className="space-y-6">
            <ProfilesTab />
          </TabsContent>

          <TabsContent value="chapters" className="space-y-6">
            <ChaptersTab />
          </TabsContent>

          <TabsContent value="tables" className="space-y-6">
            <TablesTab />
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  );
}
