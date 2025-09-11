'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Building, Shield, FileText, Phone, MapPin, GraduationCap, Home, Calculator, Image, Upload, Linkedin, Briefcase, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvatarService } from '@/lib/services/avatarService';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { BannerService } from '@/lib/services/bannerService';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase/client';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onUpdate: (updatedProfile: any) => void;
  variant?: 'desktop' | 'mobile';
}

export function EditProfileModal({ isOpen, onClose, profile, onUpdate, variant = 'desktop' }: EditProfileModalProps) {
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
    gpa: '',
    linkedin_url: '',
    industry: '',
    company: '',
    job_title: '',
    is_actively_hiring: false,
    description: '',
    tags: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);

  // Add alumni data state
  const [alumniData, setAlumniData] = useState<any>(null);
  const [loadingAlumni, setLoadingAlumni] = useState(false);

  const { updateProfile, refreshProfile } = useProfile();

  // Add loadAlumniData function
  const loadAlumniData = async () => {
    if (!profile?.id || profile.role !== 'alumni') return;
    
    setLoadingAlumni(true);
    try {
      const { data, error } = await supabase
        .from('alumni')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (error) {
        console.error('Error loading alumni data:', error);
        return;
      }

      setAlumniData(data);
      console.log('📊 Loaded alumni data:', data);
    } catch (error) {
      console.error('Error loading alumni data:', error);
    } finally {
      setLoadingAlumni(false);
    }
  };

  // Update the useEffect to load alumni data
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || profile.full_name?.split(' ')[0] || '',
        last_name: profile.last_name || profile.full_name?.split(' ')[1] || '',
        email: profile.email || '',
        chapter: profile.chapter || profile.chapter_name || profile.chapter_name || 'Not set',
        role: profile.role || profile.user_role || profile.role_name || 'Not set',
        bio: profile.bio || profile.description || '',
        phone: profile.phone || profile.phone_number || '',
        location: profile.location || profile.current_location || '',
        grad_year: profile.grad_year || profile.graduation_year || '',
        major: profile.major || profile.major_field || '',
        minor: profile.minor || profile.minor_field || '',
        hometown: profile.hometown || profile.birth_place || '',
        gpa: profile.gpa || profile.grade_point_average || '',
        linkedin_url: profile.linkedin_url || '',
        industry: '',
        company: '',
        job_title: '',
        is_actively_hiring: false,
        description: '',
        tags: ''
      });
      
      if (profile.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      }
      if (profile.banner_url) {
        setBannerPreview(profile.banner_url);
      }

      // Load alumni data if user is alumni
      if (profile.role === 'alumni') {
        loadAlumniData();
      }
    }
  }, [profile]);

  // Add another useEffect to update formData when alumniData loads
  useEffect(() => {
    if (alumniData) {
      setFormData(prev => ({
        ...prev,
        industry: alumniData.industry || '',
        company: alumniData.company || '',
        job_title: alumniData.job_title || '',
        is_actively_hiring: alumniData.is_actively_hiring || false,
        description: alumniData.description || '',
        tags: alumniData.tags || '',
        grad_year: alumniData.graduation_year || prev.grad_year,
        phone: alumniData.phone || prev.phone,
        location: alumniData.location || prev.location
      }));
    }
  }, [alumniData]);

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

  // Add LinkedIn URL validation function after the existing validation functions
  const validateLinkedInURL = (url: string): boolean => {
    if (!url) return true; // Optional field
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedinRegex.test(url);
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

    // Add LinkedIn validation
    if (field === 'linkedin_url' && value) {
      if (!validateLinkedInURL(value)) {
        setErrors(prev => ({ ...prev, linkedin_url: 'Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)' }));
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

  // Handle avatar file selection with upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }

    setAvatarUploading(true);
    try {
      // Upload new avatar
      const newAvatarUrl = await AvatarService.uploadAvatar(file, profile.id);
      
      if (newAvatarUrl) {
        // Delete old avatar if it exists
        if (profile.avatar_url) {
          await AvatarService.deleteOldAvatar(profile.avatar_url);
        }

        // Update profile with new avatar URL
        await AvatarService.updateProfileAvatar(profile.id, newAvatarUrl);
        
        // Update global profile state
        await updateProfile({ avatar_url: newAvatarUrl });
        
        // Update local state
        setAvatarFile(file);
        setAvatarPreview(newAvatarUrl);
        
        // Refresh profile data everywhere
        await refreshProfile();
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle banner file selection with upload
  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    setBannerUploading(true);
    try {
      // Upload new banner
      const newBannerUrl = await BannerService.uploadBanner(file, profile.id);
      
      if (newBannerUrl) {
        // Delete old banner if it exists
        if (profile.banner_url) {
          await BannerService.deleteOldBanner(profile.banner_url);
        }

        // Update profile with new banner URL
        await BannerService.updateProfileBanner(profile.id, newBannerUrl);
        
        // Update global profile state
        await updateProfile({ banner_url: newBannerUrl });
        
        // Update local state
        setBannerFile(file);
        setBannerPreview(newBannerUrl);
        
        // Refresh profile data everywhere
        await refreshProfile();
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert('Failed to upload banner. Please try again.');
    } finally {
      setBannerUploading(false);
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
    if (formData.linkedin_url && !validateLinkedInURL(formData.linkedin_url)) {
      newErrors.linkedin_url = 'Please enter a valid LinkedIn URL';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Update profile data - only include fields that exist in profiles table
      const profileUpdates: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        bio: formData.bio || null,
        phone: formData.phone || null,
        location: formData.location || null,
        grad_year: formData.grad_year ? parseInt(formData.grad_year) : null,
        major: formData.major || null,
        minor: formData.minor || null,
        hometown: formData.hometown || null,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        linkedin_url: formData.linkedin_url || null
      };

      // Remove undefined values to avoid overwriting with null
      Object.keys(profileUpdates).forEach(key => {
        if (profileUpdates[key] === undefined) {
          delete profileUpdates[key];
        }
      });

      console.log('🚀 Updating profile with:', profileUpdates);
      await onUpdate(profileUpdates);

      // If user is alumni, also update alumni table
      if (profile?.role === 'alumni') {
        console.log('🎓 Updating alumni data...');
        // Update alumni-specific data
        const updateAlumniData = async () => {
          if (!profile?.id || profile.role !== 'alumni') return;

          try {
            const alumniUpdates = {
              first_name: formData.first_name || null,
              last_name: formData.last_name || null,
              full_name: `${formData.first_name} ${formData.last_name}`,
              email: formData.email || null,
              chapter: profile.chapter, // Include chapter from profile to satisfy not-null constraint
              graduation_year: formData.grad_year ? parseInt(formData.grad_year) : null, // Include graduation_year to satisfy not-null constraint
              industry: formData.industry || null,
              company: formData.company || null,
              job_title: formData.job_title || null,
              phone: formData.phone || null,
              location: formData.location || null,
              description: formData.bio || null, // Use bio from main profile instead of separate description
              is_actively_hiring: formData.is_actively_hiring || false,
              tags: formData.tags && typeof formData.tags === 'string' 
                ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                : null
            };

            console.log('🎓 Alumni updates:', alumniUpdates);

            const { data, error } = await supabase
              .from('alumni')
              .upsert({
                user_id: profile.id,
                ...alumniUpdates
              }, {
                onConflict: 'user_id'
              })
              .select();

            if (error) {
              console.error('❌ Error updating alumni data:', error);
              throw error;
            }

            console.log('✅ Alumni data updated successfully:', data);
          } catch (error) {
            console.error('❌ Error updating alumni data:', error);
            throw error;
          }
        };
        await updateAlumniData();
      }
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
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col ${
        variant === 'mobile' ? 'max-h-[70vh]' : 'max-h-[90vh]'
      }`}>
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
                {/* Banner Section - Make it clickable */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-navy-600 via-blue-600 to-navy-700 flex items-center justify-center text-white cursor-pointer group rounded-lg"
                  onClick={() => document.getElementById('banner-upload')?.click()}
                >
                  {/* Show actual banner if it exists */}
                  {bannerPreview || profile?.banner_url ? (
                    <img 
                      src={bannerPreview || profile.banner_url} 
                      alt="Profile banner" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : null}
                  
                  {/* Banner Upload Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg pt-8">
                    <div className="text-center">
                      {bannerUploading ? (
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      ) : (
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                      )}
                      <p className="text-lg font-medium">
                        {bannerUploading ? 'Uploading...' : 'Upload Banner'}
                      </p>
                      <p className="text-sm">
                        {bannerUploading ? 'Please wait...' : 'Click to upload banner image'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Default banner text (only show if no banner exists) */}
                  {!bannerPreview && !profile?.banner_url && (
                    <div className="text-center opacity-80 group-hover:opacity-0 transition-opacity">
                      <p className="text-lg font-medium">Banner Image</p>
                      <p className="text-sm">Click to upload your banner</p>
                    </div>
                  )}
                </div>

                {/* Profile Photo Section - Positioned at bottom-left */}
                <div className="absolute bottom-4 left-4 z-10">
                  {/* Avatar Container */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                      {avatarPreview || profile?.avatar_url ? (
                        <img 
                          src={avatarPreview || profile.avatar_url} 
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
                      {avatarUploading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Image className="w-4 h-4 text-white" />
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handleAvatarChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={avatarUploading}
                      />
                    </div>
                  </div>
                </div>

                {/* Hidden banner upload input */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                  id="banner-upload"
                  disabled={bannerUploading}
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
                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Required</Badge>
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
                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Required</Badge>
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

                {/* Email and Graduation Year in same row for alumni */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Required</Badge>
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
                  
                  {/* Graduation year for alumni only */}
                  {profile?.role === 'alumni' && (
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
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alumni-Specific Fields - Only show for alumni users, moved right after Personal Information */}
            {profile?.role === 'alumni' && (
              <>
                {/* Professional Information - Moved up for alumni */}
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-lg text-navy-600 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Professional Information
                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Alumni</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          value={formData.industry}
                          onChange={(e) => handleInputChange('industry', e.target.value)}
                          className="mt-1"
                          placeholder="Technology, Finance, Healthcare..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          className="mt-1"
                          placeholder="Google, Microsoft, Amazon..."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="job_title">Job Title</Label>
                        <Input
                          id="job_title"
                          value={formData.job_title}
                          onChange={(e) => handleInputChange('job_title', e.target.value)}
                          className="mt-1"
                          placeholder="Software Engineer..."
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-6">
                        <Checkbox
                          id="is_actively_hiring"
                          checked={formData.is_actively_hiring}
                          onCheckedChange={(checked) => 
                            setFormData(prev => ({ ...prev, is_actively_hiring: checked as boolean }))
                          }
                        />
                        <Label htmlFor="is_actively_hiring" className="text-sm">
                          Actively hiring
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social & Additional Info */}
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-lg text-navy-600 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      Additional Information
                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Optional</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        className="mt-1"
                        placeholder="mentor, startup, consulting, remote work..."
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

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
                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Required</Badge>
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
                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Required</Badge>
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

            {/* Academic Information - Only show for non-alumni users */}
            {profile?.role !== 'alumni' && (
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
            )}

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
                    <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Optional</Badge>
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
                
                {/* Add LinkedIn field here for all users */}
                <div>
                  <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn URL
                    <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Optional</Badge>
                  </Label>
                  <Input
                    id="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                    className={`mt-1 ${errors.linkedin_url ? 'border-red-500 focus:border-red-500' : ''}`}
                    placeholder="https://linkedin.com/in/yourprofile"
                    type="url"
                  />
                  {errors.linkedin_url && (
                    <p className="text-xs text-red-500 mt-1">{errors.linkedin_url}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Optional</Badge>
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

            {/* Remove the old alumni-specific sections that were at the bottom */}
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
