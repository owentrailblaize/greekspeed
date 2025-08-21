'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Building, Shield, FileText, Phone, MapPin, GraduationCap, Home, Calculator, Image, Upload } from 'lucide-react';
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
      if (profile.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      }
    }
  }, [profile]);

  // Email validation regex
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // GPA validation (0.0 - 4.0)
  const validateGPA = (gpa: string): boolean => {
    const gpaNum = parseFloat(gpa);
    return !isNaN(gpaNum) && gpaNum >= 0.0 && gpaNum <= 4.0;
  };

  // Phone number formatting
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  // Enhanced input change handler with validation
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Real-time validation for specific fields
    if (field === 'email' && value) {
      if (!validateEmail(value)) {
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      }
    }

    if (field === 'gpa' && value) {
      if (!validateGPA(value)) {
        setErrors(prev => ({ ...prev, gpa: 'GPA must be between 0.0 and 4.0' }));
      }
    }
  };

  // Phone number specific handler
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  // Enhanced submit handler with validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.gpa && !validateGPA(formData.gpa)) {
      newErrors.gpa = 'GPA must be between 0.0 and 4.0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Persistent Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-navy-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Combined Profile Photo & Banner Card */}
            <Card className="p-0">
              <CardContent className="relative h-64 p-0 overflow-hidden">
                {/* Banner Section - Takes up entire card with rounded corners */}
                <div className="absolute inset-0 bg-gradient-to-r from-navy-600 via-blue-600 to-navy-700 flex items-center justify-center text-white cursor-pointer group rounded-lg">
                  {/* Banner Upload Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-lg font-medium">Upload Banner</p>
                      <p className="text-sm">Click to upload banner image</p>
                    </div>
                  </div>
                  
                  {/* Banner Placeholder Text */}
                  <div className="text-center opacity-80 group-hover:opacity-0 transition-opacity">
                    <p className="text-lg font-medium">Banner Image</p>
                    <p className="text-sm">Click to upload your banner</p>
                  </div>
                </div>

                {/* Profile Photo Section - Positioned at bottom-left, no text */}
                <div className="absolute bottom-4 left-4 z-10">
                  {/* Avatar Container */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Profile avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-xl font-semibold text-gray-500">
                          {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Icon Overlay */}
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-navy-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-navy-700 transition-colors shadow-md">
                      <Image className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Banner Upload Input (Hidden) */}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="banner-upload"
                />
                
                {/* Avatar Upload Input (Hidden) */}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="avatar-upload"
                />
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader className="pb-0">
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
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`mt-1 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                    required
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chapter & Role */}
            <Card>
              <CardHeader className="pb-0">
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
              <CardHeader className="pb-0">
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
                      className={`mt-1 ${errors.gpa ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="3.8"
                      type="number"
                      step="0.1"
                      min="0.0"
                      max="4.0"
                    />
                    {errors.gpa && (
                      <p className="text-xs text-red-500 mt-1">{errors.gpa}</p>
                    )}
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
              <CardHeader className="pb-0">
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
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="mt-1"
                    placeholder="(555) 123-4567"
                    maxLength={14}
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
              <CardHeader className="pb-0">
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
          </form>
        </div>

        {/* Persistent Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
          <Button
            type="submit"
            disabled={loading}
            className="bg-navy-600 hover:bg-navy-700"
            onClick={handleSubmit}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
