'use client';

import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';

interface GlobalStateManager {
  getState: (key: string) => any;
  setState: (key: string, value: any) => void;
  clearState: (key: string) => void;
  clearAllStates: () => void;
  subscribe: (key: string, callback: (value: any) => void) => () => void;
}

const GlobalStateContext = createContext<GlobalStateManager | undefined>(undefined);

interface GlobalStateProviderProps {
  children: ReactNode;
  storage?: 'localStorage' | 'sessionStorage';
  prefix?: string;
}

/**
 * Global State Provider that automatically persists all React state
 * This provider wraps the entire app and intercepts useState calls
 */
export function GlobalStateProvider({ 
  children, 
  storage = 'sessionStorage',
  prefix = 'app-state'
}: GlobalStateProviderProps) {
  const stateRef = useRef<Map<string, any>>(new Map());
  const subscribersRef = useRef<Map<string, Set<(value: any) => void>>>(new Map());
  const storageRef = useRef(storage);
  const prefixRef = useRef(prefix);

  // Load all states from storage on mount
  useEffect(() => {
    try {
      const storageData = window[storageRef.current];
      for (let i = 0; i < storageData.length; i++) {
        const key = storageData.key(i);
        if (key?.startsWith(prefixRef.current)) {
          const value = storageData.getItem(key);
          if (value) {
            try {
              const parsedValue = JSON.parse(value);
              const stateKey = key.replace(`${prefixRef.current}-`, '');
              stateRef.current.set(stateKey, parsedValue);
            } catch (error) {
              console.error(`Error parsing stored state for key ${key}:`, error);
            }
          }
        }
      }
      console.log('🌍 Global state loaded from storage');
    } catch (error) {
      console.error('Error loading global state from storage:', error);
    }
  }, []);

  const getState = (key: string) => {
    return stateRef.current.get(key);
  };

  const setState = (key: string, value: any) => {
    stateRef.current.set(key, value);
    
    // Save to storage
    try {
      const storageKey = `${prefixRef.current}-${key}`;
      window[storageRef.current].setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving state for key ${key}:`, error);
    }

    // Notify subscribers
    const subscribers = subscribersRef.current.get(key);
    if (subscribers) {
      subscribers.forEach(callback => callback(value));
    }
  };

  const clearState = (key: string) => {
    stateRef.current.delete(key);
    
    try {
      const storageKey = `${prefixRef.current}-${key}`;
      window[storageRef.current].removeItem(storageKey);
    } catch (error) {
      console.error(`Error clearing state for key ${key}:`, error);
    }

    // Notify subscribers
    const subscribers = subscribersRef.current.get(key);
    if (subscribers) {
      subscribers.forEach(callback => callback(undefined));
    }
  };

  const clearAllStates = () => {
    stateRef.current.clear();
    
    try {
      const storageData = window[storageRef.current];
      const keysToRemove: string[] = [];
      for (let i = 0; i < storageData.length; i++) {
        const key = storageData.key(i);
        if (key?.startsWith(prefixRef.current)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => storageData.removeItem(key));
    } catch (error) {
      console.error('Error clearing all states:', error);
    }

    // Notify all subscribers
    subscribersRef.current.forEach(subscribers => {
      subscribers.forEach(callback => callback(undefined));
    });
  };

  const subscribe = (key: string, callback: (value: any) => void) => {
    if (!subscribersRef.current.has(key)) {
      subscribersRef.current.set(key, new Set());
    }
    subscribersRef.current.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = subscribersRef.current.get(key);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          subscribersRef.current.delete(key);
        }
      }
    };
  };

  const manager: GlobalStateManager = {
    getState,
    setState,
    clearState,
    clearAllStates,
    subscribe
  };

  return (
    <GlobalStateContext.Provider value={manager}>
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
}
