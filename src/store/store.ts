import { configureStore } from '@reduxjs/toolkit';
import onboardingReducer from './onboardingSlice';
import { authApi } from '../features/auth/authApi';
import { preferencesApi } from '../features/preferences/preferencesApi';
import { workoutsApi } from '../features/workouts/workoutsApi';
import { exerciseSetsApi } from '../features/workouts/exerciseSetsApi';
import { templatesApi } from '../features/templates/templatesApi';
import { goalsApi } from '../features/goals/goalsApi';
import { userPreferenceApi } from '../features/userPreference/userPreferenceApi';
import onboardingReducer from './onboardingSlice';

export const store = configureStore({
  reducer: {
    onboarding: onboardingReducer,
    [authApi.reducerPath]: authApi.reducer,
    [workoutsApi.reducerPath]: workoutsApi.reducer,
    [exerciseSetsApi.reducerPath]: exerciseSetsApi.reducer,
    [templatesApi.reducerPath]: templatesApi.reducer,
    [goalsApi.reducerPath]: goalsApi.reducer,
    [userPreferenceApi.reducerPath]: userPreferenceApi.reducer,
    [preferencesApi.reducerPath]: preferencesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(authApi.middleware, workoutsApi.middleware, exerciseSetsApi.middleware, templatesApi.middleware, goalsApi.middleware, userPreferenceApi.middleware, preferencesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
