import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

const mockTrigger = jest.fn();
jest.mock('../../src/features/workouts/workoutsApi', () => ({
  useLazyGetWorkoutsPageQuery: () => [mockTrigger, { isFetching: false }],
}));

import HistoryScreen from '../../app/history';

const makeWorkout = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Push Day',
  completed: true,
  started_at: '2026-05-14T09:00:00Z',
  completed_at: '2026-05-14T10:00:00Z',
  duration_minutes: 60,
  workout_date: '2026-05-14',
  workout_type: 'Strength',
  workout_template_id: 1,
  workout_exercises: [
    {
      id: 10,
      order_position: 1,
      notes: null,
      rest_between_sets: 90,
      completed: true,
      exercise: {
        id: 1,
        name: 'Bench Press',
        muscle_group: 'Chest',
        equipment: 'Barbell',
        exercise_type: 'weighted',
      },
      exercise_sets: [
        { id: 100, set_number: 1, reps: 8, weight: 185, weight_unit: 'lbs', rpe: null, to_failure: false, notes: null, completed: true },
        { id: 101, set_number: 2, reps: 8, weight: 185, weight_unit: 'lbs', rpe: null, to_failure: false, notes: null, completed: true },
      ],
    },
  ],
  ...overrides,
});

const pageResult = (workouts: ReturnType<typeof makeWorkout>[], hasMore = false) => ({
  unwrap: () => Promise.resolve({
    data: workouts,
    meta: { has_more: hasMore, next_cursor: null },
  }),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HistoryScreen', () => {
  it('renders loading indicator on initial load', () => {
    // Never resolves — keeps initialLoading: true
    mockTrigger.mockReturnValue({ unwrap: () => new Promise(() => {}) });
    const { UNSAFE_getByType } = render(<HistoryScreen />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders a card for each completed workout', async () => {
    const workouts = [makeWorkout({ id: 1, name: 'Push Day' }), makeWorkout({ id: 2, name: 'Pull Day' })];
    mockTrigger.mockReturnValue(pageResult(workouts));
    const { getByText } = render(<HistoryScreen />);
    await act(async () => {});
    expect(getByText('Push Day')).toBeTruthy();
    expect(getByText('Pull Day')).toBeTruthy();
  });

  it('shows exercise count and sets on each card', async () => {
    mockTrigger.mockReturnValue(pageResult([makeWorkout()]));
    const { getByText } = render(<HistoryScreen />);
    await act(async () => {});
    expect(getByText(/1 exercise/)).toBeTruthy();
    expect(getByText(/2 sets/)).toBeTruthy();
  });

  it('navigates to workout-detail with the correct id when a card is tapped', async () => {
    mockTrigger.mockReturnValue(pageResult([makeWorkout({ id: 7 })]));
    const { getByText } = render(<HistoryScreen />);
    await act(async () => {});
    fireEvent.press(getByText('Push Day'));
    expect(mockPush).toHaveBeenCalledWith('/workout-detail?id=7');
  });

  it('shows the empty state message when no completed workouts exist', async () => {
    mockTrigger.mockReturnValue(pageResult([]));
    const { getByText } = render(<HistoryScreen />);
    await act(async () => {});
    expect(getByText('No workouts yet. Start your first session!')).toBeTruthy();
  });

  it.todo(
    // Scenario: API call throws (trigger rejects)
    // Expected: Alert.alert is called with an error message
    // Key assertion: mock trigger to reject, render, verify Alert.alert was called
    'shows an alert when the API call fails'
  );

  it.todo(
    // Scenario: backend already filters completed=true so all returned workouts are completed
    // The screen no longer does client-side filtering — this is enforced server-side via the paginated endpoint
    'filters out non-completed workouts from the list'
  );
});
