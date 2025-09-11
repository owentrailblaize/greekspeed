'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, User, Building2, GraduationCap, MapPin, Briefcase } from 'lucide-react';
import { useChapters } from '@/lib/hooks/useChapters';

// User roles for the dropdown
const userRoles = [
  { value: 'admin', label: 'Admin / Executive' },
  { value: 'active_member', label: 'Active Member' },
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
      console.log('🔍 OAuth user metadata:', user.user_metadata); // Debug log
      
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl shadow-xl border-0">
        <CardContent className="p-0">
          <div className="flex min-h-[500px]">
            {/* Left Column - Introduction - Hidden on mobile */}
            <div className="hidden lg:block w-full lg:w-1/2 bg-gradient-to-br from-navy-50 to-blue-50 p-8 flex flex-col justify-center">
              <div className="text-center lg:text-left">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  Complete Your Profile
                </h1>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Let's get to know you better to personalize your Trailblaize experience
                </p>
                
                {/* Network Visualization - Smaller */}
                <div className="relative w-48 h-48 mx-auto lg:mx-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-navy-200 to-blue-200 rounded-full opacity-20"></div>
                  <div className="absolute inset-4 bg-gradient-to-br from-navy-300 to-blue-300 rounded-full opacity-30"></div>
                  <div className="absolute inset-8 bg-gradient-to-br from-navy-400 to-blue-400 rounded-full opacity-40"></div>
                  
                  {/* Network Nodes */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full border-2 border-navy-500 shadow-lg"></div>
                  <div className="absolute top-12 left-8 w-6 h-6 bg-white rounded-full border-2 border-navy-400 shadow-md"></div>
                  <div className="absolute top-16 right-12 w-7 h-7 bg-white rounded-full border-2 border-navy-500 shadow-md"></div>
                  <div className="absolute bottom-20 left-16 w-5 h-5 bg-white rounded-full border-2 border-navy-400 shadow-md"></div>
                  <div className="absolute bottom-8 right-8 w-6 h-6 bg-white rounded-full border-2 border-navy-500 shadow-md"></div>
                  
                  {/* Connection Lines */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 256 256">
                    <line x1="128" y1="32" x2="96" y2="96" stroke="#1e40af" strokeWidth="2" opacity="0.3"/>
                    <line x1="128" y1="32" x2="160" y2="128" stroke="#1e40af" strokeWidth="2" opacity="0.3"/>
                    <line x1="96" y1="96" x2="64" y2="160" stroke="#1e40af" strokeWidth="2" opacity="0.3"/>
                    <line x1="160" y1="128" x2="192" y2="160" stroke="#1e40af" strokeWidth="2" opacity="0.3"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Right Column - Profile Form */}
            <div className="w-full lg:w-1/2 p-6 lg:p-8 flex flex-col justify-center min-h-screen lg:min-h-0">
              <div className="w-full max-w-md mx-auto">
                {/* Mobile Header - Only show on mobile */}
                <div className="lg:hidden text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
                  <p className="text-sm text-gray-600">Let's get to know you better</p>
                </div>

                {/* Desktop Header - Only show on desktop */}
                <div className="hidden lg:block text-center">
                  {/* Logo - Centered */}
                  <div className="flex items-center justify-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-navy-600 rounded-lg flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-xl text-gray-900">Trailblaize</span>
                  </div>

                  {/* Heading - Centered */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Profile</h2>
                </div>

                {/* Form - Left-aligned for better form UX */}
                <div className="text-left">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                          disabled={loading}
                          className="h-11 border-gray-300 focus:border-navy-500 focus:ring-navy-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          required
                          disabled={loading}
                          className="h-11 border-gray-300 focus:border-navy-500 focus:ring-navy-500"
                        />
                      </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        disabled={loading}
                        className="h-11 border-gray-300 focus:border-navy-500 focus:ring-navy-500"
                      />
                    </div>

                    {/* Chapter Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="chapter" className="text-sm font-medium text-gray-700">Chapter</Label>
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

                    {/* Role Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role</Label>
                      <Select 
                        value={formData.role} 
                        onValueChange={(value: string) => setFormData(prev => ({ ...prev, role: value as 'Admin / Executive' | 'Active Member' | 'Alumni' }))}
                      >
                        <SelectItem value="">Select your role</SelectItem>
                        {userRoles.map((userRole) => (
                          <SelectItem key={userRole.value} value={userRole.value}>
                            {userRole.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    {/* Error Messages */}
                    {error && (
                      <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full h-12 bg-navy-600 hover:bg-navy-700 text-white font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Completing Profile...
                        </div>
                      ) : (
                        'Complete Profile'
                      )}
                    </Button>
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


