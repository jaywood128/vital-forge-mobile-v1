import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseGetWorkoutsQuery = jest.fn();
jest.mock('../../src/features/workouts/workoutsApi', () => ({
  useGetWorkoutsQuery: () => mockUseGetWorkoutsQuery(),
}));

import HistoryScreen from '../../app/history';

const makeWorkout = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Push Day',
  completed: true,
  started_at: '2026-05-14T09:00:00Z',
  completed_at: '2026-05-14T10:00:00Z',
  workout_date: '2026-05-14',
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HistoryScreen', () => {
  it('renders loading indicator when isLoading is true', () => {
    mockUseGetWorkoutsQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { getByTestId, UNSAFE_getByType } = render(<HistoryScreen />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders a card for each completed workout', () => {
    const workouts = [makeWorkout({ id: 1, name: 'Push Day' }), makeWorkout({ id: 2, name: 'Pull Day' })];
    mockUseGetWorkoutsQuery.mockReturnValue({ data: workouts, isLoading: false, isError: false });
    const { getByText } = render(<HistoryScreen />);
    expect(getByText('Push Day')).toBeTruthy();
    expect(getByText('Pull Day')).toBeTruthy();
  });

  it('shows exercise count and sets logged on each card', () => {
    mockUseGetWorkoutsQuery.mockReturnValue({ data: [makeWorkout()], isLoading: false, isError: false });
    const { getByText } = render(<HistoryScreen />);
    expect(getByText('1 exercises')).toBeTruthy();
    expect(getByText('2 sets logged')).toBeTruthy();
  });

  it('navigates to workout-detail with the correct id when a card is tapped', () => {
    mockUseGetWorkoutsQuery.mockReturnValue({ data: [makeWorkout({ id: 7 })], isLoading: false, isError: false });
    const { getByText } = render(<HistoryScreen />);
    fireEvent.press(getByText('Push Day'));
    expect(mockPush).toHaveBeenCalledWith('/workout-detail?id=7');
  });

  it('shows the empty state message when no completed workouts exist', () => {
    mockUseGetWorkoutsQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
    const { getByText } = render(<HistoryScreen />);
    expect(getByText('No workouts yet. Start your first session!')).toBeTruthy();
  });

  it.todo(
    // Scenario: API call fails (isError: true)
    // Expected: Alert.alert is called with an error message
    // Key assertion: spy on Alert.alert, render with isError: true, verify it was called
    'shows an alert when the API call fails'
  );

  it.todo(
    // Scenario: data contains a mix of completed: true and completed: false workouts
    // Expected: only completed workouts appear in the FlatList; incomplete ones are filtered out
    // Key assertion: render with mixed data, verify the incomplete workout name is NOT in the output
    'filters out non-completed workouts from the list'
  );
});
