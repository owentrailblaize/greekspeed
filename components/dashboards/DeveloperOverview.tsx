'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { hasDeveloperPermission, ACCESS_LEVEL_PERMISSIONS } from '@/lib/developerPermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BarChart3, 
  Code2, // Changed from FileCode to Code2
  Building2, 
  Shield, 
  Activity, 
  UserPlus,
  Settings,
  Network,
  Lock
} from 'lucide-react';

export function DeveloperOverview() {
  const { profile, isDeveloper } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChapters: 0,
    totalAlumni: 0, // Add totalAlumni
    systemHealth: 'healthy',
    userGrowthPercentage: '0.0',
    newUsersThisMonth: 0,
    newAlumniThisMonth: 0, // Add newAlumniThisMonth
    newChaptersThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDeveloperStats();
  }, []);

  const loadDeveloperStats = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/developer/stats');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      setStats({
        totalUsers: data.totalUsers || 0,
        totalChapters: data.totalChapters || 0,
        totalAlumni: data.totalAlumni || 0, // Set totalAlumni
        systemHealth: data.systemHealth || 'healthy',
        userGrowthPercentage: data.userGrowthPercentage || '0.0',
        newUsersThisMonth: data.newUsersThisMonth || 0,
        newAlumniThisMonth: data.newAlumniThisMonth || 0, // Set newAlumniThisMonth
        newChaptersThisMonth: data.newChaptersThisMonth || 0
      });

    } catch (error) {
      console.error('Error loading developer stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (!isDeveloper) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have access to the developer portal.</p>
        </div>
      </div>
    );
  }

  const userPermissions = profile?.developer_permissions || [];
  const accessLevel = profile?.access_level || 'standard';

  // Remove the alumni growth percentage calculation since we're not using percentages anymore

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-navy-900">Developer Portal</h1>
              <p className="text-gray-600">System administration and development tools</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {accessLevel} access
              </Badge>
              <Badge variant="outline">
                {userPermissions.length} permissions
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Users Card - simplified */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newUsersThisMonth} new from last month
              </p>
            </CardContent>
          </Card>

          {/* Total Alumni Card - simplified */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alumni</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlumni.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newAlumniThisMonth} new from last month
              </p>
            </CardContent>
          </Card>

          {/* Chapters Card - simplified and fixed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chapters</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChapters}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newChaptersThisMonth} new from last month
              </p>
            </CardContent>
          </Card>

          {/* System Health Card - unchanged */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{stats.systemHealth}</div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {hasDeveloperPermission(userPermissions, 'view_users') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>User Management</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  View and manage all users, roles, and permissions
                </p>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" onClick={() => window.location.href = '/dashboard/user-management'}>
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Analytics Dashboard - LOCKED */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span>Analytics Dashboard</span>
                <Lock className="h-4 w-4 text-gray-400 ml-auto" />
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                View detailed system analytics and user metrics
              </p>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                View Analytics
              </Button>
            </CardContent>
          </Card>

          {hasDeveloperPermission(userPermissions, 'manage_chapters') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <span>Chapter Management</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create, edit, and manage fraternity chapters
                </p>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Manage Chapters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* API Management - LOCKED */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code2 className="h-5 w-5 text-orange-600" />
                <span>API Management</span>
                <Lock className="h-4 w-4 text-gray-400 ml-auto" />
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Create and manage API endpoints and integrations
              </p>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                Manage APIs
              </Button>
            </CardContent>
          </Card>

          {hasDeveloperPermission(userPermissions, 'manage_permissions') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span>Permission Management</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure user roles and system permissions
                </p>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Manage Permissions
                </Button>
              </CardContent>
            </Card>
          )}

          {hasDeveloperPermission(userPermissions, 'manage_onboarding') && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                  <span>Onboarding Flow</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure user onboarding and registration flows
                </p>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Configure Onboarding
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>System Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Your Permissions</h4>
                <div className="space-y-2">
                  {userPermissions.map((permission: string) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">{permission.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Access Level</h4>
                <p className="text-sm text-gray-600 capitalize">{accessLevel}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {ACCESS_LEVEL_PERMISSIONS[accessLevel as keyof typeof ACCESS_LEVEL_PERMISSIONS]?.length || 0} permissions available
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
