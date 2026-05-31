import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../lib/api/baseQuery';

export type PrimaryGoal = 'physique' | 'strength';
export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

const PRIMARY_GOALS = ['physique', 'strength', 'cardiovascular'] as const;
export function isPrimaryGoal(value: string): value is PrimaryGoal {
  return (PRIMARY_GOALS as readonly string[]).includes(value);
}

export type UserPreference = {
  id: number;
  user_id: number;
  primary_goal: PrimaryGoal | null;
  training_days_per_week: number | null;
  preferred_workout_duration: number | null;
  experience_level: ExperienceLevel | null;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  selected_workout_template_id: number | null;
  selected_workout_template_name: string | null;
  created_at: string;
  updated_at: string;
};

type UserPreferenceResponse = {
  data: UserPreference;
};

type CreatePreferenceParams = {
  primary_goal: PrimaryGoal;
  training_days_per_week: number;
  experience_level: ExperienceLevel;
};

type UpdatePreferenceParams = {
  selected_workout_template_id?: number;
};

export const userPreferenceApi = createApi({
  reducerPath: 'userPreferenceApi',
  baseQuery,
  tagTypes: ['UserPreference'],
  endpoints: (builder) => ({
    createPreference: builder.mutation<UserPreference, CreatePreferenceParams>({
      query: (params) => ({
        url: '/api/v1/user_preference',
        method: 'POST',
        body: { user_preference: params },
      }),
      transformResponse: (response: UserPreferenceResponse) => response.data,
      invalidatesTags: ['UserPreference'],
    }),
    updatePreference: builder.mutation<UserPreference, UpdatePreferenceParams>({
      query: (params) => ({
        url: '/api/v1/user_preference',
        method: 'PATCH',
        body: { user_preference: params },
      }),
      transformResponse: (response: UserPreferenceResponse) => response.data,
      invalidatesTags: ['UserPreference'],
    }),
    getPreference: builder.query<UserPreference, void>({
      query: () => '/api/v1/user_preference',
      transformResponse: (response: UserPreferenceResponse) => response.data,
      providesTags: ['UserPreference'],
    }),
  }),
});

export const { useCreatePreferenceMutation, useUpdatePreferenceMutation, useGetPreferenceQuery } = userPreferenceApi;
