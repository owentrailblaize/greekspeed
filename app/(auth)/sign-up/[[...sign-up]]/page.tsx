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
import { Star, Mail, Info, Users, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useChapters } from '@/lib/hooks/useChapters';
import { Chapter } from '@/types/chapter';
import { Checkbox } from '@/components/ui/checkbox';

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
  // Phone number opt-in / opt-out
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);

  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const { signUp, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [oauthLoading, setOauthLoading] = useState(false);
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  
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
        role,
        phone: phoneNumber, // Add phone number to the signUp payload
        smsConsent: smsConsent // Add SMS consent to the signUp payload
      });
      setSuccess('Account created successfully! Redirecting...');
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);
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

  const handleLinkedInSignUp = async () => {
    try {
      setLinkedInLoading(true);
      setError('');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid profile email',
        },
      });

      if (error) {
        console.error('LinkedIn sign-up error:', error);
        setError('LinkedIn sign-up failed. Please try again.');
      }
    } catch (error) {
      console.error('LinkedIn sign-up exception:', error);
      setError('LinkedIn sign-up failed. Please try again.');
    } finally {
      setLinkedInLoading(false);
    }
  };

  const handleEmailSignUp = () => {
    setShowEmailForm(true);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Limit to 10 digits (US phone numbers)
    const limitedPhone = phoneNumber.slice(0, 10);
    
    // Format based on length
    if (limitedPhone.length === 0) return '';
    if (limitedPhone.length < 4) return `(${limitedPhone}`;
    if (limitedPhone.length < 7) {
      return `(${limitedPhone.slice(0, 3)}) ${limitedPhone.slice(3)}`;
    }
    return `(${limitedPhone.slice(0, 3)}) ${limitedPhone.slice(3, 6)}-${limitedPhone.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleBackToLanding = () => {
    router.push('/');
  };

  const isValidPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '')
    return digits.length === 10;
  }

  const isPhoneValid = phoneNumber === '' || isValidPhoneNumber(phoneNumber);

  if (authLoading || oauthLoading || linkedInLoading) {
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-navy-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Redirecting to dashboard...</p>
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Layout - Full Width, No Card, Vertically Centered */}
      <div className="lg:hidden w-full min-h-screen flex items-center justify-center">
        <div className="w-full p-4 sm:p-6">
          <div className="w-full max-w-sm mx-auto">
            {/* Mobile Header - Compact */}
            <div className="text-center mb-3">
              <h1 className="text-lg font-bold text-gray-900 mb-1">Welcome to Trailblaize</h1>
              <p className="text-xs text-gray-600">Create your account</p>
            </div>

            {!showEmailForm ? (
              /* Social Sign Up Options - Compact */
              <div className="space-y-2">
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full h-9 rounded-full border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-left px-3 text-sm shadow-sm hover:shadow-md transition-all duration-200"
                  onClick={handleGoogleSignUp}
                  disabled={loading || linkedInLoading}
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
                  className="w-full h-9 rounded-full border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-left px-3 text-sm shadow-sm hover:shadow-md transition-all duration-200"
                  onClick={handleLinkedInSignUp}
                  disabled={loading || linkedInLoading}
                >
                  <img 
                    src="/linkedin-icon.png" 
                    alt="LinkedIn" 
                    className="w-5 h-5 mr-3"
                  />
                  {linkedInLoading ? 'Signing up...' : 'Continue with LinkedIn'}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full h-9 rounded-full border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-left px-3 text-sm shadow-sm hover:shadow-md transition-all duration-200"
                  onClick={handleEmailSignUp}
                  disabled={loading || linkedInLoading}
                >
                  <Mail className="h-4 w-4 mr-3 text-gray-600" />
                  Continue with Email
                </Button>
              </div>
            ) : (
              /* Email Form - Full width on mobile */
              <div className="text-left">
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

                {/* Rest of the form - keep existing form code */}
                <form onSubmit={handleSubmit} className="space-y-1.5">
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

                      {/* Phone Number Field - Compact */}
                      <div className="space-y-1">
                        <Label htmlFor="phone" className="text-xs font-medium text-gray-700">
                          Phone Number <span className="text-gray-500 font-normal">(Optional)</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={phoneNumber}
                          onChange={handlePhoneChange}
                          disabled={loading}
                          className={`h-7 border-gray-300 focus:border-navy-500 focus:ring-navy-500 text-sm ${
                            phoneNumber && !isValidPhoneNumber(phoneNumber) 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                              : ''
                          }`}
                          maxLength={14}
                          pattern="\(\d{3}\) \d{3}-\d{4}"
                          inputMode="numeric"
                        />
                        <p className="text-xs text-gray-500">
                          Used for SMS notifications about chapter updates and events
                        </p>
                        {phoneNumber && !isValidPhoneNumber(phoneNumber) && (
                          <p className="text-xs text-red-500">
                            Please enter a complete 10-digit phone number
                          </p>
                        )}
                      </div>

                      {/* SMS Consent Checkbox - Updated for compliance */}
                      <div className="space-y-1">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="sms-consent"
                            checked={smsConsent}
                            onCheckedChange={(checked) => setSmsConsent(checked === true)}
                            className="mt-0.5"
                            disabled={loading}
                          />
                          <div className="grid gap-1 leading-none">
                            <Label
                              htmlFor="sms-consent"
                              className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              By providing your phone number and clicking 'Submit,' you agree to receive SMS notifications about chapter updates and events from Trailblaize, Inc.
                            </Label>
                            <p className="text-xs text-gray-500">
                              Message frequency may vary. Standard Message and Data Rates may apply. Reply STOP to opt out. Reply HELP for help. Consent is not a condition of purchase. Your mobile information will not be sold or shared with third parties for promotional or marketing purposes.
                            </p>
                          </div>
                        </div>
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
                          disableDynamicPositioning={true}
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

                      {/* Submit Button */}
                      <div className="mt-2 lg:mt-1">
                        <Button 
                          type="submit" 
                          className="w-full h-7 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white font-medium text-sm shadow-sm hover:shadow-md transition-all duration-200" 
                          disabled={loading}
                        >
                          {loading ? 'Creating account...' : 'Create Alumni Account'}
                        </Button>
                      </div>
                    </form>

                    {/* Terms and Sign In */}
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

            {/* Back to Home Link - Mobile (at bottom) */}
            <div className="mt-4 text-center">
              <button
                onClick={handleBackToLanding}
                className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-800 transition-colors mx-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="text-base font-medium">Back to home</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Card Layout */}
      <div className="hidden lg:flex lg:items-center lg:justify-center lg:min-h-screen lg:p-1 lg:sm:p-2">
        <Card className="w-full max-w-4xl shadow-xl border-0">
          <CardContent className="p-0">
            <div className="flex">
              {/* Left Column - Introduction */}
              <div className="w-full lg:w-1/2 bg-gradient-to-br from-navy-50 to-blue-50 p-4 lg:p-6 flex flex-col justify-center items-center min-h-[500px]">
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

              {/* Right Column - Sign Up */}
              <div className="w-full lg:w-1/2 p-2 sm:p-3 lg:p-4 flex flex-col justify-center">
                <div className="w-full max-w-sm mx-auto">
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
                        className="w-full h-9 rounded-full border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-left px-3 text-sm shadow-sm hover:shadow-md transition-all duration-200"
                        onClick={handleGoogleSignUp}
                        disabled={loading || linkedInLoading}
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
                        className="w-full h-9 rounded-full border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-left px-3 text-sm shadow-sm hover:shadow-md transition-all duration-200"
                        onClick={handleLinkedInSignUp}
                        disabled={loading || linkedInLoading}
                      >
                        <img 
                          src="/linkedin-icon.svg" 
                          alt="LinkedIn" 
                          className="w-4 h-4 mr-3"
                        />
                        {linkedInLoading ? 'Signing up...' : 'Continue with LinkedIn'}
                      </Button>
                      
                      <Button 
                        type="button"
                        variant="outline" 
                        className="w-full h-9 rounded-full border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-left px-3 text-sm shadow-sm hover:shadow-md transition-all duration-200"
                        onClick={handleEmailSignUp}
                        disabled={loading || linkedInLoading}
                      >
                        <Mail className="h-4 w-4 mr-3 text-gray-600" />
                        Continue with Email
                      </Button>
    </div>
                  ) : (
                    /* Email Form - Dynamic height */
                    <div className="text-left">
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

                      <form onSubmit={handleSubmit} className="space-y-1.5 lg:space-y-3">
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

                        {/* Phone Number Field - Compact */}
                        <div className="space-y-1">
                          <Label htmlFor="phone" className="text-xs font-medium text-gray-700">
                            Phone Number <span className="text-gray-500 font-normal">(Optional)</span>
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            disabled={loading}
                            className={`h-7 border-gray-300 focus:border-navy-500 focus:ring-navy-500 text-sm ${
                              phoneNumber && !isValidPhoneNumber(phoneNumber) 
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                                : ''
                            }`}
                            maxLength={14}
                            pattern="\(\d{3}\) \d{3}-\d{4}"
                            inputMode="numeric"
                          />
                          <p className="text-xs text-gray-500">
                            Used for SMS notifications about chapter updates and events
                          </p>
                          {phoneNumber && !isValidPhoneNumber(phoneNumber) && (
                            <p className="text-xs text-red-500">
                              Please enter a complete 10-digit phone number
                            </p>
                          )}
                        </div>

                        {/* SMS Consent Checkbox - Updated for compliance */}
                        <div className="space-y-1">
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="sms-consent"
                              checked={smsConsent}
                              onCheckedChange={(checked) => setSmsConsent(checked === true)}
                              className="mt-0.5"
                              disabled={loading}
                            />
                            <div className="grid gap-1 leading-none">
                              <Label
                                htmlFor="sms-consent"
                                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                By providing your phone number and clicking 'Submit,' you agree to receive SMS notifications about chapter updates and events from Trailblaize, Inc.
                              </Label>
                              <p className="text-xs text-gray-500">
                                Message frequency may vary. Standard Message and Data Rates may apply. Reply STOP to opt out. Reply HELP for help. Consent is not a condition of purchase. Your mobile information will not be sold or shared with third parties for promotional or marketing purposes.
                              </p>
                            </div>
                          </div>
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
                            disableDynamicPositioning={true}
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

                        {/* Submit Button */}
                        <div className="mt-2 lg:mt-1">
                          <Button 
                            type="submit" 
                            className="w-full h-7 rounded-full bg-brand-primary hover:bg-brand-primary-hover text-white font-medium text-sm shadow-sm hover:shadow-md transition-all duration-200" 
                            disabled={loading}
                          >
                            {loading ? 'Creating account...' : 'Create Alumni Account'}
                          </Button>
                        </div>
                      </form>

                      {/* Terms and Sign In */}
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

                  {/* Back to Home Link - Desktop (at bottom) */}
                  <div className="hidden lg:block mt-4">
                    <button
                      onClick={handleBackToLanding}
                      className="flex items-center text-base text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      <span className="text-lg font-medium">Back to home</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 