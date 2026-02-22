import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../features/auth/authApi';
import { workoutsApi } from '../features/workouts/workoutsApi';
import { templatesApi } from '../features/templates/templatesApi';

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [workoutsApi.reducerPath]: workoutsApi.reducer,
    [templatesApi.reducerPath]: templatesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore AsyncStorage non-serializable values
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(authApi.middleware, workoutsApi.middleware, templatesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
