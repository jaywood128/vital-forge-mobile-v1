import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ id: '42' }),
}));

const mockUseGetWorkoutQuery = jest.fn();
jest.mock('../../src/features/workouts/workoutsApi', () => ({
  useGetWorkoutQuery: () => mockUseGetWorkoutQuery(),
  useGetPersonalRecordsQuery: () => ({ data: [] }),
}));

import WorkoutDetailScreen from '../../app/workout-detail';

const baseWorkout = {
  id: 42,
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
      ],
    },
    {
      id: 11,
      order_position: 2,
      notes: null,
      rest_between_sets: 60,
      completed: true,
      exercise: {
        id: 2,
        name: 'Push-up',
        muscle_group: 'Chest',
        equipment: 'Bodyweight',
        exercise_type: 'bodyweight',
      },
      exercise_sets: [
        { id: 101, set_number: 1, reps: 15, weight: null, weight_unit: null, rpe: null, to_failure: false, notes: null, completed: true },
      ],
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('WorkoutDetailScreen', () => {
  it('renders workout name and formatted date in the header', () => {
    mockUseGetWorkoutQuery.mockReturnValue({ data: baseWorkout, isLoading: false, isError: false });
    const { getByText } = render(<WorkoutDetailScreen />);
    expect(getByText('Push Day')).toBeTruthy();
    expect(getByText('Thu, May 14, 2026')).toBeTruthy();
  });

  it('renders each exercise name and its muscle group chip', () => {
    mockUseGetWorkoutQuery.mockReturnValue({ data: baseWorkout, isLoading: false, isError: false });
    const { getAllByText, getByText } = render(<WorkoutDetailScreen />);
    expect(getByText('Bench Press')).toBeTruthy();
    expect(getByText('Push-up')).toBeTruthy();
    expect(getAllByText('Chest').length).toBeGreaterThanOrEqual(2);
  });

  it('shows weighted set as "weight × reps" format', () => {
    mockUseGetWorkoutQuery.mockReturnValue({ data: baseWorkout, isLoading: false, isError: false });
    const { getByText } = render(<WorkoutDetailScreen />);
    expect(getByText('185 × 8')).toBeTruthy();
  });

  it('shows bodyweight set as "reps reps" format', () => {
    mockUseGetWorkoutQuery.mockReturnValue({ data: baseWorkout, isLoading: false, isError: false });
    const { getByText } = render(<WorkoutDetailScreen />);
    expect(getByText('15 reps')).toBeTruthy();
  });

  it('renders loading indicator when isLoading is true', () => {
    mockUseGetWorkoutQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { UNSAFE_getByType } = render(<WorkoutDetailScreen />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it.todo(
    // Scenario: user presses the back button (the "‹ History" row)
    // Expected: router.back() is called exactly once
    // Key assertion: mock useRouter, render screen with valid data, fireEvent.press on the back row, assert mockBack was called
    'calls router.back() when the back button is pressed'
  );

  it.todo(
    // Scenario: useGetWorkoutQuery returns isError: true (e.g. 404)
    // Expected: error message is shown and a "Go back" button is visible
    // Key assertion: render with isError: true, verify error text and a pressable "Go back" element are present
    'shows error state with a go-back button when the API call fails'
  );
});
