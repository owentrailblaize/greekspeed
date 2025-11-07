'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore, type Persistor } from 'redux-persist';

import { makeStore } from './index';
import type { AppStore } from './types';

type ReduxProviderProps = {
  children: ReactNode;
};

export function ReduxProvider({ children }: ReduxProviderProps) {
    const storeRef = useRef<AppStore | null>(null);
    const persistorRef = useRef<Persistor | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
    persistorRef.current = persistStore(storeRef.current);
  }

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistorRef.current!}>
        {children}
      </PersistGate>
    </Provider>
  );
}

