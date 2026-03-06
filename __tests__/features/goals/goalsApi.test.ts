/**
 * Tests for goalsApi RTK Query slice.
 *
 * RTK Query uses internal timers for subscription cleanup. Using fake timers
 * prevents those callbacks from firing after the Jest environment is torn down,
 * avoiding "ReferenceError: You are trying to import a file after the Jest
 * environment has been torn down" noise. --forceExit in the test script cleans up.
 */

import { configureStore } from '@reduxjs/toolkit';
import { goalsApi, type FitnessGoal } from '../../../src/features/goals/goalsApi';

jest.useFakeTimers();

// Mock the shared baseQuery so tests never make real HTTP requests.
const mockBaseQuery = jest.fn();
jest.mock('../../../src/lib/api/baseQuery', () => ({
  baseQuery: (...args: unknown[]) => mockBaseQuery(...args),
}));

function buildStore() {
  return configureStore({
    reducer: { [goalsApi.reducerPath]: goalsApi.reducer },
    middleware: (getDefault) => getDefault().concat(goalsApi.middleware),
  });
}

describe('goalsApi — setGoal mutation', () => {
  beforeEach(() => {
    mockBaseQuery.mockReset();
  });

  it('sends POST to /api/v1/mobile/goal with the correct body', async () => {
    mockBaseQuery.mockResolvedValue({ data: { data: { fitness_goal: 'build_muscle' } } });
    const store = buildStore();

    await store
      .dispatch(goalsApi.endpoints.setGoal.initiate({ fitness_goal: 'build_muscle' }))
      .unwrap();

    const [calledArg] = mockBaseQuery.mock.calls[0];
    expect(calledArg).toMatchObject({
      url: '/api/v1/mobile/goal',
      method: 'POST',
      body: { goal: { fitness_goal: 'build_muscle' } },
    });
  });

  it('unwraps transformResponse — returns data.fitness_goal directly', async () => {
    const goal: FitnessGoal = 'lose_fat';
    mockBaseQuery.mockResolvedValue({ data: { data: { fitness_goal: goal } } });
    const store = buildStore();

    const result = await store
      .dispatch(goalsApi.endpoints.setGoal.initiate({ fitness_goal: goal }))
      .unwrap();

    expect(result.fitness_goal).toBe('lose_fat');
  });

  it('works for all four valid goal values', async () => {
    const goals: FitnessGoal[] = ['build_muscle', 'lose_fat', 'get_stronger', 'general_fitness'];

    for (const goal of goals) {
      mockBaseQuery.mockResolvedValue({ data: { data: { fitness_goal: goal } } });
      const store = buildStore();

      const result = await store
        .dispatch(goalsApi.endpoints.setGoal.initiate({ fitness_goal: goal }))
        .unwrap();

      expect(result.fitness_goal).toBe(goal);
    }
  });

  it('propagates a 422 error from the server without throwing on the store level', async () => {
    mockBaseQuery.mockResolvedValue({
      error: { status: 422, data: { error: 'Invalid goal' } },
    });
    const store = buildStore();

    await expect(
      store
        .dispatch(goalsApi.endpoints.setGoal.initiate({ fitness_goal: 'build_muscle' }))
        .unwrap(),
    ).rejects.toMatchObject({ status: 422 });
  });
});

describe('goalsApi — getGoal query', () => {
  beforeEach(() => {
    mockBaseQuery.mockReset();
  });

  it('sends GET to /api/v1/mobile/goal', async () => {
    mockBaseQuery.mockResolvedValue({ data: { data: { fitness_goal: 'get_stronger' } } });
    const store = buildStore();

    await store.dispatch(goalsApi.endpoints.getGoal.initiate()).unwrap();

    expect(mockBaseQuery.mock.calls[0][0]).toBe('/api/v1/mobile/goal');
  });

  it('returns null fitness_goal when the user has no goal set', async () => {
    mockBaseQuery.mockResolvedValue({ data: { data: { fitness_goal: null } } });
    const store = buildStore();

    const result = await store.dispatch(goalsApi.endpoints.getGoal.initiate()).unwrap();

    expect(result.fitness_goal).toBeNull();
  });

  it('invalidates the Goal tag after setGoal — cache is refreshed', async () => {
    mockBaseQuery.mockResolvedValue({ data: { data: { fitness_goal: 'get_stronger' } } });
    const store = buildStore();

    // Initiate and hold the subscription open (do not call .unsubscribe()) so
    // RTK Query sees an active subscriber and will re-fetch on tag invalidation.
    const getSubscription = store.dispatch(goalsApi.endpoints.getGoal.initiate());
    await getSubscription;
    expect(mockBaseQuery.mock.calls).toHaveLength(1); // sanity: one GET issued

    // setGoal invalidates the 'Goal' tag; because a subscription is active,
    // RTK Query should immediately dispatch a re-fetch GET.
    mockBaseQuery.mockResolvedValue({ data: { data: { fitness_goal: 'build_muscle' } } });
    await store
      .dispatch(goalsApi.endpoints.setGoal.initiate({ fitness_goal: 'build_muscle' }))
      .unwrap();

    // Flush pending microtasks so the re-fetch can settle.
    await Promise.resolve();

    // Calls: GET (initial) + POST (setGoal) + GET (re-fetch after invalidation)
    expect(mockBaseQuery.mock.calls.length).toBeGreaterThanOrEqual(3);
    const lastArg = mockBaseQuery.mock.calls[mockBaseQuery.mock.calls.length - 1][0];
    expect(lastArg).toBe('/api/v1/mobile/goal');
  });
});
