'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, MapPin, Building, Shield, FileText, Phone } from 'lucide-react';

export default function ProfilePage() {
  // Mock user data - will be replaced with real data later
  const mockUser = {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    chapter: 'Alpha Beta Gamma',
    role: 'Alumni',
    bio: 'Experienced software engineer with 5+ years in web development. Passionate about building scalable applications and mentoring junior developers.',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    avatarUrl: null,
    completionPercent: 72
  };

  const profileFields = [
    { label: 'Full Name', value: mockUser.fullName, icon: User, required: true },
    { label: 'Email', value: mockUser.email, icon: Mail, required: true },
    { label: 'Chapter', value: mockUser.chapter, icon: Building, required: true },
    { label: 'Role', value: mockUser.role, icon: Shield, required: true },
    { label: 'Bio', value: mockUser.bio, icon: FileText, required: false },
    { label: 'Phone', value: mockUser.phone, icon: Phone, required: false },
    { label: 'Location', value: mockUser.location, icon: MapPin, required: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Profile</h1>
          <p className="text-gray-600">View and manage your profile information</p>
          
          {/* Profile Completion Banner */}
          <div className="mt-4 p-4 bg-navy-50 rounded-lg border border-navy-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-navy-900">
                  Profile Completion: {mockUser.completionPercent}%
                </p>
                <p className="text-xs text-navy-600 mt-1">
                  Complete your profile to unlock full features and improve your visibility in the network
                </p>
              </div>
              <Badge className="bg-navy-600 text-white">
                {mockUser.completionPercent}% Complete
              </Badge>
            </div>
          </div>
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
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-navy-600 flex items-center justify-center text-white text-4xl font-bold">
                  {mockUser.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <p className="text-sm text-gray-600">No photo uploaded</p>
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