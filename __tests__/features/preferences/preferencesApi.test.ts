import { configureStore } from '@reduxjs/toolkit';
import { preferencesApi } from '../../../src/features/preferences/preferencesApi';

// Mock the baseQuery so no real HTTP calls are made
jest.mock('../../../src/lib/api/baseQuery', () => ({
  baseQuery: jest.fn(),
}));

import { baseQuery } from '../../../src/lib/api/baseQuery';
const mockBaseQuery = baseQuery as jest.Mock;

function makeStore() {
  return configureStore({
    reducer: { [preferencesApi.reducerPath]: preferencesApi.reducer },
    middleware: (getDefault) => getDefault().concat(preferencesApi.middleware),
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
  created_at: '2026-02-24T00:00:00Z',
  updated_at: '2026-02-24T00:00:00Z',
};

// RTK Query schedules subscription cleanup via setTimeout after each dispatch.
// Fake timers prevent those callbacks from firing after Jest tears down the environment.
beforeAll(() => jest.useFakeTimers());
afterAll(() => jest.useRealTimers());

beforeEach(() => {
  jest.clearAllMocks();
});

describe('preferencesApi', () => {
  describe('createUserPreference', () => {
    it('sends a POST to /api/v1/user_preference with user_preference body', async () => {
      mockBaseQuery.mockResolvedValueOnce({ data: { data: mockPreference } });
      const store = makeStore();

      await store.dispatch(
        preferencesApi.endpoints.createUserPreference.initiate({
          primary_goal: 'physique',
          training_days_per_week: 4,
          experience_level: 'Intermediate',
        })
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
        undefined
      );
    });

    it('returns the UserPreference data from the response', async () => {
      mockBaseQuery.mockResolvedValueOnce({ data: { data: mockPreference } });
      const store = makeStore();

      const result = await store.dispatch(
        preferencesApi.endpoints.createUserPreference.initiate({
          primary_goal: 'physique',
          training_days_per_week: 4,
        })
      );

      expect((result as any).data).toEqual(mockPreference);
    });

    it('works with only required fields (no experience_level)', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        data: { data: { ...mockPreference, experience_level: null } },
      });
      const store = makeStore();

      await store.dispatch(
        preferencesApi.endpoints.createUserPreference.initiate({
          primary_goal: 'strength',
          training_days_per_week: 5,
        })
      );

      expect(mockBaseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { user_preference: { primary_goal: 'strength', training_days_per_week: 5 } },
        }),
        expect.anything(),
        undefined
      );
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
        preferencesApi.endpoints.createUserPreference.initiate({
          primary_goal: 'physique',
          training_days_per_week: 4,
        })
      );

      expect((result as any).error).toBeDefined();
      expect((result as any).data).toBeUndefined();
    });

    it('updateUserPreference sends only the provided partial fields in the PATCH body', async () => {
      mockBaseQuery.mockResolvedValueOnce({ data: { data: mockPreference } });
      const store = makeStore();

      await store.dispatch(
        preferencesApi.endpoints.updateUserPreference.initiate({ training_days_per_week: 6 })
      );

      expect(mockBaseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/v1/user_preference',
          method: 'PATCH',
          body: { user_preference: { training_days_per_week: 6 } },
        }),
        expect.anything(),
        undefined
      );
    });
  });

  describe('getUserPreference', () => {
    it('sends a GET to /api/v1/user_preference', async () => {
      mockBaseQuery.mockResolvedValueOnce({ data: { data: mockPreference } });
      const store = makeStore();

      await store.dispatch(
        preferencesApi.endpoints.getUserPreference.initiate()
      );

      expect(mockBaseQuery).toHaveBeenCalledWith(
        '/api/v1/user_preference',
        expect.anything(),
        undefined
      );
    });

    it('unwraps the data field from the API response', async () => {
      mockBaseQuery.mockResolvedValueOnce({ data: { data: mockPreference } });
      const store = makeStore();

      const result = await store.dispatch(
        preferencesApi.endpoints.getUserPreference.initiate()
      );

      expect((result as any).data).toEqual(mockPreference);
    });
  });
});
