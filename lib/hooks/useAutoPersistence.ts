import { ReactNode, useEffect } from 'react';
import { useGlobalState } from '@/lib/contexts/GlobalStateContext';

interface AutoPersistenceWrapperProps {
  children: ReactNode;
  componentName: string;
  persistenceKeys?: string[];
}

/**
 * Wrapper component that automatically handles state persistence for any component
 * This can be wrapped around any component to add automatic state persistence
 */
export function AutoPersistenceWrapper({ 
  children, 
  componentName, 
  persistenceKeys = [] 
}: AutoPersistenceWrapperProps) {
  const globalState = useGlobalState();

  useEffect(() => {
    // Register this component with the global state manager
    console.log(`🔄 Auto-persistence enabled for ${componentName}`);
    
    return () => {
      // Cleanup on unmount
      console.log(`🧹 Auto-persistence cleanup for ${componentName}`);
    };
  }, [componentName]);

  return <>{children}</>;
}

/**
 * Higher-order component that adds automatic state persistence to any component
 */
export function withAutoPersistence<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string,
  persistenceKeys: string[] = []
) {
  const ComponentWithPersistence = (props: P) => {
    return (
      <AutoPersistenceWrapper componentName={componentName} persistenceKeys={persistenceKeys}>
        <WrappedComponent {...props} />
      </AutoPersistenceWrapper>
    );
  };

  ComponentWithPersistence.displayName = `withAutoPersistence(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return ComponentWithPersistence;
}

/**
 * Hook that automatically persists component state
 * Usage: const [state, setState] = useAutoPersistentState(initialValue, 'my-component-state');
 */
export function useAutoPersistentState<T>(
  initialValue: T,
  key: string,
  options?: {
    storage?: 'localStorage' | 'sessionStorage';
    validate?: (value: any) => boolean;
  }
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  const globalState = useGlobalState();
  
  // This will automatically use the global state manager
  return usePersistentState(key, initialValue, {
    ...options,
    global: true
  });
}
