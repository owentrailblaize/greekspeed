'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectItem } from '@/components/ui/select';
import {  Info, Users } from 'lucide-react';
import { useChapters } from '@/lib/hooks/useChapters';

// User roles for the dropdown - Only Alumni allowed for public signup
const userRoles = [
  { value: 'alumni', label: 'Alumni' }
];

export default function ProfileCompletePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    chapter: '',
    role: ''
  });

  // Use the chapters hook to fetch dynamic data
  const { chapters, loading: chaptersLoading, error: chaptersError } = useChapters();

  // Pre-populate form with OAuth data
  useEffect(() => {
    if (user?.user_metadata) {
      // OAuth user metadata
      
      setFormData(prev => ({
        ...prev,
        firstName: user.user_metadata.given_name || user.user_metadata.first_name || user.user_metadata.name?.split(' ')[0] || '',
        lastName: user.user_metadata.family_name || user.user_metadata.last_name || user.user_metadata.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Update the existing profile with complete information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          chapter: formData.chapter,
          role: formData.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Redirect to dashboard after successful profile completion
      router.push('/dashboard');
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-1 sm:p-2">
      <Card className="w-full max-w-4xl shadow-xl border-0">
        <CardContent className="p-0">
          <div className="flex min-h-[500px]">
            {/* Left Column - Introduction - Hidden on mobile, centered on desktop */}
            <div className="hidden lg:block w-full lg:w-1/2 bg-gradient-to-br from-navy-50 to-blue-50 p-4 lg:p-6 flex flex-col justify-center items-center">
              <div className="text-center max-w-sm">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  Complete Your Profile
                </h1>
                <p className="text-base text-gray-700 mb-6 leading-relaxed">
                  Let's get to know you better to personalize your Trailblaize experience
                </p>
                
                {/* Network Visualization - Centered */}
                <div className="relative w-40 h-40 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-navy-200 to-blue-200 rounded-full opacity-20"></div>
                  <div className="absolute inset-4 bg-gradient-to-br from-navy-300 to-blue-300 rounded-full opacity-30"></div>
                  <div className="absolute inset-8 bg-gradient-to-br from-navy-400 to-blue-400 rounded-full opacity-40"></div>
                  
                  {/* Network Nodes - Restored size */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full border-2 border-navy-500 shadow-lg"></div>
                  <div className="absolute top-12 left-8 w-6 h-6 bg-white rounded-full border-2 border-navy-400 shadow-md"></div>
                  <div className="absolute top-16 right-12 w-7 h-7 bg-white rounded-full border-2 border-navy-500 shadow-md"></div>
                  <div className="absolute bottom-20 left-16 w-5 h-5 bg-white rounded-full border-2 border-navy-400 shadow-md"></div>
                  <div className="absolute bottom-8 right-8 w-6 h-6 bg-white rounded-full border-2 border-navy-500 shadow-md"></div>
                  
                  {/* Connection Lines */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 160">
                    <line x1="80" y1="32" x2="64" y2="96" stroke="#1e40af" strokeWidth="2" opacity="0.3"/>
                    <line x1="80" y1="32" x2="96" y2="128" stroke="#1e40af" strokeWidth="2" opacity="0.3"/>
                    <line x1="64" y1="96" x2="48" y2="128" stroke="#1e40af" strokeWidth="2" opacity="0.3"/>
                    <line x1="96" y1="128" x2="128" y2="128" stroke="#1e40af" strokeWidth="2" opacity="0.3"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Right Column - Profile Form - Dynamic height */}
            <div className="w-full lg:w-1/2 p-2 sm:p-3 lg:p-4 flex flex-col justify-center">
              <div className="w-full max-w-sm mx-auto">
                {/* Mobile Header - Compact */}
                <div className="lg:hidden text-center mb-3">
                  <h1 className="text-lg font-bold text-gray-900 mb-1">Complete Your Profile</h1>
                  <p className="text-xs text-gray-600">Let's get to know you better</p>
                </div>

                {/* Desktop Header - Only "Complete Your Profile" */}
                <div className="hidden lg:block text-center mb-3">
                  <h2 className="text-lg font-bold text-gray-900">Complete Your Profile</h2>
                </div>

                {/* Information Banner - Compact */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                  <div className="flex items-start space-x-2">
                    <Info className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-blue-900 text-xs mb-1">Alumni Profile Only</h3>
                      <p className="text-xs text-blue-800 mb-1">
                        This profile completion is for alumni only. Active members must be invited by chapter administrators.
                      </p>
                      <div className="flex items-center space-x-1 text-xs text-blue-700">
                        <Users className="h-3 w-3" />
                        <span>Need to join as an active member? Contact your chapter admin for an invitation.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form - Compact and optimized */}
                <div className="text-left">
                  <form onSubmit={handleSubmit} className="space-y-1.5">
                    {/* Name Fields - Compact */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-1">
                        <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                          disabled={loading}
                          className="h-7 border-gray-300 focus:border-navy-500 focus:ring-navy-500 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          required
                          disabled={loading}
                          className="h-7 border-gray-300 focus:border-navy-500 focus:ring-navy-500 text-sm"
                        />
                      </div>
                    </div>

                    {/* Email Field - Compact */}
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs font-medium text-gray-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        disabled={loading}
                        className="h-7 border-gray-300 focus:border-navy-500 focus:ring-navy-500 text-sm"
                      />
                    </div>

                    {/* Chapter Selection - Compact */}
                    <div className="space-y-1">
                      <Label htmlFor="chapter" className="text-xs font-medium text-gray-700">Chapter</Label>
                      <Select 
                        value={formData.chapter} 
                        onValueChange={(value: string) => setFormData(prev => ({ ...prev, chapter: value }))}
                      >
                        <SelectItem value="">{chaptersLoading ? 'Loading chapters...' : 'Select your chapter'}</SelectItem>
                        {chapters.map((chapterData) => (
                          <SelectItem key={chapterData.id} value={chapterData.name}>
                            {chapterData.name}
                          </SelectItem>
                        ))}
                      </Select>
                      {chaptersError && (
                        <p className="text-red-500 text-xs">Failed to load chapters. Please refresh the page.</p>
                      )}
                      {chapters.length === 0 && !chaptersLoading && (
                        <p className="text-yellow-500 text-xs">No chapters available. Please contact support.</p>
                      )}
                    </div>

                    {/* Role Selection - Compact - Only Alumni */}
                    <div className="space-y-1">
                      <Label htmlFor="role" className="text-xs font-medium text-gray-700">Role</Label>
                      <Select 
                        value={formData.role} 
                        onValueChange={(value: string) => setFormData(prev => ({ ...prev, role: value as 'Alumni' }))}
                      >
                        <SelectItem value="">Select your role</SelectItem>
                        {userRoles.map((userRole) => (
                          <SelectItem key={userRole.value} value={userRole.value}>
                            {userRole.label}
                          </SelectItem>
                        ))}
                      </Select>
                      <p className="text-xs text-gray-500">
                        Alumni accounts can access the alumni network and connect with other graduates.
                      </p>
                    </div>

                    {/* Error Messages - Compact */}
                    {error && (
                      <div className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg p-2">{error}</div>
                    )}

                    {/* Submit Button - Reduced spacing */}
                    <div className="mt-1">
                      <Button
                        type="submit"
                        className="w-full h-7 bg-navy-600 hover:bg-navy-700 text-white font-medium text-sm"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Completing Profile...
                          </div>
                        ) : (
                          'Complete Profile'
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


