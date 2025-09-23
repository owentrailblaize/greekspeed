import { useState as originalUseState, useEffect, useRef, ReactNode } from 'react';
import { useGlobalState } from '@/lib/contexts/GlobalStateContext';

// Track component instances for auto-key generation
const componentInstanceMap = new Map<string, number>();
let globalInstanceCounter = 0;

/**
 * Auto-persistence wrapper that replaces useState globally
 * This hook automatically persists all state without requiring explicit keys
 */
export function useState<T>(initialValue: T, persistenceKey?: string): [T, (value: T | ((prevValue: T) => T)) => void] {
  const globalState = useGlobalState();
  const componentId = useRef<string>();
  const stateId = useRef<string>();
  const isInitialized = useRef(false);

  // Generate unique component ID
  if (!componentId.current) {
    componentId.current = `component-${++globalInstanceCounter}`;
  }

  // Generate unique state ID
  if (!stateId.current) {
    const instanceCount = componentInstanceMap.get(componentId.current) || 0;
    componentInstanceMap.set(componentId.current, instanceCount + 1);
    stateId.current = persistenceKey || `${componentId.current}-state-${instanceCount}`;
  }

  const [state, setState] = originalUseState<T>(initialValue);

  // Load state from global storage on mount
  useEffect(() => {
    try {
      const storedValue = globalState.getState(stateId.current!);
      if (storedValue !== undefined) {
        setState(storedValue);
      }
    } catch (error) {
      console.error(`Error loading auto-persistent state for key ${stateId.current}:`, error);
    } finally {
      isInitialized.current = true;
    }
  }, [globalState]);

  // Save state to global storage whenever it changes
  useEffect(() => {
    if (isInitialized.current) {
      try {
        globalState.setState(stateId.current!, state);
      } catch (error) {
        console.error(`Error saving auto-persistent state for key ${stateId.current}:`, error);
      }
    }
  }, [state, globalState]);

  return [state, setState];
}

/**
 * Manual persistent state hook for explicit control
 */
export function usePersistentState<T>(
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
  const [state, setState, clearState] = usePersistentState(key, defaultValue);

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
