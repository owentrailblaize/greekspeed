'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Mail, Shield } from 'lucide-react';

export function DashboardClient() {
  // DashboardClient: Component initializing
  
  const { user, session, loading, signOut } = useAuth();
  const router = useRouter();

  // DashboardClient: Auth context values

  useEffect(() => {
    // DashboardClient: useEffect triggered

    if (!loading && !user) {
      // DashboardClient: No user, redirecting to sign-in
      router.push('/sign-in');
    } else if (!loading && user) {
      // DashboardClient: User authenticated, should render dashboard
    }
  }, [user, session, loading, router]);

  const handleSignOut = async () => {
    // DashboardClient: Signing out...
    try {
      await signOut();
      // DashboardClient: Sign out successful, redirecting to landing page
      router.push('/');
    } catch (error) {
      console.error('DashboardClient: Sign out failed:', error);
    }
  };

  // DashboardClient: About to render, current state

  if (loading) {
    // DashboardClient: Rendering loading state
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // DashboardClient: Rendering redirect state (no user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to sign-in...</p>
        </div>
      </div>
    );
  }

  // DashboardClient: Rendering main dashboard content
  return (
    <div className="max-w-7xl mx-auto p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s your account overview.</p>
        </div>
        <Button 
          onClick={handleSignOut}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>

      {/* User Info Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-navy-600" />
            <span>Account Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-mono text-sm">{user.id}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Account Status</p>
                <p className="font-medium text-green-600">Active</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Sign In</p>
                <p className="font-medium">
                  {user.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).toLocaleDateString()
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-navy-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <User className="h-6 w-6 text-navy-600" />
              </div>
              <h3 className="font-medium mb-2">View Profile</h3>
              <p className="text-sm text-gray-600">Manage your account settings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium mb-2">Alumni Network</h3>
              <p className="text-sm text-gray-600">Connect with fellow alumni</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium mb-2">Membership</h3>
              <p className="text-sm text-gray-600">Manage your membership</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-8 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-2">
              <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
              <p><strong>Created:</strong> {user.created_at}</p>
              <p><strong>Last Sign In:</strong> {user.last_sign_in_at || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 