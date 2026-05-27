import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../lib/api/baseQuery';

// Existing lightweight types — used by getWorkouts and home.tsx; do not rename
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

// Full nested types for the active workout screen
export type ExerciseSet = {
  id: number;
  set_number: number;
  reps: number | null;
  weight: number | null;
  weight_unit: string | null;
  rpe: number | null; // returned by backend; not sent in LogSetPayload (RPE deferred to backlog)
  to_failure: boolean;
  notes: string | null;
  completed: boolean;
};

export type WorkoutExerciseDetail = {
  id: number;
  order_position: number;
  notes: string | null;
  rest_between_sets: number | null;
  completed: boolean;
  exercise: {
    id: number;
    name: string;
    muscle_group: string | null;
    equipment: string | null;
    exercise_type: string | null;
  };
  exercise_sets: ExerciseSet[];
};

export type WorkoutDetail = {
  id: number;
  name: string;
  completed: boolean;
  started_at: string | null;
  completed_at: string | null;
  workout_date: string;
  workout_template_id: number | null;
  workout_exercises: WorkoutExerciseDetail[];
};

export type LogSetPayload = {
  id: number;
  weight: number | null;
  reps: number;
  completed: true;
};

export const workoutsApi = createApi({
  reducerPath: 'workoutsApi',
  baseQuery,
  tagTypes: ['Workouts', 'ActiveWorkout'],
  endpoints: (builder) => ({
    logSet: builder.mutation<{ exercise_set: ExerciseSet }, LogSetPayload>({
      query: ({ id, ...body }) => ({
        url: `/api/v1/exercise_sets/${id}`,
        method: 'PATCH',
        body: { exercise_set: body },
      }),
      invalidatesTags: ['Workouts'],
    }),
    startWorkout: builder.mutation<{ workout: Workout }, { templateId: number; day_number: number }>({
      query: ({ templateId, day_number }) => ({
        url: `/api/v1/workout_templates/${templateId}/start`,
        method: 'POST',
        body: { day_number },
      }),
      invalidatesTags: ['Workouts', 'ActiveWorkout'],
    }),
    getWorkout: builder.query<WorkoutDetail, number>({
      query: (id) => `/api/v1/workouts/${id}`,
      transformResponse: (response: { data: WorkoutDetail }) => response.data,
      providesTags: (_result, _err, id) => [{ type: 'ActiveWorkout', id }],
    }),
    completeWorkout: builder.mutation<{ workout: Workout }, number>({
      query: (workoutId) => ({
        url: `/api/v1/workouts/${workoutId}/complete`,
        method: 'PATCH',
      }),
      async onQueryStarted(workoutId, { dispatch, queryFulfilled }) {
        // Optimistically mark completed in both caches so UI updates before the refetch resolves:
        // - workouts list: home card flips to "Next Up" immediately
        // - workout detail: redirect effect fires before the screen becomes interactive
        const patchList = dispatch(
          workoutsApi.util.updateQueryData('getWorkouts', undefined, (draft) => {
            const w = draft.find((w) => w.id === workoutId);
            if (w) w.completed = true;
          })
        );
        const patchDetail = dispatch(
          workoutsApi.util.updateQueryData('getWorkout', workoutId, (draft) => {
            draft.completed = true;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchList.undo();
          patchDetail.undo();
        }
      },
      invalidatesTags: ['Workouts', 'ActiveWorkout'],
    }),
    getWorkouts: builder.query<WorkoutDetail[], void>({
      query: () => '/api/v1/workouts',
      transformResponse: (response: { data: WorkoutDetail[] }) => response.data,
      providesTags: ['Workouts'],
    }),
  }),
});

export const {
  useLogSetMutation,
  useStartWorkoutMutation,
  useGetWorkoutQuery,
  useCompleteWorkoutMutation,
  useGetWorkoutsQuery,
} = workoutsApi;
