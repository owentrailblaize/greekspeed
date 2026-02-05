// Paywall Configuration
// Set to false to temporarily disable paywall without removing logic
export const PAYWALL_CONFIG = {
    enabled: false, // Change to true when you want to re-enable the paywall
  } as const;
  
  // Type for paywall configuration
  export type PaywallConfig = typeof PAYWALL_CONFIG;