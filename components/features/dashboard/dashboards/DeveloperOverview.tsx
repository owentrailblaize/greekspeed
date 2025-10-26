'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { getUserPermissions } from '@/lib/developerPermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Settings,
  Network,
  ArrowRight,
  UserCheck,
  Shield
} from 'lucide-react';

export function DeveloperOverview() {
  const { profile, isDeveloper } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChapters: 0,
    totalAlumni: 0,
    systemHealth: 'healthy',
    userGrowthPercentage: '0.0',
    newUsersThisMonth: 0,
    newAlumniThisMonth: 0,
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
        totalAlumni: data.totalAlumni || 0,
        systemHealth: data.systemHealth || 'healthy',
        userGrowthPercentage: data.userGrowthPercentage || '0.0',
        newUsersThisMonth: data.newUsersThisMonth || 0,
        newAlumniThisMonth: data.newAlumniThisMonth || 0,
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

  const userPermissions = getUserPermissions(profile);
  const accessLevel = profile?.access_level || 'standard';

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
          {/* Total Users Card */}
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

          {/* Total Alumni Card */}
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

          {/* Chapters Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chapters</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChapters}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newChaptersThisMonth} new from last month
              </p>
            </CardContent>
          </Card>

          {/* System Health Card */}
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

        {/* User Management Section - Enhanced and Centered */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Developer Tools</h2>
            <p className="text-gray-600">Development and management tools for Trailblaize Internal. Request new features as needed Deft Point.</p>
          </div>
          
          {/* Single User Management Card - Enhanced */}
          <div className="max-w-2xl mx-auto">
            <Card className="hover:shadow-lg transition-all duration-200 border-2 border-blue-100 hover:border-blue-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-gray-900">User Management</span>

                  </div>
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Create, delete, and manage chapters and alumni with basic user management functionality.
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Feature List */}
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      <span>Create & Delete Users</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span>Alumni Management</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 text-green-500" />
                      <span>Chapter Assignment</span>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="pt-2">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                      onClick={() => window.location.href = '/dashboard/user-management'}
                    >
                      <span>Access User Management</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
