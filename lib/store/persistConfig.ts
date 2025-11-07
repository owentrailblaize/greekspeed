import type { PersistConfig } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

const createNoopStorage = () => ({
  getItem: async () => null,
  setItem: async (_key: string, value: unknown) => value,
  removeItem: async () => undefined,
});

const storage =
  typeof window !== 'undefined'
    ? createWebStorage('local')
    : createNoopStorage();

export const createPersistConfig = <S>(
  overrides: Partial<PersistConfig<S>> = {},
): PersistConfig<S> => ({
  key: 'root',
  storage,
  version: 1,
  whitelist: ['auth', 'profile'],
  ...overrides,
});

