'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, MapPin, Building, Shield, FileText, Phone, MessageCircle, Users, Calendar, Settings, Edit } from 'lucide-react';
import { useProfile } from '@/lib/hooks/useProfile';
import { UserAvatar } from '@/components/UserAvatar';
import { ProfileService } from '@/lib/services/profileService';
import Link from 'next/link';

export default function ProfilePage() {
  const { profile, loading, error } = useProfile();
  const [activeTab, setActiveTab] = useState('posts');
  
  // Calculate completion percentage
  const completion = profile ? ProfileService.calculateCompletion(profile) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Profile</h1>
            <p className="text-gray-600">{error || 'Profile not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const profileFields = [
    { label: 'Full Name', value: profile.full_name, icon: User, required: true },
    { label: 'Email', value: profile.email, icon: Mail, required: true },
    { label: 'Chapter', value: profile.chapter, icon: Building, required: true },
    { label: 'Role', value: profile.role, icon: Shield, required: true },
    { label: 'Bio', value: profile.bio, icon: FileText, required: false },
    { label: 'Phone', value: profile.phone, icon: Phone, required: false },
    { label: 'Location', value: profile.location, icon: MapPin, required: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <div className="max-w-full mx-auto px-6 py-10">
        {/* Banner Header Section */}
        <div className="relative mb-8 rounded-xl overflow-hidden">
                     {/* Banner Image - Placeholder for now */}
           <div className="w-full h-48 bg-gradient-to-r from-navy-600 via-blue-600 to-navy-700 flex items-center justify-center">
             <div className="text-white text-center">
               <p className="text-lg font-medium">Banner Image</p>
               <p className="text-sm opacity-80">Users will be able to update this later</p>
             </div>
           </div>
          
          {/* Profile Picture Overlay */}
          <div className="absolute left-8 bottom-4">
            <div className="relative">
              <UserAvatar
                user={{
                  user_metadata: {
                    avatar_url: profile.avatar_url,
                    full_name: profile.full_name
                  }
                }}
                completionPercent={completion?.percentage || 0}
                hasUnread={false}
                size="lg"
                className="ring-4 ring-white shadow-lg"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-navy-600 rounded-full flex items-center justify-center shadow-md">
                <Edit className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* User Info and Action Buttons */}
          <div className="absolute left-48 bottom-4 text-white">
            <h1 className="text-3xl font-bold mb-1">{profile.full_name || 'User Name'}</h1>
            <p className="text-lg opacity-90">{profile.role ? profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Member'}</p>
          </div>

                     {/* Action Buttons */}
           <div className="absolute right-8 bottom-4 flex items-center space-x-3">
             <Button size="sm" className="w-10 h-10 rounded-full bg-navy-600 hover:bg-navy-700">
               <MessageCircle className="w-4 h-4" />
             </Button>
             <Button size="sm" className="bg-navy-600 hover:bg-navy-700 text-white">
               Follow
             </Button>
             <Button size="sm" variant="outline" className="bg-white text-navy-600 border-navy-600 hover:bg-navy-50">
               Schedule Meeting
             </Button>
           </div>
        </div>

        {/* Main Content Area - Three Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - About Section */}
          <div className="lg:col-span-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-navy-600">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileFields.map((field) => (
                  <div key={field.label} className="flex items-start space-x-3">
                                         <div className="w-5 h-5 mt-1 text-navy-500">
                       <field.icon className="w-5 h-5" />
                     </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{field.label}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {field.value || 'Not provided'}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Content Tabs */}
          <div className="lg:col-span-6">
            <Card className="bg-white">
              <CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="followers" className="text-sm">Followers</TabsTrigger>
                    <TabsTrigger value="following" className="text-sm">Following</TabsTrigger>
                    <TabsTrigger value="posts" className="text-sm">Posts</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="followers" className="mt-4">
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Followers will be displayed here</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="following" className="mt-4">
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Following will be displayed here</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="posts" className="mt-4">
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>User posts will be displayed here</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>

          {/* Right Column - Tools and Suggestions */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Profile Tools */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-navy-600">Profile Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/dashboard/profile/edit">
                    <Button variant="outline" className="w-full justify-start">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Profile Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    View Activity
                  </Button>
                </CardContent>
              </Card>

              {/* Suggestions */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-navy-600">You might know</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">John Doe</p>
                      <p className="text-xs text-gray-500">john@example.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Jane Smith</p>
                      <p className="text-xs text-gray-500">jane@example.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Bob Johnson</p>
                      <p className="text-xs text-gray-500">bob@example.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Users */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-navy-600">Active</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Alice Brown</p>
                      <p className="text-xs text-green-600">Online, 1 min ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Charlie Wilson</p>
                      <p className="text-xs text-yellow-600">Busy, 9 min ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">David Lee</p>
                      <p className="text-xs text-green-600">Online, 15 min ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Profile Completion Banner - Preserved from original */}
        {completion && (
          <div className="mt-8 p-4 bg-navy-50 rounded-lg border border-navy-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-navy-900">
                  Profile Completion: {completion.percentage}%
                </p>
                <p className="text-xs text-navy-600 mt-1">
                  Complete your profile to unlock full features and improve your visibility in the network
                </p>
              </div>
              <Badge className="bg-navy-600 text-white">
                {completion.percentage}% Complete
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 