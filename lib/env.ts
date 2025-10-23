export const getEnvironment = () => {
    // Check if we're in development
    if (process.env.NODE_ENV === 'development') {
      return 'development';
    }
    
    // Check custom environment variable
    if (process.env.NEXT_PUBLIC_ENV) {
      return process.env.NEXT_PUBLIC_ENV;
    }
    
    // Check by hostname
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('trailblaize.net')) {
        return 'production';
      }
      if (hostname.includes('greekspeed.vercel.app')) {
        return 'development';
      }
    }
    
    // Default to production
    return 'production';
  };
  
  export const isProduction = () => getEnvironment() === 'production';
  export const isDevelopment = () => getEnvironment() === 'development';
  
  export const getAppUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_APP_URL || 'https://trailblaize.net';
  };