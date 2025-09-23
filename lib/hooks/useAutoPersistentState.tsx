'use client';

import { useState as originalUseState, useEffect, useRef, ReactNode, createContext, useContext } from 'react';
import { useGlobalState } from '@/lib/contexts/GlobalStateContext';

// Global state counter for auto-generating unique keys
let globalStateCounter = 0;
const componentStateMap = new Map<string, number>();

// Context for tracking component hierarchy
const ComponentContext = createContext<string>('root');

/**
 * Component wrapper that provides auto-persistence context
 */
export function AutoPersistenceProvider({ children }: { children: ReactNode }) {
  return <ComponentContext.Provider value="root">{children}</ComponentContext.Provider>;
}

/**
 * Enhanced useState that automatically persists all state
 * This is a drop-in replacement for useState that adds automatic persistence
 */
export function usePersistentState<T>(initialValue: T, persistenceKey?: string): [T, (value: T | ((prevValue: T) => T)) => void] {
  const globalState = useGlobalState();
  const componentPath = useContext(ComponentContext);
  const stateKey = useRef<string>();
  const isInitialized = useRef(false);

  // Generate unique state key
  if (!stateKey.current) {
    if (persistenceKey) {
      stateKey.current = persistenceKey;
    } else {
      const componentCounter = componentStateMap.get(componentPath) || 0;
      componentStateMap.set(componentPath, componentCounter + 1);
      stateKey.current = `${componentPath}-state-${componentCounter}`;
    }
  }

  const [state, setState] = originalUseState<T>(initialValue);

  // Load state from global storage on mount
  useEffect(() => {
    try {
      const storedValue = globalState.getState(stateKey.current!);
      if (storedValue !== undefined) {
        setState(storedValue);
      }
    } catch (error) {
      console.error(`Error loading auto-persistent state for key ${stateKey.current}:`, error);
    } finally {
      isInitialized.current = true;
    }
  }, [globalState]);

  // Save state to global storage whenever it changes
  useEffect(() => {
    if (isInitialized.current) {
      try {
        globalState.setState(stateKey.current!, state);
      } catch (error) {
        console.error(`Error saving auto-persistent state for key ${stateKey.current}:`, error);
      }
    }
  }, [state, globalState]);

  return [state, setState];
}

/**
 * Manual persistent state hook for explicit control
 */
export function useExplicitPersistentState<T>(
  key: string, 
  defaultValue: T,
  options?: {
    validate?: (value: any) => boolean;
  }
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  const globalState = useGlobalState();
  const [state, setState] = originalUseState<T>(defaultValue);
  const isInitialized = useRef(false);

  // Load state on mount
  useEffect(() => {
    try {
      const storedValue = globalState.getState(key);
      if (storedValue !== undefined) {
        if (!options?.validate || options.validate(storedValue)) {
          setState(storedValue);
        } else {
          console.warn(`Invalid stored value for key "${key}", using default value`);
        }
      }
    } catch (error) {
      console.error(`Error loading persistent state for key ${key}:`, error);
    } finally {
      isInitialized.current = true;
    }
  }, [key, globalState, options?.validate]);

  // Save state whenever it changes
  useEffect(() => {
    if (isInitialized.current) {
      try {
        globalState.setState(key, state);
      } catch (error) {
        console.error(`Error saving persistent state for key ${key}:`, error);
      }
    }
  }, [state, key, globalState]);

  const clearState = () => {
    globalState.clearState(key);
    setState(defaultValue);
  };

  return [state, setState, clearState];
}

/**
 * Form state persistence hook
 */
export function usePersistentFormState<T extends Record<string, any>>(
  key: string,
  defaultValue: T
): [T, (value: Partial<T> | ((prevValue: T) => T)) => void, () => void] {
  const [state, setState, clearState] = useExplicitPersistentState(key, defaultValue);

  const updateFormState = (value: Partial<T> | ((prevValue: T) => T)) => {
    setState(prevState => {
      if (typeof value === 'function') {
        return value(prevState);
      }
      return { ...prevState, ...value };
    });
  };

  return [state, updateFormState, clearState];
}

/**
 * Hook to access global state manager
 */
export function useGlobalStateManager() {
  return useGlobalState();
}

/**
 * Hook to clear all persisted state
 */
export function useClearAllState() {
  const globalState = useGlobalState();
  
  return () => {
    globalState.clearAllStates();
  };
}

/**
 * Higher-order component that adds auto-persistence to any component
 */
export function withAutoPersistence<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const ComponentWithPersistence = (props: P) => {
    const componentId = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    
    return (
      <ComponentContext.Provider value={componentId}>
        <WrappedComponent {...props} />
      </ComponentContext.Provider>
    );
  };

  ComponentWithPersistence.displayName = `withAutoPersistence(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return ComponentWithPersistence;
}