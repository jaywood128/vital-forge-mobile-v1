import { configureStore } from '@reduxjs/toolkit';
import { userPreferenceApi } from '../../../src/features/userPreference/userPreferenceApi';

jest.useFakeTimers();

jest.mock('../../../src/lib/api/baseQuery', () => ({
  baseQuery: jest.fn(),
}));

import { baseQuery } from '../../../src/lib/api/baseQuery';
const mockBaseQuery = baseQuery as jest.Mock;

function makeStore() {
  return configureStore({
    reducer: { [userPreferenceApi.reducerPath]: userPreferenceApi.reducer },
    middleware: (getDefault) => getDefault().concat(userPreferenceApi.middleware),
  });
}

const mockPreference = {
  id: 1,
  user_id: 42,
  primary_goal: 'physique' as const,
  training_days_per_week: 4,
  experience_level: 'Intermediate' as const,
  preferred_workout_duration: 45,
  onboarding_completed: true,
  onboarding_completed_at: '2026-02-24T00:00:00Z',
  selected_workout_template_id: null,
  selected_workout_template_name: null,
  created_at: '2026-02-24T00:00:00Z',
  updated_at: '2026-02-24T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('userPreferenceApi', () => {
  describe('createPreference', () => {
    it('sends POST to /api/v1/user_preference with user_preference body', async () => {
      mockBaseQuery.mockResolvedValueOnce({ data: { data: mockPreference } });
      const store = makeStore();

      await store.dispatch(
        userPreferenceApi.endpoints.createPreference.initiate({
          primary_goal: 'physique',
          training_days_per_week: 4,
          experience_level: 'Intermediate',
        }),
      );

      expect(mockBaseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/v1/user_preference',
          method: 'POST',
          body: {
            user_preference: {
              primary_goal: 'physique',
              training_days_per_week: 4,
              experience_level: 'Intermediate',
            },
          },
        }),
        expect.anything(),
        undefined,
      );
    });

    it('unwraps the data envelope from the response', async () => {
      mockBaseQuery.mockResolvedValueOnce({ data: { data: mockPreference } });
      const store = makeStore();

      const result = await store.dispatch(
        userPreferenceApi.endpoints.createPreference.initiate({
          primary_goal: 'physique',
          training_days_per_week: 4,
          experience_level: 'Intermediate',
        }),
      );

      expect((result as any).data).toEqual(mockPreference);
    });

    it('returns an error result when the API responds with 422', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: {
          status: 422,
          data: { errors: { primary_goal: ['is not included in the list'] } },
        },
      });
      const store = makeStore();

      const result = await store.dispatch(
        userPreferenceApi.endpoints.createPreference.initiate({
          primary_goal: 'physique',
          training_days_per_week: 4,
          experience_level: 'Beginner',
        }),
      );

      expect((result as any).error).toBeDefined();
      expect((result as any).data).toBeUndefined();
    });
  });

  describe('updatePreference', () => {
    it('sends PATCH to /api/v1/user_preference with only the provided fields', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        data: { data: { ...mockPreference, selected_workout_template_id: 7, selected_workout_template_name: 'PPL' } },
      });
      const store = makeStore();

      await store.dispatch(
        userPreferenceApi.endpoints.updatePreference.initiate({
          selected_workout_template_id: 7,
        }),
      );

      expect(mockBaseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PATCH',
          body: { user_preference: { selected_workout_template_id: 7 } },
        }),
        expect.anything(),
        undefined,
      );
    });

    it('returns updated preference with template info in the response', async () => {
      const updated = { ...mockPreference, selected_workout_template_id: 7, selected_workout_template_name: 'PPL' };
      mockBaseQuery.mockResolvedValueOnce({ data: { data: updated } });
      const store = makeStore();

      const result = await store.dispatch(
        userPreferenceApi.endpoints.updatePreference.initiate({ selected_workout_template_id: 7 }),
      );

      expect((result as any).data?.selected_workout_template_id).toBe(7);
      expect((result as any).data?.selected_workout_template_name).toBe('PPL');
    });
  });

  describe('getPreference', () => {
    it('sends GET to /api/v1/user_preference', async () => {
      mockBaseQuery.mockResolvedValueOnce({ data: { data: mockPreference } });
      const store = makeStore();

      await store.dispatch(userPreferenceApi.endpoints.getPreference.initiate());

      expect(mockBaseQuery).toHaveBeenCalledWith(
        '/api/v1/user_preference',
        expect.anything(),
        undefined,
      );
    });

    it('unwraps the data envelope and returns the preference object', async () => {
      mockBaseQuery.mockResolvedValueOnce({ data: { data: mockPreference } });
      const store = makeStore();

      const result = await store.dispatch(userPreferenceApi.endpoints.getPreference.initiate());

      expect((result as any).data).toEqual(mockPreference);
    });
  });
});
