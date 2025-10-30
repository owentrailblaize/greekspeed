'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, User, Mail, Phone, MapPin, GraduationCap, Building2, Shield, Calendar, BookOpen } from 'lucide-react';
import { getRoleDisplayName } from '@/lib/permissions';

interface User {
  id: string;
  email: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  chapter: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  bio: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  chapter_role: string | null;
  member_status: string | null;
  pledge_class: string | null;
  grad_year: number | null;
  major: string | null;
  minor: string | null;
  hometown: string | null;
  gpa: number | null;
  chapter_id: string | null;
  is_developer: boolean;
  developer_permissions: string[];
  access_level: string | null;
}

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function ViewUserModal({ isOpen, onClose, user }: ViewUserModalProps) {
  if (!isOpen || !user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'alumni': return 'secondary';
      case 'active_member': return 'default';
      default: return 'outline';
    }
  };

  const getMemberStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'probation': return 'destructive';
      case 'suspended': return 'destructive';
      case 'graduated': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>User Profile: {user.full_name || user.email}</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Full Name:</span>
                  <span className="font-medium">{user.full_name || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">First Name:</span>
                  <span className="font-medium">{user.first_name || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Name:</span>
                  <span className="font-medium">{user.last_name || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium flex items-center space-x-1">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-mono text-xs text-gray-500">{user.id}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Role & Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Role:</span>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role ? user.role.replace('_', ' ') : 'Not set'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Member Status:</span>
                  <Badge variant={getMemberStatusBadgeVariant(user.member_status)}>
                    {user.member_status || 'Not set'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chapter Role:</span>
                  <span className="font-medium">{user.chapter_role ? getRoleDisplayName(user.chapter_role as any) : 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Developer Access:</span>
                  <Badge variant={user.is_developer ? "secondary" : "outline"}>
                    {user.is_developer ? 'Developer' : 'Standard User'}
                  </Badge>
                </div>
                {user.is_developer && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Access Level:</span>
                    <span className="font-medium capitalize">{user.access_level || 'Not set'}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chapter Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>Chapter Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Chapter:</span>
                <span className="font-medium">{user.chapter || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Chapter ID:</span>
                <span className="font-mono text-xs text-gray-500">{user.chapter_id || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pledge Class:</span>
                <span className="font-medium">{user.pledge_class || 'Not set'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium flex items-center space-x-1">
                  {user.phone ? (
                    <>
                      <Phone className="h-3 w-3" />
                      <span>{user.phone}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Not provided</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium flex items-center space-x-1">
                  {user.location ? (
                    <>
                      <MapPin className="h-3 w-3" />
                      <span>{user.location}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Not provided</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hometown:</span>
                <span className="font-medium">{user.hometown || 'Not provided'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <GraduationCap className="h-4 w-4" />
                <span>Academic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Graduation Year:</span>
                <span className="font-medium">{user.grad_year || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Major:</span>
                <span className="font-medium">{user.major || 'Not declared'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Minor:</span>
                <span className="font-medium">{user.minor || 'Not declared'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GPA:</span>
                <span className="font-medium">{user.gpa || 'Not provided'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          {user.bio && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Biography</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{user.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Developer Permissions */}
          {user.is_developer && user.developer_permissions && user.developer_permissions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Developer Permissions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.developer_permissions.map((permission, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {permission.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>System Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{formatDate(user.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">{formatDate(user.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
