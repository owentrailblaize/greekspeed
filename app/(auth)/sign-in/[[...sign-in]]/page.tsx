'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, ArrowRight, Mail, Star } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    // SignInPage: Auth state check

    if (!authLoading && user) {
      // SignInPage: User already authenticated, redirecting to dashboard
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // SignInPage: Attempting sign in

    try {
      await signIn(email, password);
      // SignInPage: Sign in successful, redirecting to dashboard
      
      // Add a small delay to ensure auth state is updated
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    } catch (error) {
      console.error('❌ SignInPage: Sign in failed:', error);
      setError(error instanceof Error ? error.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google sign-in error:', error);
        setError('Google sign-in failed. Please try again.');
      }
    } catch (error) {
      console.error('Google sign-in exception:', error);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleBackToLanding = () => {
    router.push('/');
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render form if user is already authenticated
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
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-5xl shadow-xl border-0">
        <div className="flex min-h-[500px]">
          {/* Left Column - Promotional Content */}
          <div className="hidden lg:block w-full lg:w-1/2 bg-gradient-to-br from-navy-50 to-blue-50 p-8 flex flex-col justify-center">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Welcome to Trailblaize
              </h1>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Rethink the way you connect, manage, and grow your fraternity network
              </p>
              
              {/* Network Visualization - Smaller */}
              <div className="relative w-48 h-48 mx-auto lg:mx-0">
                <div className="absolute inset-0 bg-gradient-to-br from-navy-200 to-blue-200 rounded-full opacity-20"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-navy-300 to-blue-300 rounded-full opacity-30"></div>
                <div className="absolute inset-8 bg-gradient-to-br from-navy-400 to-blue-400 rounded-full opacity-40"></div>
                
                {/* Network Nodes */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rounded-full border-2 border-navy-500 shadow-lg"></div>
                <div className="absolute top-10 left-6 w-5 h-5 bg-white rounded-full border-2 border-navy-400 shadow-md"></div>
                <div className="absolute top-14 right-10 w-6 h-6 bg-white rounded-full border-2 border-navy-500 shadow-md"></div>
                <div className="absolute bottom-16 left-12 w-4 h-4 bg-white rounded-full border-2 border-navy-400 shadow-md"></div>
                <div className="absolute bottom-6 right-6 w-5 h-5 bg-white rounded-full border-2 border-navy-500 shadow-md"></div>
                
                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 192 192">
                  <line x1="96" y1="24" x2="72" y2="72" stroke="#1e40af" strokeWidth="2" opacity="0.3"/>
                  <line x1="96" y1="24" x2="120" y2="96" stroke="#1e40af" strokeWidth="2" opacity="0.3"/>
                  <line x1="72" y1="72" x2="48" y2="120" stroke="#1e40af" strokeWidth="2" opacity="0.3"/>
                  <line x1="120" y1="96" x2="144" y2="120" stroke="#1e40af" strokeWidth="2" opacity="0.3"/>
                </svg>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 text-center lg:text-left">
                <p className="text-sm text-gray-600 mb-3">Trusted by 1000+ fraternity members</p>
                <div className="flex items-center justify-center lg:justify-start space-x-3">
                  <div className="w-6 h-6 bg-navy-600 rounded-lg flex items-center justify-center">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Login Form */}
          <div className="w-full lg:w-1/2 p-6 lg:p-8 flex flex-col justify-center min-h-screen lg:min-h-0">
            <div className="w-full max-w-md mx-auto">
              {/* Mobile Header - Only show on mobile */}
              <div className="lg:hidden text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Trailblaize</h1>
                <p className="text-sm text-gray-600">Sign in to your account</p>
              </div>

              {/* Desktop Header - Only show on desktop */}
              <div className="hidden lg:block">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Login</h2>
              </div>

              {/* Header */}
              <div className="mb-6">
                <button
                  onClick={handleBackToLanding}
                  className="flex items-center text-base text-gray-600 mb-3 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="text-lg font-medium">Login with email</span>
                </button>
                <div className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/sign-up" className="text-navy-600 hover:text-navy-700 font-medium">
                    Sign Up
                  </Link>
                </div>
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className="h-11 border-gray-300 focus:border-navy-500 focus:ring-navy-500"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className="h-11 border-gray-300 focus:border-navy-500 focus:ring-navy-500"
                  />
                </div>
                
                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-navy-600 hover:text-navy-700"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                    {error}
                  </div>
                )}

                {/* Continue Button */}
                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-full bg-navy-600 hover:bg-navy-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200" 
                  disabled={loading || googleLoading}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              {/* Google Sign In Button */}
              <div className="mt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full h-11 rounded-full border-gray-300 hover:bg-gray-50 text-gray-700 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                >
                  <img 
                    src="https://developers.google.com/identity/images/g-logo.png" 
                    alt="Google" 
                    className="w-5 h-5 mr-3"
                  />
                  {googleLoading ? 'Signing in...' : 'Sign in with Google'}
                </Button>
              </div>

              {/* Terms */}
              <p className="text-sm text-gray-600 mt-4 text-center">
                By clicking continue, you agree to our{' '}
                <Link href="/terms" className="text-navy-600 hover:text-navy-700 underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-navy-600 hover:text-navy-700 underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 