'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Star, Mail, Info, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useChapters } from '@/lib/hooks/useChapters';
import { Chapter } from '@/types/chapter';

// User roles for the dropdown - Only Alumni allowed for public signup
const userRoles = [
  { value: 'alumni', label: 'Alumni' }
];

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [chapter, setChapter] = useState('');
  const [role, setRole] = useState<'Alumni' | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const { signUp, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [oauthLoading, setOauthLoading] = useState(false);
  
  // Use the chapters hook to fetch dynamic data
  const { chapters, loading: chaptersLoading, error: chaptersError } = useChapters();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email || !password || !firstName || !lastName || !chapter || !role) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, {
        fullName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        chapter,
        role
      });
      setSuccess('Account created successfully! Redirecting...');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fix: Use the correct callback URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`, // Use the callback route
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google sign-up error:', error);
        setError('Google sign-up failed. Please try again.');
      }
    } catch (error) {
      console.error('Google sign-up exception:', error);
      setError('Google sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = () => {
    setShowEmailForm(true);
  };

  if (authLoading || oauthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex items-center justify-center p-1 sm:p-2">
      <Card className="w-full max-w-4xl shadow-xl border-0 h-[calc(100vh-16px)] sm:h-[calc(100vh-32px)]">
        <CardContent className="p-0 h-full">
          <div className="flex h-full">
            {/* Left Column - Introduction - Hidden on mobile, centered on desktop */}
            <div className="hidden lg:block w-full lg:w-1/2 bg-gradient-to-br from-navy-50 to-blue-50 p-4 lg:p-6 flex flex-col justify-center items-center">
              <div className="text-center max-w-sm">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  Welcome to Trailblaize
                </h1>
                <p className="text-base text-gray-700 mb-6 leading-relaxed">
                  Rethink the way you connect, manage, and grow your fraternity network
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

            {/* Right Column - Sign Up - Optimized for no scrolling */}
            <div className="w-full lg:w-1/2 p-2 sm:p-3 lg:p-4 flex flex-col justify-center h-full overflow-hidden">
              <div className="w-full max-w-sm mx-auto h-full flex flex-col justify-center">
                {/* Mobile Header - Compact */}
                <div className="lg:hidden text-center mb-3">
                  <h1 className="text-lg font-bold text-gray-900 mb-1">Welcome to Trailblaize</h1>
                  <p className="text-xs text-gray-600">Create your account</p>
                </div>

                {/* Desktop Header - Only "Get started for free" */}
                <div className="hidden lg:block text-center mb-3">
                  <h2 className="text-lg font-bold text-gray-900">Get started for free</h2>
                </div>

                {!showEmailForm ? (
                  /* Social Sign Up Options - Compact */
                  <div className="space-y-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-full h-9 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-left px-3 text-sm"
                      onClick={handleGoogleSignUp}
                      disabled={loading}
                    >
                      <img 
                        src="https://developers.google.com/identity/images/g-logo.png" 
                        alt="Google" 
                        className="w-4 h-4 mr-3"
                      />
                      Continue with Google
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-full h-9 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-left px-3 text-sm"
                      onClick={handleEmailSignUp}
                      disabled={loading}
                    >
                      <Mail className="h-4 w-4 mr-3 text-gray-600" />
                      Continue with Email
                    </Button>
                  </div>
                ) : (
                  /* Email Form - Compact and optimized */
                  <div className="text-left flex-1 flex flex-col min-h-0">
                    {/* Back Button - Compact */}
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(false)}
                      className="flex items-center text-xs text-gray-600 hover:text-gray-800 mb-2 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to sign up options
                    </button>

                    {/* Information Banner - Compact */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                      <div className="flex items-start space-x-2">
                        <Info className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-blue-900 text-xs mb-1">Alumni Signup Only</h3>
                          <p className="text-xs text-blue-800 mb-1">
                            This signup form is for alumni only. Active members must be invited by chapter administrators.
                          </p>
                          <div className="flex items-center space-x-1 text-xs text-blue-700">
                            <Users className="h-3 w-3" />
                            <span>Need to join as an active member? Contact your chapter admin for an invitation.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-1.5 flex-1 flex flex-col min-h-0">
                      <div className="space-y-1.5 flex-1 overflow-y-auto">
                        {/* Name Fields - Compact */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="space-y-1">
                            <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">First Name</Label>
                            <Input
                              id="firstName"
                              type="text"
                              placeholder="First Name"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
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
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="h-7 border-gray-300 focus:border-navy-500 focus:ring-navy-500 text-sm"
                          />
                        </div>

                        {/* Password Field - Compact */}
                        <div className="space-y-1">
                          <Label htmlFor="password" className="text-xs font-medium text-gray-700">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="h-7 border-gray-300 focus:border-navy-500 focus:ring-navy-500 text-sm"
                          />
                        </div>

                        {/* Chapter Selection - Compact */}
                        <div className="space-y-1">
                          <Label htmlFor="chapter" className="text-xs font-medium text-gray-700">Chapter</Label>
                          <Select 
                            value={chapter} 
                            onValueChange={setChapter}
                          >
                            <SelectItem value="">
                              {chaptersLoading ? 'Loading chapters...' : 'Select your chapter'}
                            </SelectItem>
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

                        {/* Role Selection - Compact */}
                        <div className="space-y-1">
                          <Label htmlFor="role" className="text-xs font-medium text-gray-700">Role</Label>
                          <Select 
                            value={role} 
                            onValueChange={(value: string) => setRole(value as 'Alumni')}
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

                        {/* Error and Success Messages - Compact */}
                        {error && (
                          <div className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg p-2">{error}</div>
                        )}
                        {success && (
                          <div className="text-green-500 text-xs bg-green-50 border border-green-200 rounded-lg p-2">{success}</div>
                        )}
                      </div>

                      {/* Submit Button - Fixed at bottom */}
                      <div className="mt-2">
                        <Button 
                          type="submit" 
                          className="w-full h-7 bg-navy-600 hover:bg-navy-700 text-white font-medium text-sm" 
                          disabled={loading}
                        >
                          {loading ? 'Creating account...' : 'Create Alumni Account'}
                        </Button>
                      </div>
                    </form>

                    {/* Terms and Sign In - Fixed at bottom */}
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 text-center mb-1">
                        By proceeding, you agree to our{' '}
                        <Link href="/terms" className="text-navy-600 hover:text-navy-700 underline">
                          Terms of Service
                        </Link>
                      </p>
                      <p className="text-xs text-gray-600 text-center">
                        Already have an account?{' '}
                        <Link href="/sign-in" className="text-navy-600 hover:text-navy-700 font-medium">
                          Sign in
                        </Link>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 