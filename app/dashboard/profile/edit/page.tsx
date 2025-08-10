'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { User, Mail, MapPin, Building, Shield, FileText, Phone, Save, X, Upload } from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/lib/hooks/useProfile';
import { UserAvatar } from '@/components/UserAvatar';
import { ProfileFormData } from '@/types/profile';

export default function EditProfilePage() {
  const { profile, loading, error, updateProfile, uploadAvatar } = useProfile();
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    chapter: '',
    role: 'Alumni',
    bio: '',
    phone: '',
    location: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        chapter: profile.chapter || '',
        role: profile.role || 'Alumni',
        bio: profile.bio || '',
        phone: profile.phone || '',
        location: profile.location || ''
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await updateProfile(formData);
      // Redirect to profile page after successful update
      window.location.href = '/dashboard/profile';
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadAvatar(file);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    } finally {
      setUploading(false);
    }
  };

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
          

        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar Upload */}
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
                    completionPercent={0}
                    hasUnread={false}
                    size="lg"
                  />
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <label htmlFor="avatar-upload">
                    <Button 
                      type="button"
                      className="w-full bg-navy-600 hover:bg-navy-700 cursor-pointer"
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                  </label>
                  <Button type="button" variant="outline" className="w-full">
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
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="Enter first name"
                      required
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
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Enter last name"
                      required
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
                      value={profile.email}
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
                    <Select 
                      value={formData.chapter}
                      onValueChange={(value) => handleInputChange('chapter', value)}
                    >
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
                    <Select 
                      value={formData.role}
                      onValueChange={(value) => handleInputChange('role', value as 'Admin / Executive' | 'Active Member' | 'Alumni')}
                    >
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
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
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
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
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
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Enter city, state"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button 
            type="submit" 
            className="px-8 py-2 bg-navy-600 hover:bg-navy-700"
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
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