import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../features/auth/authApi';
import { workoutsApi } from '../features/workouts/workoutsApi';
import { templatesApi } from '../features/templates/templatesApi';
import { preferencesApi } from '../features/preferences/preferencesApi';
import onboardingReducer from './onboardingSlice';

export const store = configureStore({
  reducer: {
    onboarding: onboardingReducer,
    [authApi.reducerPath]: authApi.reducer,
    [workoutsApi.reducerPath]: workoutsApi.reducer,
    [templatesApi.reducerPath]: templatesApi.reducer,
    [preferencesApi.reducerPath]: preferencesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(
      authApi.middleware,
      workoutsApi.middleware,
      templatesApi.middleware,
      preferencesApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
