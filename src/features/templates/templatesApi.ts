import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../lib/api/baseQuery';
import { type PrimaryGoal, type ExperienceLevel } from '../userPreference/userPreferenceApi';

export type WorkoutTemplate = {
  id: number;
  name: string;
  description: string;
  goal_type: PrimaryGoal;
  difficulty_level: ExperienceLevel;
  days_per_week: number;
  estimated_duration_minutes: number;
  total_exercises: number;
  source: string;
};

export type TemplateExercise = {
  id: number;
  order_position: number;
  recommended_sets: number;
  recommended_reps: string;
  rest_seconds: number;
  notes: string | null;
  exercise: {
    id: number;
    name: string;
    muscle_group: string;
    equipment: string;
    difficulty_level: string;
  };
};

export type WorkoutTemplateDetail = WorkoutTemplate & {
  exercises: TemplateExercise[];
};

type TemplatesResponse = { data: WorkoutTemplate[] };
type TemplateDetailResponse = { data: WorkoutTemplateDetail };

export const templatesApi = createApi({
  reducerPath: 'templatesApi',
  baseQuery,
  tagTypes: ['Templates'],
  endpoints: (builder) => ({
    getTemplates: builder.query<WorkoutTemplate[], void>({
      query: () => '/api/v1/workout_templates',
      transformResponse: (response: TemplatesResponse) => response.data,
      providesTags: ['Templates'],
    }),
    getTemplate: builder.query<WorkoutTemplateDetail, number>({
      query: (id) => `/api/v1/workout_templates/${id}`,
      transformResponse: (response: TemplateDetailResponse) => response.data,
      providesTags: ['Templates'],
    }),
  }),
});

export const { useGetTemplatesQuery, useGetTemplateQuery } = templatesApi;
