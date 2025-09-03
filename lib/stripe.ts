import Stripe from 'stripe';

// Client-side Stripe instance only
export const getStripe = () => {
  if (typeof window !== 'undefined') {
    return new (require('@stripe/stripe-js')).loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    );
  }
  return null;
};
