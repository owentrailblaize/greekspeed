'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, Users, Shield, Loader2, Link, Briefcase, GraduationCap, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Invitation, AlumniJoinFormData } from '@/types/invitations';
import { toast } from 'react-toastify';
import { supabase } from '@/lib/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { industries } from '@/lib/alumniConstants';

interface AlumniJoinFormProps {
  invitation: Invitation;
  onSuccess: (userData: any) => void;
  onCancel: () => void;
}

export function AlumniJoinForm({ invitation, onSuccess, onCancel }: AlumniJoinFormProps) {
  const [formData, setFormData] = useState<AlumniJoinFormData>({
    email: '',
    password: '',
    full_name: '',
    first_name: '',
    last_name: '',
    phone: '',
    sms_consent: false,
    // Alumni-specific fields
    industry: '',
    company: '',
    job_title: '',
    graduation_year: new Date().getFullYear(),
    location: '',
    linkedin_url: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    // Alumni-specific validations
    if (!formData.industry.trim()) {
      newErrors.industry = 'Industry is required';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    }

    if (!formData.job_title.trim()) {
      newErrors.job_title = 'Job title is required';
    }

    if (!formData.graduation_year || formData.graduation_year < 1970 || formData.graduation_year > currentYear) {
      newErrors.graduation_year = 'Please select a valid graduation year';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    // LinkedIn URL validation (optional but if provided should be valid)
    if (formData.linkedin_url && !formData.linkedin_url.includes('linkedin.com')) {
      newErrors.linkedin_url = 'Please enter a valid LinkedIn URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting alumni form payload', formData);
      const response = await fetch(`/api/alumni-invitations/accept/${invitation.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create alumni account');
      }

      const data = await response.json();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      
      if (signInError) {
        throw new Error(signInError.message || 'Failed to sign in after creating account');
      }
      
      toast.success('Alumni account created successfully!');
      onSuccess(data.user);
    } catch (error) {
      console.error('Error creating alumni account:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create alumni account';
      toast.error(errorMessage);
      
      // Show specific error for email already used
      if (errorMessage.includes('already been used')) {
        setErrors({ email: 'This email has already been used with this invitation' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AlumniJoinFormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-populate first and last name from full name
    if (field === 'full_name' && typeof value === 'string') {
      const nameParts = value.trim().split(' ');
      setFormData(prev => ({
        ...prev,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || ''
      }));
    }
  };

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    const limitedPhone = phoneNumber.slice(0, 10);
    
    if (limitedPhone.length === 0) return '';
    if (limitedPhone.length < 4) return `(${limitedPhone}`;
    if (limitedPhone.length < 7) {
      return `(${limitedPhone.slice(0, 3)}) ${limitedPhone.slice(3)}`;
    }
    return `(${limitedPhone.slice(0, 3)}) ${limitedPhone.slice(3, 6)}-${limitedPhone.slice(6)}`;
  };
  
  const isValidPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-2 md:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg md:text-xl flex items-center space-x-2">
                <span>Create Alumni Account</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-1 md:pt-2">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-900 flex items-center space-x-2">
                  <span>Personal Information</span>
                </h3>

                {/* Full Name */}
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="full_name" className="text-sm">Full Name *</Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    className={`h-8 md:h-9 ${errors.full_name ? 'border-red-500' : ''}`}
                  />
                  {errors.full_name && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.full_name}</span>
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="email" className="text-sm">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email address"
                    className={`h-8 md:h-9 ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="phone" className="text-sm">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      handleInputChange('phone', formatted);
                    }}
                    placeholder="(555) 123-4567"
                    className="h-8 md:h-9"
                  />
                  <p className="text-xs text-gray-500">
                    Used for SMS notifications about chapter updates and events
                  </p>
                  {formData.phone && !isValidPhoneNumber(formData.phone) && (
                    <p className="text-xs text-red-500">
                      Please enter a complete 10-digit phone number
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="password" className="text-sm">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Create a password"
                      className={`h-8 md:h-9 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Password must be at least 6 characters long
                  </p>
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-900 flex items-center space-x-2">
                  <span>Professional Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Industry */}
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="industry" className="text-sm">Industry *</Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) => handleInputChange('industry', value)}
                      placeholder="Select your industry"
                    >
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </Select>
                    {errors.industry && (
                      <p className="text-xs text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.industry}</span>
                      </p>
                    )}
                  </div>

                  {/* Company */}
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="company" className="text-sm">Company *</Label>
                    <Input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Enter your company name"
                      className={`h-8 md:h-9 ${errors.company ? 'border-red-500' : ''}`}
                    />
                    {errors.company && (
                      <p className="text-xs text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.company}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Job Title */}
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="job_title" className="text-sm">Job Title *</Label>
                    <Input
                      id="job_title"
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      placeholder="Enter your job title"
                      className={`h-8 md:h-9 ${errors.job_title ? 'border-red-500' : ''}`}
                    />
                    {errors.job_title && (
                      <p className="text-xs text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.job_title}</span>
                      </p>
                    )}
                  </div>

                  {/* Graduation Year */}
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="graduation_year" className="text-sm">Graduation Year *</Label>
                    <Select
                      value={formData.graduation_year.toString()}
                      onValueChange={(value) => handleInputChange('graduation_year', parseInt(value))}
                      placeholder="Select graduation year"
                    >
                      {graduationYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </Select>
                    {errors.graduation_year && (
                      <p className="text-xs text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.graduation_year}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="location" className="text-sm">Location *</Label>
                  <Input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="City, State or Remote"
                    className={`h-8 md:h-9 ${errors.location ? 'border-red-500' : ''}`}
                  />
                  {errors.location && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.location}</span>
                    </p>
                  )}
                </div>

                {/* LinkedIn URL */}
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="linkedin_url" className="text-sm">LinkedIn Profile (Optional)</Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    value={formData.linkedin_url || ''}
                    onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/yourname"
                    className={`h-8 md:h-9 ${errors.linkedin_url ? 'border-red-500' : ''}`}
                  />
                  {errors.linkedin_url && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.linkedin_url}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* SMS Consent Checkbox - More Compact */}
              <div className="space-y-0.5">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="sms-consent"
                    checked={formData.sms_consent || false}
                    onCheckedChange={(checked) => handleInputChange('sms_consent', checked === true)}
                    className="mt-0.5"
                    disabled={loading}
                  />
                  <Label
                    htmlFor="sms-consent"
                    className="text-xs leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to receive SMS notifications from Trailblaize, Inc. Message and data rates may apply. Reply STOP to opt out.
                  </Label>
                </div>
              </div>

              {/* Chapter Info */}
              <div className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20 rounded-lg p-1.5 md:p-2">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-2 space-y-1 md:space-y-0">
                  <h4 className="font-medium text-navy-900 text-sm">You're joining as alumni:</h4>
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3 md:h-4 md:w-4 text-navy-600" />
                    <span className="text-navy-800 text-sm">{invitation.chapter_name}</span>
                  </div>
                </div>
              </div>

              {/* Terms and Privacy */}
              <div className="bg-gray-50 rounded-lg p-2 md:p-3">
                <p className="text-xs text-gray-600">
                  By creating an alumni account, you agree to join {invitation.chapter_name} as an alumni member and abide by the chapter's rules and policies.
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="rounded-full w-full bg-blue-600 hover:bg-blue-700 h-8 md:h-9"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Alumni Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Back to invitation details
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
