'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, Users, Shield, Loader2, Link, BookOpen, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Invitation, JoinFormData } from '@/types/invitations';
import { toast } from 'react-toastify';
import { supabase } from '@/lib/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';

interface JoinFormProps {
  invitation: Invitation;
  onSuccess: (userData: any) => void;
  onCancel: () => void;
}

export function JoinForm({ invitation, onSuccess, onCancel }: JoinFormProps) {
  const [formData, setFormData] = useState<JoinFormData>({
    email: '',
    password: '',
    full_name: '',
    first_name: '',
    last_name: '',
    phone: '',
    sms_consent: false,
    graduation_year: new Date().getFullYear() + 4, // Default to 4 years from now
    major: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    // Phone validation - now required
    if (!formData.phone || !formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    // Graduation year validation - required
    if (!formData.graduation_year) {
      newErrors.graduation_year = 'Graduation year is required';
    } else {
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 10; // Allow up to 10 years in the past
      const maxYear = currentYear + 10; // Allow up to 10 years in the future
      if (formData.graduation_year < minYear || formData.graduation_year > maxYear) {
        newErrors.graduation_year = `Graduation year must be between ${minYear} and ${maxYear}`;
      }
    }

    // Major validation - required
    if (!formData.major || !formData.major.trim()) {
      newErrors.major = 'Major is required';
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
      const response = await fetch(`/api/invitations/accept/${invitation.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      const data = await response.json();
      
      // CRITICAL FIX: Ensure client-side session is established
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email.toLowerCase(),
          password: formData.password
        });

        if (signInError) {
          console.error('Client-side sign-in failed:', signInError);
          // Don't fail the entire process, but log the error
        } else {
          // Client-side session established successfully
        }
      } catch (signInError) {
        console.error('Client-side sign-in error:', signInError);
      }

      toast.success('Account created successfully!');
      onSuccess(data.user);
    } catch (error) {
      console.error('Error creating account:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      toast.error(errorMessage);
      
      // Show specific error for email already used
      if (errorMessage.includes('already been used')) {
        setErrors({ email: 'This email has already been used with this invitation' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof JoinFormData, value: string | boolean | number) => {
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
        className="max-w-md w-full"
      >
        <Card>
          <CardHeader className="pb-1 md:pb-2">
            <div className="flex items-center space-x-2 md:space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg md:text-xl">Create Your Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 md:pt-1">
            <form onSubmit={handleSubmit} className="space-y-2 md:space-y-3">
              {/* Full Name */}
              <div className="space-y-0.5 md:space-y-1">
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
                  <p className="text-xs text-red-600 flex items-center space-x-1 mt-0.5">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.full_name}</span>
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-0.5 md:space-y-1">
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
                  <p className="text-xs text-red-600 flex items-center space-x-1 mt-0.5">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Phone Number & Graduation Year - Same Row on Desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {/* Phone Number */}
                <div className="space-y-0.5 md:space-y-1">
                  <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      handleInputChange('phone', formatted);
                    }}
                    placeholder="(555) 123-4567"
                    className={`h-8 md:h-9 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 flex items-center space-x-1 mt-0.5">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                  {!errors.phone && (
                    <p className="text-xs text-gray-500 mt-0.5 hidden md:block">
                      SMS notifications
                    </p>
                  )}
                </div>

                {/* Graduation Year */}
                <div className="space-y-0.5 md:space-y-1">
                  <Label htmlFor="graduation_year" className="text-sm flex items-center space-x-1">
                    <GraduationCap className="h-3 w-3" />
                    <span>Graduation Year *</span>
                  </Label>
                  <Input
                    id="graduation_year"
                    type="number"
                    value={formData.graduation_year || ''}
                    onChange={(e) => {
                      const year = parseInt(e.target.value);
                      if (!isNaN(year)) {
                        handleInputChange('graduation_year', year);
                      } else if (e.target.value === '') {
                        handleInputChange('graduation_year', new Date().getFullYear() + 4);
                      }
                    }}
                    placeholder="2028"
                    min={new Date().getFullYear() - 10}
                    max={new Date().getFullYear() + 10}
                    className={`h-8 md:h-9 ${errors.graduation_year ? 'border-red-500' : ''}`}
                  />
                  {errors.graduation_year && (
                    <p className="text-xs text-red-600 flex items-center space-x-1 mt-0.5">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.graduation_year}</span>
                    </p>
                  )}
                </div>
              </div>
              
              {/* Phone helper text for mobile only */}
              {!errors.phone && (
                <p className="text-xs text-gray-500 md:hidden -mt-1">
                  Used for SMS notifications about chapter updates and events
                </p>
              )}

              {/* Major(s) */}
              <div className="space-y-0.5 md:space-y-1">
                <Label htmlFor="major" className="text-sm flex items-center space-x-1">
                  <BookOpen className="h-3 w-3" />
                  <span>Major(s) *</span>
                </Label>
                <Input
                  id="major"
                  type="text"
                  value={formData.major || ''}
                  onChange={(e) => handleInputChange('major', e.target.value)}
                  placeholder="e.g., Computer Science or Computer Science, Mathematics"
                  className={`h-8 md:h-9 ${errors.major ? 'border-red-500' : ''}`}
                />
                {errors.major && (
                  <p className="text-xs text-red-600 flex items-center space-x-1 mt-0.5">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.major}</span>
                  </p>
                )}
                {!errors.major && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Separate multiple majors with commas
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-0.5 md:space-y-1">
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
                  <p className="text-xs text-red-600 flex items-center space-x-1 mt-0.5">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.password}</span>
                  </p>
                )}
                {!errors.password && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Minimum 6 characters
                  </p>
                )}
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
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-navy-900 text-sm">You're joining:</h4>
                  <Users className="h-3 w-3 md:h-4 md:w-4 text-navy-600" />
                  <span className="text-navy-800 text-sm">{invitation.chapter_name}</span>
                </div>
              </div>

              {/* Terms and Privacy - More Compact */}
              <div className="bg-gray-50 rounded-lg p-1.5 md:p-2">
                <p className="text-xs text-gray-600 leading-tight">
                  By creating an account, you agree to join {invitation.chapter_name} and abide by the chapter's rules and policies.
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
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account & Join Chapter'
                )}
              </Button>

              <div className="text-center pt-1">
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