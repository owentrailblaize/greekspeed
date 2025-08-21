'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Building, Shield, FileText, Phone, MapPin, GraduationCap, Home, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onUpdate: (updatedProfile: any) => void;
}

export function EditProfileModal({ isOpen, onClose, profile, onUpdate }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    chapter: '',
    role: '',
    bio: '',
    phone: '',
    location: '',
    grad_year: '',
    major: '',
    minor: '',
    hometown: '',
    gpa: ''
  });

  const [loading, setLoading] = useState(false);

  // Initialize form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || profile.full_name?.split(' ')[0] || '',
        last_name: profile.last_name || profile.full_name?.split(' ')[1] || '',
        email: profile.email || '',
        // Map to whatever field names your API actually returns
        chapter: profile.chapter || profile.chapter_name || profile.chapter_name || 'Not set',
        role: profile.role || profile.user_role || profile.role_name || 'Not set',
        bio: profile.bio || profile.description || '',
        phone: profile.phone || profile.phone_number || '',
        location: profile.location || profile.current_location || '',
        grad_year: profile.grad_year || profile.graduation_year || '',
        major: profile.major || profile.major_field || '',
        minor: profile.minor || profile.minor_field || '',
        hometown: profile.hometown || profile.birth_place || '',
        gpa: profile.gpa || profile.grade_point_average || ''
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Call the existing update logic
      await onUpdate(formData);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-navy-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-navy-600 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="flex items-center gap-2">
                    First Name
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="flex items-center gap-2">
                    Last Name
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="mt-1 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </CardContent>
          </Card>

          {/* Chapter & Role */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-navy-600 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Chapter & Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chapter" className="flex items-center gap-2">
                    Chapter
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                  </Label>
                  <Input
                    id="chapter"
                    value={formData.chapter || 'Not set'}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Chapter cannot be changed</p>
                </div>
                <div>
                  <Label htmlFor="role" className="flex items-center gap-2">
                    Role
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                  </Label>
                  <Input
                    id="role"
                    value={formData.role || 'Not set'}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-navy-600 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grad_year">Graduation Year</Label>
                  <Input
                    id="grad_year"
                    value={formData.grad_year}
                    onChange={(e) => handleInputChange('grad_year', e.target.value)}
                    className="mt-1"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <Label htmlFor="gpa">GPA</Label>
                  <Input
                    id="gpa"
                    value={formData.gpa}
                    onChange={(e) => handleInputChange('gpa', e.target.value)}
                    className="mt-1"
                    placeholder="3.8"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    value={formData.major}
                    onChange={(e) => handleInputChange('major', e.target.value)}
                    className="mt-1"
                    placeholder="Computer Science"
                  />
                </div>
                <div>
                  <Label htmlFor="minor">Minor</Label>
                  <Input
                    id="minor"
                    value={formData.minor}
                    onChange={(e) => handleInputChange('minor', e.target.value)}
                    className="mt-1"
                    placeholder="Mathematics"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-navy-600 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  Phone
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="mt-1"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Current Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="mt-1"
                    placeholder="Tampa, Florida"
                  />
                </div>
                <div>
                  <Label htmlFor="hometown" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Hometown
                  </Label>
                  <Input
                    id="hometown"
                    value={formData.hometown}
                    onChange={(e) => handleInputChange('hometown', e.target.value)}
                    className="mt-1"
                    placeholder="Jackson, Mississippi"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-navy-600 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Bio
                <Badge variant="secondary" className="text-xs">Optional</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="mt-1"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-navy-600 hover:bg-navy-700"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
