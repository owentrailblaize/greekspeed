'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { getStripe } from '@/lib/services/stripe/stripe';
import { supabase } from '@/lib/supabase/client';
import { PAYWALL_CONFIG } from '@/lib/config/paywall';
import { logger } from "@/lib/utils/logger";

interface SubscriptionPaywallProps {
  children: React.ReactNode;
}

export default function SubscriptionPaywall({ children }: SubscriptionPaywallProps) {
  const { user, loading } = useAuth();
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [userChapter, setUserChapter] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      checkSubscriptionStatus();
    }
  }, [user, loading]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    // PAYWALL DISABLED: Always grant access when paywall is disabled
    if (!PAYWALL_CONFIG.enabled) {
      setIsPaywallVisible(false);
      return;
    }

    try {
      // Get user profile with role and chapter_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, chapter_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        logger.error('Error fetching profile:', { context: [profileError] });
        return;
      }

      if (!profile) return;

      // Store user role for conditional rendering
      setUserRole(profile.role);

      // ALUMNI: Always free - no paywall
      if (profile.role === 'alumni') {
        // User is alumni - granting free access
        setIsPaywallVisible(false);
        return;
      }

      // ADMIN & ACTIVE_MEMBER: Check chapter subscription
      if (profile.role === 'admin' || profile.role === 'active_member') {
        if (!profile.chapter_id) {
          // User has no chapter assigned - showing paywall
          setIsPaywallVisible(true);
          return;
        }

        // Get chapter details for display - include the ID
        const { data: chapter } = await supabase
          .from('chapters')
          .select('id, name, national_fraternity, chapter_name')
          .eq('id', profile.chapter_id)
          .single();

        setUserChapter(chapter);

        // Check if chapter has active subscription
        const { data: chapterSubscription, error: subscriptionError } = await supabase
          .from('chapter_subscriptions')
          .select('status, current_period_end')
          .eq('chapter_id', profile.chapter_id)
          .eq('status', 'active')
          .single();

        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          logger.error('Error checking chapter subscription:', { context: [subscriptionError] });
        }

        if (!chapterSubscription) {
          // Chapter has no active subscription - showing paywall
          setIsPaywallVisible(true);
        } else {
          // Chapter has active subscription - granting access
          setIsPaywallVisible(false);
        }
      }
    } catch (error) {
      logger.error('Error checking subscription status:', { context: [error] });
    }
  };

  const handleSubscribe = async () => {
    if (!user?.id || !user?.email || !userChapter?.id) {
      logger.error('Missing required data:', {
                userId: user?.id,
                userEmail: user?.email,
                chapterId: userChapter?.id,
                userChapter: userChapter
              });
      setError('User information or chapter not available');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSessionUrl(null);

    try {
      // Starting chapter subscription process...
      // Chapter
      
      const response = await fetch('/api/chapter/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterId: userChapter.id,
          adminUserId: user.id,
          adminEmail: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      const { sessionId, sessionUrl: url } = responseData;
      
      if (!sessionId) {
        throw new Error('No session ID received from server');
      }

      if (url) {
        setSessionUrl(url);
      }

      // Redirect to Stripe checkout
      try {
        const stripe = await getStripe();
        
        if (!stripe) {
          throw new Error('Failed to load Stripe. Please check your internet connection.');
        }

        const { error: stripeError } = await stripe.redirectToCheckout({ 
          sessionId,
        });
        
        if (stripeError) {
          throw stripeError;
        }
      } catch (stripeError) {
        logger.error('Stripe redirect error:', { context: [stripeError] });
        
        // Fallback to direct URL redirect
        if (url) {
          window.location.href = url;
        } else {
          throw new Error('Both client-side and server-side redirects failed');
        }
      }
    } catch (error) {
      logger.error('Error creating chapter subscription:', { context: [error] });
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectRedirect = () => {
    if (sessionUrl) {
      window.location.href = sessionUrl;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // PAYWALL DISABLED: Always render children when paywall is disabled
  if (!PAYWALL_CONFIG.enabled) {
    return <>{children}</>;
  }

  if (isPaywallVisible) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 flex items-start justify-center p-4 pt-2 sm:pt-4">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-xl p-6 mt-2 sm:mt-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Chapter Access Required
            </h1>
            
            {userChapter && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <h2 className="text-base font-semibold text-blue-900 mb-1">
                  {userChapter.national_fraternity} - {userChapter.chapter_name}
                </h2>
                <p className="text-blue-700 text-xs">
                  {userChapter.name}
                </p>
              </div>
            )}
            
            <p className="text-gray-600 text-sm mb-4">
              Your chapter needs an active subscription to access GreekSpeed. 
              Only one admin payment unlocks access for all chapter members.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">Chapter Benefits:</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Full dashboard access
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Alumni networking
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Event management
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Advanced analytics
                </div>
              </div>
            </div>

            {/* Pricing and Action Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              {/* Pricing Section */}
              <div className="text-center sm:text-left">
                <div className="text-3xl font-bold text-blue-600">$25.00</div>
                <div className="text-gray-500 text-sm">per month per chapter</div>
              </div>

              {/* Admin Action Section */}
              {userRole === 'admin' ? (
                <div className="w-full sm:w-auto">
                  <button
                    onClick={handleSubscribe}
                    disabled={isLoading}
                    className={`w-full sm:w-auto font-semibold py-2 px-6 rounded-lg transition duration-200 ${
                      isLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </span>
                    ) : (
                      'Activate Subscription'
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 w-full sm:w-auto">
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-800 font-medium text-sm">Admin Action Required</span>
                  </div>
                  <p className="text-yellow-700 text-xs mt-1 text-center">
                    Contact your chapter admin to enable access.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {sessionUrl && userRole === 'admin' && (
              <button
                onClick={handleDirectRedirect}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 mb-4 text-sm"
              >
                Direct Payment Link (Fallback)
              </button>
            )}
            
            <p className="text-xs text-gray-500">
              One payment unlocks access for all chapter members. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
