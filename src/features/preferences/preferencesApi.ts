import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../lib/api/baseQuery';
import type { GoalType, DifficultyLevel } from '../../store/onboardingSlice';

export type UserPreference = {
  id: number;
  user_id: number;
  primary_goal: GoalType | null;
  training_days_per_week: number | null;
  experience_level: DifficultyLevel | null;
  preferred_workout_duration: number | null;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type CreatePreferenceBody = {
  primary_goal?: GoalType;
  training_days_per_week?: number;
  experience_level?: DifficultyLevel;
  preferred_workout_duration?: number;
};

type UserPreferenceResponse = {
  data: UserPreference;
};

export const preferencesApi = createApi({
  reducerPath: 'preferencesApi',
  baseQuery,
  tagTypes: ['UserPreference'],
  endpoints: (builder) => ({
    createUserPreference: builder.mutation<UserPreference, CreatePreferenceBody>({
      query: (body) => ({
        url: '/api/v1/user_preference',
        method: 'POST',
        body: { user_preference: body },
      }),
      transformResponse: (response: UserPreferenceResponse) => response.data,
      invalidatesTags: ['UserPreference'],
    }),
    getUserPreference: builder.query<UserPreference, void>({
      query: () => '/api/v1/user_preference',
      transformResponse: (response: UserPreferenceResponse) => response.data,
      providesTags: ['UserPreference'],
    }),
    updateUserPreference: builder.mutation<UserPreference, Partial<CreatePreferenceBody>>({
      query: (body) => ({
        url: '/api/v1/user_preference',
        method: 'PATCH',
        body: { user_preference: body },
      }),
      transformResponse: (response: UserPreferenceResponse) => response.data,
      invalidatesTags: ['UserPreference'],
    }),
  }),
});

export const {
  useCreateUserPreferenceMutation,
  useGetUserPreferenceQuery,
  useUpdateUserPreferenceMutation,
} = preferencesApi;
