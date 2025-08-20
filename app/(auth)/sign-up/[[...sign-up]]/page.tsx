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
import { Star, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useChapters } from '@/lib/hooks/useChapters';
import { Chapter } from '@/types/chapter';

// User roles for the dropdown
const userRoles = [
  { value: 'admin', label: 'Admin / Executive' },
  { value: 'active_member', label: 'Active Member' },
  { value: 'alumni', label: 'Alumni' }
];

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [chapter, setChapter] = useState('');
  const [role, setRole] = useState<'Admin / Executive' | 'Active Member' | 'Alumni' | ''>('');
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

  // Remove this useEffect - it's not needed here
  // useEffect(() => {
  //   const handleOAuthCallback = async () => {
  //     // Check if we're returning from OAuth (hash contains access_token or error)
  //     if (typeof window !== 'undefined' && window.location.hash) {
  //       const hashParams = new URLSearchParams(window.location.hash.substring(1));
  //       const accessToken = hashParams.get('access_token');
  //       const error = hashParams.get('error');
        
  //       if (error) {
  //         setError(`OAuth error: ${error}`);
  //         return;
  //       }
        
  //       if (accessToken) {
  //         setOauthLoading(true);
  //         try {
  //           // Set the session with the access token
  //           const { data, error: sessionError } = await supabase.auth.setSession({
  //             access_token: accessToken,
  //             refresh_token: hashParams.get('refresh_token') || '',
  //           });
            
  //           if (sessionError) {
  //             setError('Failed to complete authentication');
  //             return;
  //           }
            
  //           if (data.user) {
  //             // Check if profile exists, create if not
  //             const { data: existingProfile } = await supabase
  //               .from('profiles')
  //               .select('*')
  //               .eq('id', data.user.id)
  //               .single();

  //             if (!existingProfile) {
  //               await supabase
  //                 .from('profiles')
  //                 .insert({
  //                   id: data.user.id,
  //                   email: data.user.email,
  //                   full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Google User',
  //                   first_name: data.user.user_metadata?.given_name || '',
  //                   last_name: data.user.user_metadata?.family_name || '',
  //                   chapter: null,
  //                   role: 'alumni'
  //                 });
  //             }
              
  //             // Redirect to dashboard
  //             router.push('/dashboard');
  //           }
  //         } catch (error) {
  //           setError('Authentication failed');
  //         } finally {
  //           setOauthLoading(false);
  //         }
  //       }
  //     }
  //   };

  //   handleOAuthCallback();
  // }, [router]);

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
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <Card className="w-full max-w-6xl shadow-xl border-0">
        <CardContent className="p-0">
          <div className="flex min-h-[600px]">
            {/* Left Column - Introduction */}
            <div className="w-full lg:w-1/2 bg-gradient-to-br from-navy-50 to-blue-50 p-12 flex flex-col justify-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  Welcome to Trailblaize
                </h1>
                <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                  Rethink the way you connect, manage, and grow your fraternity network
                </p>
                
                {/* Network Visualization */}
                <div className="relative w-64 h-64 mx-auto lg:mx-0">
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

            {/* Right Column - Sign Up */}
            <div className="w-full lg:w-1/2 p-12 flex flex-col justify-center text-center">
              {/* Logo - Centered */}
              <div className="flex items-center justify-center space-x-3 mb-8">
                <div className="w-8 h-8 bg-navy-600 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-xl text-gray-900">Trailblaize</span>
              </div>

              {/* Heading - Centered */}
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Get started for free</h2>

              {!showEmailForm ? (
                /* Social Sign Up Options - Centered */
                <div className="space-y-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-left px-4"
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                  >
                    <div className="w-5 h-5 bg-red-500 rounded-full mr-4 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">G</span>
                    </div>
                    Continue with Google
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-left px-4"
                    onClick={handleEmailSignUp}
                    disabled={loading}
                  >
                    <Mail className="h-5 w-5 mr-4 text-gray-600" />
                    Continue with Email
                  </Button>
                </div>
              ) : (
                /* Email Form - Left-aligned for better form UX */
                <div className="text-left">
                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-800 mb-6 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to sign up options
                  </button>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="First Name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
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
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="h-11 border-gray-300 focus:border-navy-500 focus:ring-navy-500"
                      />
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="h-11 border-gray-300 focus:border-navy-500 focus:ring-navy-500"
                      />
                    </div>

                    {/* Chapter Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="chapter" className="text-sm font-medium text-gray-700">Chapter</Label>
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

                    {/* Role Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role</Label>
                      <Select 
                        value={role} 
                        onValueChange={(value: string) => setRole(value as 'Admin / Executive' | 'Active Member' | 'Alumni')}
                      >
                        <SelectItem value="">Select your role</SelectItem>
                        {userRoles.map((userRole) => (
                          <SelectItem key={userRole.value} value={userRole.value}>
                            {userRole.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    {/* Error and Success Messages */}
                    {error && (
                      <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
                    )}
                    {success && (
                      <div className="text-green-500 text-sm bg-green-50 border border-green-200 rounded-lg p-3">{success}</div>
                    )}

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-navy-600 hover:bg-navy-700 text-white font-medium" 
                      disabled={loading}
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </div>
              )}

              {/* Terms */}
              <p className="text-sm text-gray-500 mt-6">
                By proceeding, you agree to our{' '}
                <Link href="/terms" className="text-navy-600 hover:text-navy-700 underline">
                  Terms of Service
                </Link>
              </p>

              {/* Sign In Link */}
              <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/sign-in" className="text-navy-600 hover:text-navy-700 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 