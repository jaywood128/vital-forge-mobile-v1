import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../lib/api/baseQuery';
import type { ExerciseSet } from './workoutsApi';

export type LogSetPayload = {
  id: number;
  weight: number;
  reps: number;
  completed: true;
};

export const exerciseSetsApi = createApi({
  reducerPath: 'exerciseSetsApi',
  baseQuery,
  endpoints: (builder) => ({
    logSet: builder.mutation<{ exercise_set: ExerciseSet }, LogSetPayload>({
      query: ({ id, ...body }) => ({
        url: `/api/v1/exercise_sets/${id}`,
        method: 'PATCH',
        body: { exercise_set: body },
      }),
    }),
  }),
});

export const { useLogSetMutation } = exerciseSetsApi;
