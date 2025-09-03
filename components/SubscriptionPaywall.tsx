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

  useEffect(() => {
    if (!loading && user) {
      checkSubscriptionStatus();
    }
  }, [user, loading]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    // Check if user is admin or alumni
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, subscription_status, billing_unlocked_until')
      .eq('id', user.id)
      .single();

    if (!profile) return;

    // Check if user needs subscription
    const needsSubscription = profile.role === 'admin' || profile.role === 'alumni';
    const hasActiveSubscription = profile.subscription_status === 'active';
    const hasGracePeriod = profile.billing_unlocked_until && new Date(profile.billing_unlocked_until) > new Date();

    if (needsSubscription && !hasActiveSubscription && !hasGracePeriod) {
      setIsPaywallVisible(true);
    }
  };

  const handleSubscribe = async () => {
    try {
      console.log('Starting subscription process...');
      
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to create subscription');
      }

      const { sessionId } = await response.json();
      console.log('Received session ID:', sessionId);
      
      if (!sessionId) {
        throw new Error('No session ID received');
      }

      const stripe = await getStripe();
      
      if (stripe) {
        console.log('Redirecting to Stripe checkout...');
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Stripe redirect error:', error);
          throw error;
        }
      } else {
        throw new Error('Stripe failed to load');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      // You could add a user-friendly error message here
      alert('Failed to start subscription. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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
              <div className="text-4xl font-bold text-blue-600">$9.99</div>
              <div className="text-gray-500">per month</div>
            </div>

            <button
              onClick={handleSubscribe}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Start Premium Subscription
            </button>
            
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
