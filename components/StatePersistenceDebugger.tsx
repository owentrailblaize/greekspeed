'use client';

import { useGlobalStateManager, useClearAllState } from '@/lib/hooks/useAutoPersistentState';
import { useState } from 'react';

/**
 * Debug component to test and manage global state persistence
 * This component shows all persisted state and allows clearing it
 */
export function StatePersistenceDebugger() {
  const globalState = useGlobalStateManager();
  const clearAllState = useClearAllState();
  const [isVisible, setIsVisible] = useState(false);

  // Get all stored state from sessionStorage
  const getAllStoredState = () => {
    const stored = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('greekspeed-')) {
        try {
          const value = sessionStorage.getItem(key);
          if (value) {
            stored[key] = JSON.parse(value);
          }
        } catch (error) {
          stored[key] = 'Error parsing';
        }
      }
    }
    return stored;
  };

  const storedState = getAllStoredState();

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg z-50 text-sm"
      >
        Debug State
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-4 max-w-md max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">State Persistence Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="text-sm text-gray-600">
          <strong>Stored States ({Object.keys(storedState).length}):</strong>
        </div>
        {Object.keys(storedState).length === 0 ? (
          <div className="text-sm text-gray-500 italic">No state stored</div>
        ) : (
          <div className="space-y-1">
            {Object.entries(storedState).map(([key, value]) => (
              <div key={key} className="text-xs bg-gray-50 p-2 rounded">
                <div className="font-mono text-blue-600">{key.replace('greekspeed-', '')}</div>
                <div className="text-gray-600 truncate">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={clearAllState}
          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
        >
          Clear All
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
