'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { getStripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase/client';

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

    try {
      // Get user profile with role and chapter_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, chapter_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      if (!profile) return;

      // Store user role for conditional rendering
      setUserRole(profile.role);

      // ALUMNI: Always free - no paywall
      if (profile.role === 'alumni') {
        console.log('User is alumni - granting free access');
        setIsPaywallVisible(false);
        return;
      }

      // ADMIN & ACTIVE_MEMBER: Check chapter subscription
      if (profile.role === 'admin' || profile.role === 'active_member') {
        if (!profile.chapter_id) {
          console.log('User has no chapter assigned - showing paywall');
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
          console.error('Error checking chapter subscription:', subscriptionError);
        }

        if (!chapterSubscription) {
          console.log('Chapter has no active subscription - showing paywall');
          setIsPaywallVisible(true);
        } else {
          console.log('Chapter has active subscription - granting access');
          setIsPaywallVisible(false);
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user?.id || !user?.email || !userChapter?.id) {
      console.error('Missing required data:', {
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
      console.log('Starting chapter subscription process...');
      console.log('User ID:', user.id);
      console.log('User Email:', user.email);
      console.log('Chapter ID:', userChapter.id);
      console.log('Chapter:', userChapter);
      
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
        console.error('Stripe redirect error:', stripeError);
        
        // Fallback to direct URL redirect
        if (url) {
          window.location.href = url;
        } else {
          throw new Error('Both client-side and server-side redirects failed');
        }
      }
    } catch (error) {
      console.error('Error creating chapter subscription:', error);
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

  if (isPaywallVisible) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Chapter Access Required
            </h1>
            
            {userChapter && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                  {userChapter.national_fraternity} - {userChapter.chapter_name}
                </h2>
                <p className="text-blue-700 text-sm">
                  {userChapter.name}
                </p>
              </div>
            )}
            
            <p className="text-gray-600 mb-8">
              Your chapter needs an active subscription to access GreekSpeed. 
              Only one admin payment unlocks access for all chapter members.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Chapter Benefits:</h2>
              <ul className="text-left space-y-3">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Full dashboard access for all members
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Event management & communication
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Alumni networking platform
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Advanced analytics & reporting
                </li>
              </ul>
            </div>

            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-blue-600">$25.00</div>
              <div className="text-gray-500">per month per chapter</div>
              <div className="text-sm text-gray-400 mt-2">Unlocks access for all chapter members</div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Only show payment button for admin users */}
            {userRole === 'admin' ? (
              <>
                <button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className={`w-full font-semibold py-3 px-6 rounded-lg transition duration-200 mb-4 ${
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
                    'Activate Chapter Subscription'
                  )}
                </button>

                {sessionUrl && (
                  <button
                    onClick={handleDirectRedirect}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 mb-4"
                  >
                    Direct Payment Link (Fallback)
                  </button>
                )}
              </>
            ) : (
              /* Show different message for non-admin users */
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-yellow-800 font-medium">Admin Action Required</span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  Only chapter administrators can activate the subscription. Please contact your chapter admin to enable access.
                </p>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mt-4">
              One payment unlocks access for all chapter members. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
