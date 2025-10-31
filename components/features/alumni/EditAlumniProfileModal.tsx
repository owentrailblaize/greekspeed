'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, User, Mail, Building, Briefcase, HelpCircle, Image, Upload, Linkedin, MapPin, Phone, Home, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AvatarService } from '@/lib/services/avatarService';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { BannerService } from '@/lib/services/bannerService';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase/client';
import { trackActivity, ActivityTypes } from '@/lib/utils/activityUtils';
import { logger } from "@/lib/utils/logger";

interface EditAlumniProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onUpdate: (updatedProfile: any) => void;
  variant?: 'desktop' | 'mobile';
}

// Storage key for sessionStorage
const STORAGE_KEY = 'editAlumniProfileFormData';

export function EditAlumniProfileModal({ isOpen, onClose, profile, onUpdate, variant = 'desktop' }: EditAlumniProfileModalProps) {
  // Form state with persistence
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    chapter: '',
    graduation_year: '',
    industry: '',
    company: '',
    job_title: '',
    phone: '',
    location: '',
    description: '',
    is_actively_hiring: false,
    tags: '',
    linkedin_url: '',
    hometown: '',
    is_email_public: true,
    is_phone_public: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);

  // Alumni data state
  const [alumniData, setAlumniData] = useState<any>(null);
  const [loadingAlumni, setLoadingAlumni] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false);

  const { updateProfile, refreshProfile } = useProfile();

  // SessionStorage persistence functions
  const saveFormDataToStorage = useCallback((data: typeof formData) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save form data to sessionStorage:', { context: [error] });
    }
  }, []);

  const loadFormDataFromStorage = useCallback((): typeof formData | null => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      logger.error('Failed to load form data from sessionStorage:', { context: [error] });
      return null;
    }
  }, []);

  const clearFormDataFromStorage = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      logger.error('Failed to clear form data from sessionStorage:', { context: [error] });
    }
  }, []);

  // Load alumni data directly from alumni table
  const loadAlumniData = useCallback(async () => {
    if (!profile?.id) return;
    
    setLoadingAlumni(true);
    try {
      const { data, error } = await supabase
        .from('alumni')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (error) {
        logger.error('Error loading alumni data:', { context: [error] });
        // If no alumni record exists, create one
        await createAlumniRecord();
        return;
      }

      logger.info('✅ Alumni data loaded:', { context: [data] });
      setAlumniData(data);
      
      // Check for saved form data first, then use alumni data
      const savedFormData = loadFormDataFromStorage();
      const initialFormData = savedFormData || {
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        chapter: data.chapter || '',
        graduation_year: data.graduation_year?.toString() || '',
        industry: data.industry || '',
        company: data.company || '',
        job_title: data.job_title || '',
        phone: data.phone || '',
        location: data.location || '',
        description: data.description || '',
        is_actively_hiring: data.is_actively_hiring || false,
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
        linkedin_url: data.linkedin_url || '',
        hometown: data.hometown || '',
        is_email_public: data.is_email_public !== false, // Default to true if not set
        is_phone_public: data.is_phone_public !== false  // Default to true if not set
      };

      setFormData(initialFormData);
      
      // If we loaded saved data, save it again to ensure it's persisted
      if (savedFormData) {
        saveFormDataToStorage(initialFormData);
      }
      
    } catch (error) {
      logger.error('Error loading alumni data:', { context: [error] });
    } finally {
      setLoadingAlumni(false);
      setIsModalReady(true);
    }
  }, [profile?.id, loadFormDataFromStorage, saveFormDataToStorage]);

  // Create alumni record if it doesn't exist
  const createAlumniRecord = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const { error } = await supabase
        .from('alumni')
        .insert({
          user_id: profile.id,
          first_name: profile.first_name || profile.full_name?.split(' ')[0] || '',
          last_name: profile.last_name || profile.full_name?.split(' ')[1] || '',
          full_name: profile.full_name || '',
          email: profile.email || '',
          chapter: profile.chapter || 'Unknown',
          graduation_year: new Date().getFullYear()
        });

      if (error) {
        logger.error('Error creating alumni record:', { context: [error] });
        return;
      }

      logger.info('✅ Alumni record created');
      // Reload data after creation
      await loadAlumniData();
    } catch (error) {
      logger.error('Error creating alumni record:', { context: [error] });
    }
  }, [profile, loadAlumniData]);

  // Initialize form data when modal opens
  useEffect(() => {
    if (profile && isOpen) {
      loadAlumniData();
      
      if (profile.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      }
      if (profile.banner_url) {
        setBannerPreview(profile.banner_url);
      }
    }
  }, [profile, isOpen, loadAlumniData]);

  // Validation functions - same as original
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateLinkedInURL = (url: string): boolean => {
    if (!url) return true;
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedinRegex.test(url);
  };

  const formatPhoneNumber = (value: string): string => {
    const phoneNumber = value.replace(/\D/g, '');
    
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  // Input change handler with persistence
  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Save to sessionStorage on every change
    saveFormDataToStorage(newFormData);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Real-time validation
    if (field === 'email' && value && !validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    }

    if (field === 'linkedin_url' && value && !validateLinkedInURL(value)) {
      setErrors(prev => ({ ...prev, linkedin_url: 'Please enter a valid LinkedIn URL' }));
    }
  };

  // Phone number specific handler with persistence
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    const newFormData = { ...formData, phone: formatted };
    setFormData(newFormData);
    
    // Save to sessionStorage
    saveFormDataToStorage(newFormData);
    
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  // File upload handlers - exact same as original
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
      logger.error('Error uploading avatar:', { context: [error] });
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

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
      logger.error('Error uploading banner:', { context: [error] });
      alert('Failed to upload banner. Please try again.');
    } finally {
      setBannerUploading(false);
    }
  };

  // Submit handler with persistence cleanup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
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
    if (formData.linkedin_url && !validateLinkedInURL(formData.linkedin_url)) {
      newErrors.linkedin_url = 'Please enter a valid LinkedIn URL';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Update alumni table only
      const alumniUpdates = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        full_name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
        email: formData.email.trim(),
        chapter: formData.chapter || 'Unknown',
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : new Date().getFullYear(),
        industry: formData.industry?.trim() || 'Not Specified',
        company: formData.company?.trim() || 'Not Specified', 
        job_title: formData.job_title?.trim() || 'Not Specified',
        phone: formData.phone?.trim() || 'Not Specified',
        location: formData.location?.trim() || 'Not Specified',
        hometown: formData.hometown?.trim() || 'Not Specified',
        description: formData.description?.trim() || null,
        linkedin_url: formData.linkedin_url?.trim() || null,
        is_actively_hiring: formData.is_actively_hiring || false,
        is_email_public: formData.is_email_public !== false,
        is_phone_public: formData.is_phone_public !== false,
        tags: formData.tags && formData.tags.trim() 
          ? formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
          : null
      };

      logger.info('🔄 Updating alumni data:', { context: [alumniUpdates] });

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
        logger.error('❌ Error updating alumni data:', { context: [error] });
        throw error;
      }

      logger.info('✅ Alumni data updated successfully:', { context: [data] });

      // Update basic profile fields for consistency
      const profileUpdates = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        location: formData.location?.trim() || null,
        linkedin_url: formData.linkedin_url?.trim() || null
      };

      await onUpdate(profileUpdates);

      // Track activity
      try {
        await trackActivity(profile.id, ActivityTypes.PROFILE_UPDATE, {
          updatedFields: Object.keys(alumniUpdates),
          timestamp: new Date().toISOString()
        });
      } catch (activityError) {
        logger.error('Failed to track profile update activity:', { context: [activityError] });
      }
      
      // Clear saved form data on successful save
      clearFormDataFromStorage();
      
      // Close modal after successful save
      onClose();
    } catch (error) {
      logger.error('Error updating alumni profile:', { context: [error] });
    } finally {
      setLoading(false);
    }
  };

  // Close handler with persistence cleanup
  const handleClose = () => {
    clearFormDataFromStorage();
    onClose();
  };

  const handleCancel = () => {
    clearFormDataFromStorage();
    onClose();
  };

  // Only render modal when open and ready
  if (!isOpen || !isModalReady) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col ${
        variant === 'mobile' ? 'max-h-[85vh] my-8' : 'max-h-[90vh]'
      }`}>
        {/* Header - same as original */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-navy-900">Edit Profile</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content Area - exact same structure as original */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Combined Profile Photo & Banner Card - exact same as original */}
            <Card className="p-0">
              <CardContent className="relative h-64 p-0 overflow-hidden">
                {/* Banner Section */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-navy-600 via-blue-600 to-navy-700 flex items-center justify-center text-white cursor-pointer group rounded-lg"
                  onClick={() => document.getElementById('banner-upload')?.click()}
                >
                  {bannerPreview || profile?.banner_url ? (
                    <img 
                      src={bannerPreview || profile.banner_url} 
                      alt="Profile banner" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : null}
                  
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
                  
                  {!bannerPreview && !profile?.banner_url && (
                    <div className="text-center opacity-80 group-hover:opacity-0 transition-opacity">
                      <p className="text-lg font-medium">Banner Image</p>
                      <p className="text-sm">Click to upload your banner</p>
                    </div>
                  )}
                </div>

                {/* Profile Photo Section */}
                <div className="absolute bottom-4 left-4 z-10">
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

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                  id="banner-upload"
                  disabled={bannerUploading}
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
                  
                  <div>
                    <Label htmlFor="graduation_year">Graduation Year</Label>
                    <Input
                      id="graduation_year"
                      value={formData.graduation_year}
                      onChange={(e) => handleInputChange('graduation_year', e.target.value)}
                      className="mt-1"
                      placeholder="2024"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information - Alumni-specific */}
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
                
                {/* Privacy Settings */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Privacy Settings</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between border rounded-md p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Show Email</p>
                        <p className="text-xs text-gray-500 mt-1">Other users can see your email if enabled</p>
                      </div>
                      <div className="ml-2">
                        <Checkbox
                          id="is_email_public"
                          checked={formData.is_email_public}
                          onCheckedChange={(checked) => {
                            const newFormData = { ...formData, is_email_public: checked as boolean };
                            setFormData(newFormData);
                            saveFormDataToStorage(newFormData);
                          }}
                          className="h-5 w-5" // Make it slightly larger
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between border rounded-md p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Show Phone</p>
                        <p className="text-xs text-gray-500 mt-1">Other users can see your phone if enabled</p>
                      </div>
                      <div className="ml-2">
                        <Checkbox
                          id="is_phone_public"
                          checked={formData.is_phone_public}
                          onCheckedChange={(checked) => {
                            const newFormData = { ...formData, is_phone_public: checked as boolean };
                            setFormData(newFormData);
                            saveFormDataToStorage(newFormData);
                          }}
                          className="h-5 w-5" // Make it slightly larger
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
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
                <div>
                  <Label htmlFor="description">Bio</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Chapter & Role - Read Only */}
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
                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Read Only</Badge>
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
                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Read Only</Badge>
                    </Label>
                    <Input
                      id="role"
                      value="Alumni"
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Footer - same as original */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 flex-shrink-0">
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
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
    </div>
  );
}
