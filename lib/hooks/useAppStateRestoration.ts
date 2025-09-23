import { useEffect, useState, useCallback } from 'react';

interface AppStateRestorationOptions {
  onVisibilityChange?: (isVisible: boolean) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  restoreOnFocus?: boolean;
}

/**
 * Hook to handle app state restoration when page becomes visible
 * Useful for refreshing data or restoring state when user returns to the app
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}

/**
 * Hook for comprehensive app state restoration
 * Handles page visibility, focus events, and provides restoration callbacks
 */
export function useAppStateRestoration(options: AppStateRestorationOptions = {}) {
  const {
    onVisibilityChange,
    onFocus,
    onBlur,
    restoreOnFocus = true
  } = options;

  const isVisible = usePageVisibility();
  const [isFocused, setIsFocused] = useState(true);

  // Handle visibility changes
  useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(isVisible);
    }
  }, [isVisible, onVisibilityChange]);

  // Handle window focus/blur events
  useEffect(() => {
    const handleFocus = () => {
      setIsFocused(true);
      if (onFocus) {
        onFocus();
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      if (onBlur) {
        onBlur();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onFocus, onBlur]);

  // Restore state when app becomes visible and focused
  useEffect(() => {
    if (isVisible && isFocused && restoreOnFocus) {
      // Trigger any restoration logic here
      console.log('App state restoration triggered');
    }
  }, [isVisible, isFocused, restoreOnFocus]);

  return {
    isVisible,
    isFocused,
    isActive: isVisible && isFocused
  };
}

/**
 * Hook for managing component state that should be restored on app focus
 * Automatically saves state to sessionStorage and restores it when needed
 */
export function useRestorableState<T>(
  key: string,
  defaultValue: T,
  options: {
    storage?: 'localStorage' | 'sessionStorage';
    restoreOnFocus?: boolean;
  } = {}
) {
  const { storage = 'sessionStorage', restoreOnFocus = true } = options;
  
  const [state, setState] = useState<T>(defaultValue);
  const [isRestored, setIsRestored] = useState(false);

  // Load state from storage on mount
  useEffect(() => {
    try {
      const stored = window[storage].getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        setState(parsed);
      }
    } catch (error) {
      console.error(`Error loading "${key}" from ${storage}:`, error);
    } finally {
      setIsRestored(true);
    }
  }, [key, storage]);

  // Save state to storage whenever it changes
  useEffect(() => {
    if (isRestored) {
      try {
        window[storage].setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error saving "${key}" to ${storage}:`, error);
      }
    }
  }, [state, key, storage, isRestored]);

  // Restore state when app becomes visible (if enabled)
  useAppStateRestoration({
    restoreOnFocus,
    onFocus: () => {
      if (restoreOnFocus) {
        try {
          const stored = window[storage].getItem(key);
          if (stored !== null) {
            const parsed = JSON.parse(stored);
            setState(parsed);
          }
        } catch (error) {
          console.error(`Error restoring "${key}" from ${storage}:`, error);
        }
      }
    }
  });

  return [state, setState] as const;
}
