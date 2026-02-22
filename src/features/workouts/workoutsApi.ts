import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../lib/api/baseQuery';

export const workoutsApi = createApi({
  reducerPath: 'workoutsApi',
  baseQuery,
  tagTypes: ['Workouts', 'ActiveWorkout'],
  endpoints: (builder) => ({
    // Start workout from template
    startWorkout: builder.mutation<any, { workout_template_id: number }>({
      query: (body) => ({
        url: '/api/v1/workouts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Workouts', 'ActiveWorkout'],
    }),
    // Log a set
    logSet: builder.mutation<
      any,
      { workoutId: number; workout_exercise_id: number; set_number: number; weight: number; reps: number }
    >({
      query: ({ workoutId, ...body }) => ({
        url: `/api/v1/workouts/${workoutId}/sets`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ActiveWorkout'],
    }),
    // Complete workout
    completeWorkout: builder.mutation<any, number>({
      query: (workoutId) => ({
        url: `/api/v1/workouts/${workoutId}/finish`,
        method: 'POST',
      }),
      invalidatesTags: ['Workouts', 'ActiveWorkout'],
    }),
    // Get workout history
    getWorkouts: builder.query<any[], void>({
      query: () => '/api/v1/workouts',
      providesTags: ['Workouts'],
    }),
  }),
});

export const {
  useStartWorkoutMutation,
  useLogSetMutation,
  useCompleteWorkoutMutation,
  useGetWorkoutsQuery,
} = workoutsApi;
