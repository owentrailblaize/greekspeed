import { combineReducers } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
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
import { createSlice } from '@reduxjs/toolkit';

const placeholderSlice = createSlice({
    name: 'placeholder',
    initialState: {},
    reducers: {},
});

const rootReducer = combineReducers({
  placeholder: placeholderSlice.reducer,
  // add real slices here later
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

