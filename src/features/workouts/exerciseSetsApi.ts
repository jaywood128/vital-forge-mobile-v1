import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../../lib/api/baseQuery';

// logSet has moved to workoutsApi (same slice as getWorkouts so invalidatesTags works cross-query).
// This slice is kept registered in the store so resetApiState() in home.tsx clears it on logout.
export const exerciseSetsApi = createApi({
  reducerPath: 'exerciseSetsApi',
  baseQuery,
  endpoints: () => ({}),
});
