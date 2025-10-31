import { loadStripe } from '@stripe/stripe-js';
import { logger } from "@/lib/utils/logger";

let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      logger.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      return null;
    }
    
    // Check if we're using live keys in development
    const isLiveInDev = process.env.NODE_ENV === 'development' && publishableKey.startsWith('pk_live_');
    
    if (isLiveInDev) {
      logger.warn('⚠️ Using LIVE Stripe keys in DEVELOPMENT mode. This may cause authentication issues.');
    }
    
    // Add additional options to handle potential issues
    stripePromise = loadStripe(publishableKey, {
      apiVersion: '2024-12-18.acacia',
      stripeAccount: undefined, // Don't use connected account
      // Add locale to prevent module loading issues
      locale: 'en',
    });
  }
  
  return stripePromise;
};
