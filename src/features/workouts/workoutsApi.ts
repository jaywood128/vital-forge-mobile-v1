import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../lib/api/baseQuery';

export type WorkoutExercise = {
  id: number;
  exercise_id: number;
  order_position: number;
  completed: boolean;
  notes: string | null;
};

export type Workout = {
  id: number;
  name: string;
  completed: boolean;
  started_at: string | null;
  workout_date: string;
  workout_template_id: number | null;
  workout_exercises: WorkoutExercise[];
};

export const workoutsApi = createApi({
  reducerPath: 'workoutsApi',
  baseQuery,
  tagTypes: ['Workouts', 'ActiveWorkout'],
  endpoints: (builder) => ({
    // Start workout from template for a specific day
    startWorkout: builder.mutation<{ workout: Workout }, { templateId: number; day_number: number }>({
      query: ({ templateId, day_number }) => ({
        url: `/api/v1/workout_templates/${templateId}/start`,
        method: 'POST',
        body: { day_number },
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
        url: `/api/v1/workouts/${workoutId}/complete`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Workouts', 'ActiveWorkout'],
    }),
    // Get workout history
    getWorkouts: builder.query<Workout[], void>({
      query: () => '/api/v1/workouts',
      transformResponse: (response: { data: Workout[] }) => response.data,
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
