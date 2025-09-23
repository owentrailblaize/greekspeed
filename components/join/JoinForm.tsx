'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, Users, Shield, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Invitation, JoinFormData } from '@/types/invitations';
import { toast } from 'react-toastify';
import { supabase } from '@/lib/supabase/client';

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
    last_name: ''
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

    // No email domain restrictions - all domains are allowed

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

  const handleInputChange = (field: keyof JoinFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-populate first and last name from full name
    if (field === 'full_name') {
      const nameParts = value.trim().split(' ');
      setFormData(prev => ({
        ...prev,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-2 md:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
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
              <CardTitle className="text-lg md:text-xl">Create Your Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-1 md:pt-2">
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
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

              {/* Chapter Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 md:p-3 space-y-1 md:space-y-2">
                <h4 className="font-medium text-purple-900 text-sm">You're joining:</h4>
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                  <span className="text-purple-800 text-sm">{invitation.chapter_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                  <span className="text-purple-800 text-sm">
                    Auto-approved
                  </span>
                </div>
              </div>

              {/* Terms and Privacy */}
              <div className="bg-gray-50 rounded-lg p-2 md:p-3">
                <p className="text-xs text-gray-600">
                  By creating an account, you agree to join {invitation.chapter_name} and abide by the chapter's rules and policies.
                  Your account will be created with the role of "Active Member" and appropriate status based on the invitation settings.
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 h-8 md:h-9"
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
