'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { ArrowLeft, ArrowRight, Mail, Star } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    } catch (signInError) {
      logger.error('Sign-in failed', { signInError, email });
      setError(signInError instanceof Error ? signInError.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) {
        logger.error('Google sign-in error', { oauthError });
        setError('Google sign-in failed. Please try again.');
      }
    } catch (googleError) {
      logger.error('Google sign-in exception', { googleError });
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
      <div className="w-full max-w-5xl shadow-xl border-0">
        <div className="flex min-h-[500px]">
          {/* Left Column */}
          <div className="hidden lg:block w-full lg:w-1/2 bg-gradient-to-br from-navy-50 to-blue-50 p-8 flex flex-col justify-center">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Welcome to Trailblaize
              </h1>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Rethink the way you connect, manage, and grow your fraternity network
              </p>
              {/* Visualization & badges omitted for brevity */}
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-1/2 p-6 lg:p-8 flex flex-col justify-center min-h-screen lg:min-h-0">
            <div className="w-full max-w-md mx-auto">
              {/* Headers omitted for brevity */}

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

                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Forgot Password?
                  </button>
                </div>

                {error && (
                  <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-navy-600 hover:bg-navy-700 text-white font-medium"
                  disabled={loading || googleLoading}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
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

              {/* Terms omitted for brevity */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}