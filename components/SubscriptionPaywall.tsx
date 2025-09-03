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

  useEffect(() => {
    if (!loading && user) {
      checkSubscriptionStatus();
    }
  }, [user, loading]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      // Check if user is admin or alumni
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, subscription_status, billing_unlocked_until')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      if (!profile) return;

      // Check if user needs subscription
      const needsSubscription = profile.role === 'admin' || profile.role === 'alumni';
      const hasActiveSubscription = profile.subscription_status === 'active';
      const hasGracePeriod = profile.billing_unlocked_until && new Date(profile.billing_unlocked_until) > new Date();

      if (needsSubscription && !hasActiveSubscription && !hasGracePeriod) {
        setIsPaywallVisible(true);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user?.id || !user?.email) {
      setError('User information not available');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSessionUrl(null);

    try {
      console.log('Starting subscription process...');
      console.log('User ID:', user.id);
      console.log('User Email:', user.email);
      
      // First, let's test the Stripe configuration
      const debugResponse = await fetch('/api/debug-stripe');
      const debugData = await debugResponse.json();
      console.log('Stripe Debug Info:', debugData);
      
      if (!debugData.stripe.connection?.success) {
        throw new Error(`Stripe connection failed: ${debugData.stripe.connection?.error || 'Unknown error'}`);
      }
      
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Full response data:', responseData);
      
      const { sessionId, sessionUrl: url } = responseData;
      console.log('Received session ID:', sessionId);
      console.log('Received session URL:', url);
      
      if (!sessionId) {
        throw new Error('No session ID received from server');
      }

      // Store the session URL for fallback
      if (url) {
        setSessionUrl(url);
      }

      // Try the client-side redirect first
      try {
        const stripe = await getStripe();
        
        if (!stripe) {
          throw new Error('Failed to load Stripe. Please check your internet connection.');
        }

        console.log('Stripe loaded successfully, attempting client-side redirect...');
        
        // Add a small delay to ensure Stripe is fully loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { error: stripeError } = await stripe.redirectToCheckout({ 
          sessionId,
        });
        
        if (stripeError) {
          console.error('Stripe redirect error:', stripeError);
          throw stripeError; // Re-throw to try fallback
        }
        
        console.log('Client-side redirect initiated successfully');
      } catch (stripeError) {
        console.error('Client-side redirect failed:', stripeError);
        
        // Fallback to direct URL redirect
        if (url) {
          console.log('Falling back to direct URL redirect:', url);
          window.location.href = url;
        } else {
          throw new Error('Both client-side and server-side redirects failed');
        }
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
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
              Welcome to GreekSpeed Premium
            </h1>
            <p className="text-gray-600 mb-8">
              Unlock full access to all features and connect with your chapter community.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Premium Features Include:</h2>
              <ul className="text-left space-y-3">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Full dashboard access
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Alumni networking
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Event management
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Advanced analytics
                </li>
              </ul>
            </div>

            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-blue-600">$5.00</div>
              <div className="text-gray-500">per month</div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

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
                'Start Premium Subscription'
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
            
            <p className="text-sm text-gray-500 mt-4">
              Cancel anytime. No commitment required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
