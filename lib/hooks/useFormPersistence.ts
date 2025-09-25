'use client';

import { useState, useEffect, useCallback } from 'react';

interface FormPersistenceOptions {
  key: string;
  storage?: 'localStorage' | 'sessionStorage';
  debounceMs?: number;
  autoSave?: boolean;
}

/**
 * Enhanced form persistence hook that prevents data loss during navigation
 */
export function useFormPersistence<T>(
  initialData: T,
  options: FormPersistenceOptions
) {
  const {
    key,
    storage = 'sessionStorage',
    debounceMs = 1000,
    autoSave = true
  } = options;

  const [formData, setFormData] = useState<T>(initialData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Storage key with prefix to avoid conflicts
  const storageKey = `greekspeed-form-${key}`;

  // Save to storage function
  const saveToStorage = useCallback((data: T) => {
    try {
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        hasChanges: true
      });
      window[storage].setItem(storageKey, serializedData);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error(`Error saving form data to ${storage}:`, error);
    }
  }, [storageKey, storage]);

  // Load from storage function
  const loadFromStorage = useCallback((): T | null => {
    try {
      const serializedData = window[storage].getItem(storageKey);
      if (!serializedData) return null;
      
      const parsed = JSON.parse(serializedData);
      
      // Check if data is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.timestamp > maxAge) {
        clearStorage();
        return null;
      }
      
      return parsed.data;
    } catch (error) {
      console.error(`Error loading form data from ${storage}:`, error);
      return null;
    }
  }, [storageKey, storage]);

  // Clear storage function
  const clearStorage = useCallback(() => {
    try {
      window[storage].removeItem(storageKey);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error(`Error clearing form data from ${storage}:`, error);
    }
  }, [storageKey, storage]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((data: T) => {
      if (autoSave) {
        saveToStorage(data);
      }
    }, debounceMs),
    [autoSave, debounceMs, saveToStorage]
  );

  // Initialize form data from storage on mount
  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData) {
      setFormData(savedData);
      setHasUnsavedChanges(true);
    }
    setIsInitialized(true);
  }, [loadFromStorage]);

  // Enhanced visibility change handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges) {
        // Tab is being hidden, save current state
        saveToStorage(formData);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        // Save data before leaving
        saveToStorage(formData);
        return e.returnValue;
      }
    };

    // Prevent page navigation if there are unsaved changes
    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Push the current state back to prevent navigation
        window.history.pushState(null, '', window.location.href);
        return false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [formData, hasUnsavedChanges, saveToStorage]);

  // Update form data and trigger auto-save
  const updateFormData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setFormData(prev => {
      const newData = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      setHasUnsavedChanges(true);
      
      // Trigger debounced save
      debouncedSave(newData);
      
      return newData;
    });
  }, [debouncedSave]);

  // Reset form data and clear storage
  const resetForm = useCallback(() => {
    setFormData(initialData);
    clearStorage();
    setHasUnsavedChanges(false);
  }, [initialData, clearStorage]);

  // Manually save current state
  const saveForm = useCallback(() => {
    saveToStorage(formData);
  }, [formData, saveToStorage]);

  // Initialize form with profile data only if no saved data exists
  const initializeWithProfileData = useCallback((profileData: T) => {
    if (!isInitialized) return;
    
    const savedData = loadFromStorage();
    if (!savedData && !hasUnsavedChanges) {
      setFormData(profileData);
    }
  }, [isInitialized, loadFromStorage, hasUnsavedChanges]);

  return {
    formData,
    updateFormData,
    resetForm,
    saveForm,
    clearStorage,
    hasUnsavedChanges,
    isInitialized,
    initializeWithProfileData
  };
}

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
