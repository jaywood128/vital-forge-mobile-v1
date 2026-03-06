import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../lib/api/baseQuery';

export type FitnessGoal = 'build_muscle' | 'lose_fat' | 'get_stronger' | 'general_fitness';

type GoalData = {
  fitness_goal: FitnessGoal | null;
};

type GoalResponse = {
  data: GoalData;
};

export const goalsApi = createApi({
  reducerPath: 'goalsApi',
  baseQuery,
  tagTypes: ['Goal'],
  endpoints: (builder) => ({
    setGoal: builder.mutation<GoalData, { fitness_goal: FitnessGoal }>({
      query: (body) => ({
        url: '/api/v1/mobile/goal',
        method: 'POST',
        body: { goal: body },
      }),
      transformResponse: (response: GoalResponse) => response.data,
      invalidatesTags: ['Goal'],
    }),
    getGoal: builder.query<GoalData, void>({
      query: () => '/api/v1/mobile/goal',
      transformResponse: (response: GoalResponse) => response.data,
      providesTags: ['Goal'],
    }),
  }),
});

export const { useSetGoalMutation, useGetGoalQuery } = goalsApi;
