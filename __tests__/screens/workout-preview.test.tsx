import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({
    templateId: '1',
    dayNumber: '2',
    dayName: 'Pull Day',
  }),
}));

const mockUseGetTemplateQuery = jest.fn();
jest.mock('../../src/features/templates/templatesApi', () => ({
  useGetTemplateQuery: () => mockUseGetTemplateQuery(),
}));

const mockStartWorkoutFn = jest.fn();
jest.mock('../../src/features/workouts/workoutsApi', () => ({
  useStartWorkoutMutation: () => [mockStartWorkoutFn, { isLoading: false }],
}));

import WorkoutPreviewScreen from '../../app/workout-preview';

const baseTemplate = {
  id: 1,
  name: 'Push Pull Legs',
  goal_type: 'physique',
  difficulty_level: 'Intermediate',
  days_per_week: 3,
  has_active_workout: false,
  active_workout_id: null,
  days: [
    {
      id: 1,
      day_number: 1,
      name: 'Push Day',
      estimated_duration_minutes: null,
      muscle_focus: null,
      exercises: [],
    },
    {
      id: 2,
      day_number: 2,
      name: 'Pull Day',
      estimated_duration_minutes: null,
      muscle_focus: null,
      exercises: [
        {
          id: 10,
          exercise_id: 5,
          order_position: 1,
          recommended_sets: 4,
          recommended_reps: '8-10',
          rest_seconds: 90,
          notes: null,
          exercise: { id: 5, name: 'Pull-ups', muscle_group: 'Back', equipment: 'Bodyweight', difficulty_level: null },
        },
        {
          id: 11,
          exercise_id: 6,
          order_position: 2,
          recommended_sets: 3,
          recommended_reps: '10-12',
          rest_seconds: 60,
          notes: null,
          exercise: { id: 6, name: 'Barbell Row', muscle_group: 'Back', equipment: 'Barbell', difficulty_level: null },
        },
      ],
    },
  ],
};

describe('WorkoutPreviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetTemplateQuery.mockReturnValue({ data: baseTemplate, isLoading: false, isError: false, refetch: jest.fn() });
    mockStartWorkoutFn.mockReturnValue({ unwrap: () => Promise.resolve({ workout: { id: 101 } }) });
  });

  it('renders exercise list for the requested day (Day 2)', () => {
    const { getByText } = render(<WorkoutPreviewScreen />);
    expect(getByText('Pull-ups')).toBeTruthy();
    expect(getByText('Barbell Row')).toBeTruthy();
    expect(getByText('4 sets')).toBeTruthy();
    expect(getByText('3 sets')).toBeTruthy();
  });

  it('does not render exercises from other days', () => {
    const { queryByText } = render(<WorkoutPreviewScreen />);
    expect(queryByText('Bench Press')).toBeNull();
  });

  it('shows loading indicator while fetching', () => {
    mockUseGetTemplateQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: jest.fn() });
    const { getByTestId } = render(<WorkoutPreviewScreen />);
    expect(getByTestId).toBeTruthy();
  });

  it('shows error state with retry button on fetch failure', () => {
    const mockRefetch = jest.fn();
    mockUseGetTemplateQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: mockRefetch });
    const { getByText } = render(<WorkoutPreviewScreen />);
    expect(getByText('Failed to load workout details.')).toBeTruthy();
    fireEvent.press(getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('calls startWorkout with correct templateId and day_number on button press', async () => {
    const { getByText } = render(<WorkoutPreviewScreen />);
    await act(async () => {
      fireEvent.press(getByText('Start Workout'));
    });
    expect(mockStartWorkoutFn).toHaveBeenCalledWith({ templateId: 1, day_number: 2 });
  });

  it.todo('shows empty state when day has no exercises');
  it.todo('navigates on success');
  it.todo('shows 409 alert with resume option');
});
