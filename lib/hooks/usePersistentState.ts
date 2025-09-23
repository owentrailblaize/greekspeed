import { useState, useEffect, useCallback, useRef } from 'react';
import { useGlobalState } from '@/lib/contexts/GlobalStateContext';

type StorageType = 'localStorage' | 'sessionStorage';

interface UsePersistentStateOptions {
  storage?: StorageType;
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
  validate?: (value: any) => boolean;
  global?: boolean; // Use global state manager
}

/**
 * Enhanced persistent state hook that can use either global state or direct storage
 * @param key - Unique key for storing the state
 * @param defaultValue - Default value if no stored value exists
 * @param options - Configuration options for storage behavior
 */
export function usePersistentState<T>(
  key: string, 
  defaultValue: T,
  options: UsePersistentStateOptions = {}
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  const {
    storage = 'sessionStorage',
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    validate,
    global = true // Default to using global state
  } = options;

  const globalState = global ? useGlobalState() : null;
  const [state, setState] = useState<T>(defaultValue);
  const [isInitialized, setIsInitialized] = useState(false);
  const stateRef = useRef<T>(defaultValue);

  // Load state on mount
  useEffect(() => {
    try {
      let loadedValue: T | undefined;

      if (global && globalState) {
        // Use global state manager
        loadedValue = globalState.getState(key);
      } else {
        // Use direct storage
        const stored = window[storage].getItem(key);
        if (stored !== null) {
          loadedValue = deserialize(stored);
        }
      }

      if (loadedValue !== undefined) {
        // Validate the loaded value if validator is provided
        if (!validate || validate(loadedValue)) {
          setState(loadedValue);
          stateRef.current = loadedValue;
        } else {
          console.warn(`Invalid stored value for key "${key}", using default value`);
        }
      }
    } catch (error) {
      console.error(`Error loading "${key}":`, error);
    } finally {
      setIsInitialized(true);
    }
  }, [key, storage, deserialize, validate, global, globalState]);

  // Enhanced setter that supports both direct values and updater functions
  const setPersistentState = useCallback((value: T | ((prevValue: T) => T)) => {
    const newValue = typeof value === 'function' ? (value as (prevValue: T) => T)(stateRef.current) : value;
    
    setState(newValue);
    stateRef.current = newValue;

    if (isInitialized) {
      try {
        if (global && globalState) {
          // Use global state manager
          globalState.setState(key, newValue);
        } else {
          // Use direct storage
          window[storage].setItem(key, serialize(newValue));
        }
      } catch (error) {
        console.error(`Error saving "${key}":`, error);
      }
    }
  }, [key, storage, serialize, isInitialized, global, globalState]);

  // Clear function to remove the stored value
  const clearPersistentState = useCallback(() => {
    try {
      if (global && globalState) {
        globalState.clearState(key);
      } else {
        window[storage].removeItem(key);
      }
      setState(defaultValue);
      stateRef.current = defaultValue;
    } catch (error) {
      console.error(`Error clearing "${key}":`, error);
    }
  }, [key, storage, defaultValue, global, globalState]);

  return [state, setPersistentState, clearPersistentState];
}

/**
 * Hook for localStorage persistence (survives browser restarts)
 */
export function useLocalState<T>(
  key: string, 
  defaultValue: T,
  options?: Omit<UsePersistentStateOptions, 'storage'>
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  return usePersistentState(key, defaultValue, { ...options, storage: 'localStorage' });
}

/**
 * Hook for sessionStorage persistence (survives tab switches but not browser restarts)
 */
export function useSessionState<T>(
  key: string, 
  defaultValue: T,
  options?: Omit<UsePersistentStateOptions, 'storage'>
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  return usePersistentState(key, defaultValue, { ...options, storage: 'sessionStorage' });
}

/**
 * Hook for form state persistence with automatic cleanup
 */
export function usePersistentFormState<T extends Record<string, any>>(
  key: string,
  defaultValue: T,
  options?: UsePersistentStateOptions
): [T, (value: Partial<T> | ((prevValue: T) => T)) => void, () => void] {
  const [state, setState, clearState] = usePersistentState(key, defaultValue, options);

  const updateFormState = useCallback((value: Partial<T> | ((prevValue: T) => T)) => {
    setState(prevState => {
      if (typeof value === 'function') {
        return value(prevState);
      }
      return { ...prevState, ...value };
    });
  }, [setState]);

  return [state, updateFormState, clearState];
}

/**
 * Hook for component-level state that automatically persists
 * This is a drop-in replacement for useState that adds persistence
 */
export function useState<T>(initialValue: T, persistenceKey?: string): [T, (value: T | ((prevValue: T) => T)) => void] {
  const [state, setState] = usePersistentState(
    persistenceKey || `component-state-${Math.random().toString(36).substr(2, 9)}`,
    initialValue,
    { global: true }
  );
  
  return [state, setState];
}