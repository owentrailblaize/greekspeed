import type { makeStore } from './index';

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
export type RootState = ReturnType<AppStore['getState']>;

