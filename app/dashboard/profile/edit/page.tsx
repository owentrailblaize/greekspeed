'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { User, Mail, MapPin, Building, Shield, FileText, Phone, Save, X, Upload } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
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

  const chapters = [
    'Alpha Beta Gamma',
    'Beta Gamma Delta',
    'Gamma Delta Epsilon',
    'Delta Epsilon Zeta'
  ];

  const roles = [
    'Active Member',
    'Alumni',
    'Admin / Executive'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-navy-900 mb-2">Edit Profile</h1>
              <p className="text-gray-600">Update your profile information and settings</p>
            </div>
            <Link href="/dashboard/profile">
              <Button variant="outline" className="flex items-center space-x-2">
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </Button>
            </Link>
          </div>
          
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

        {/* Edit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar Upload */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Profile Photo</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-navy-600 flex items-center justify-center text-white text-4xl font-bold">
                  {mockUser.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="space-y-2">
                  <Button className="w-full bg-navy-600 hover:bg-navy-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                  <Button variant="outline" className="w-full">
                    Remove Photo
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: Square image, 400x400px or larger
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>First Name</span>
                      <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                        Required
                      </Badge>
                    </Label>
                    <Input
                      id="firstName"
                      defaultValue={mockUser.fullName.split(' ')[0]}
                      placeholder="Enter first name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>Last Name</span>
                      <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                        Required
                      </Badge>
                    </Label>
                    <Input
                      id="lastName"
                      defaultValue={mockUser.fullName.split(' ')[1]}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>Email</span>
                    <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                      Required
                    </Badge>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={mockUser.email}
                    placeholder="Enter email address"
                    disabled
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                {/* Chapter and Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chapter" className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span>Chapter</span>
                      <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                        Required
                      </Badge>
                    </Label>
                    <Select value={mockUser.chapter}>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter} value={chapter}>
                          {chapter}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role" className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span>Role</span>
                      <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                        Required
                      </Badge>
                    </Label>
                    <Select value={mockUser.role}>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span>Bio</span>
                    <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                      Optional
                    </Badge>
                  </Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    defaultValue={mockUser.bio}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>Phone</span>
                      <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                        Optional
                      </Badge>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      defaultValue={mockUser.phone}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>Location</span>
                      <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                        Optional
                      </Badge>
                    </Label>
                    <Input
                      id="location"
                      defaultValue={mockUser.location}
                      placeholder="Enter city, state"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button className="px-8 py-2 bg-navy-600 hover:bg-navy-700">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Link href="/dashboard/profile">
            <Button variant="outline" className="px-8 py-2">
              Cancel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 