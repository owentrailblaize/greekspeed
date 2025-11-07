import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
} from 'redux-persist';

import { createPersistConfig } from './persistConfig';
import authReducer from './slices/authSlice';

const rootReducer = combineReducers({
  auth: authReducer,
});

const persistConfig = createPersistConfig<ReturnType<typeof rootReducer>>({
  blacklist: [],
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () =>
  configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          ignoredPaths: ['_persist'],
        },
      }),
  });

