'use client';


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, MapPin, Building, Shield, FileText, Phone } from 'lucide-react';
import { useProfile } from '@/lib/hooks/useProfile';
import { UserAvatar } from '@/components/UserAvatar';
import { ProfileService } from '@/lib/services/profileService';

export default function ProfilePage() {
  const { profile, loading, error } = useProfile();
  
  // Calculate completion percentage
  const completion = profile ? ProfileService.calculateCompletion(profile) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="lg:col-span-2 h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
        <div className="max-w-4xl mx-auto px-6 py-10">
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
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Profile</h1>
          <p className="text-gray-600">View and manage your profile information</p>
          
          {/* Profile Completion Banner */}
          {completion && (
            <div className="mt-4 p-4 bg-navy-50 rounded-lg border border-navy-200">
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

        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar and Basic Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Profile Photo</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex justify-center mb-4">
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
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {profile.avatar_url ? 'Photo uploaded' : 'No photo uploaded'}
                </p>
                <button className="mt-2 text-sm text-navy-600 hover:text-navy-700 underline">
                  Upload Photo
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileFields.map((field) => (
                  <div key={field.label} className="flex items-start space-x-3">
                    <div className="w-5 h-5 mt-1 text-gray-500">
                      <field.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <label className="text-sm font-medium text-gray-700">
                          {field.label}
                        </label>
                        {field.required && (
                          <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {field.value || 'Not provided'}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button className="px-6 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700 transition-colors">
            Edit Profile
          </button>
          <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
            Download Profile
          </button>
        </div>
      </div>
    </div>
  );
} 