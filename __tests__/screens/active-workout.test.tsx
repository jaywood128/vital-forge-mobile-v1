import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert, ActivityIndicator } from 'react-native';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({ workoutId: '42', dayName: 'Pull Day' }),
  useFocusEffect: jest.fn(),
}));

const mockUseGetWorkoutQuery = jest.fn();
const mockCompleteWorkoutFn = jest.fn();
jest.mock('../../src/features/workouts/workoutsApi', () => ({
  useGetWorkoutQuery: () => mockUseGetWorkoutQuery(),
  useCompleteWorkoutMutation: () => [mockCompleteWorkoutFn, { isLoading: false }],
}));

const mockLogSetFn = jest.fn();
jest.mock('../../src/features/workouts/exerciseSetsApi', () => ({
  useLogSetMutation: () => [mockLogSetFn],
}));

import ActiveWorkoutScreen from '../../app/active-workout';

const baseSet = {
  id: 1,
  set_number: 1,
  reps: 10,
  weight: null,
  weight_unit: 'lbs',
  rpe: null,
  to_failure: false,
  notes: null,
  completed: false,
};

const baseWorkout = {
  id: 42,
  name: 'Workout A',
  completed: false,
  started_at: '2026-05-08T10:00:00Z',
  completed_at: null,
  workout_date: '2026-05-08',
  workout_template_id: 1,
  workout_exercises: [
    {
      id: 100,
      order_position: 1,
      notes: null,
      rest_between_sets: 90,
      completed: false,
      exercise: {
        id: 5,
        name: 'Bench Press',
        muscle_group: 'Chest',
        equipment: 'Barbell',
        exercise_type: 'compound',
      },
      exercise_sets: [baseSet],
    },
  ],
};

const bodyweightWorkout = {
  ...baseWorkout,
  workout_exercises: [
    {
      ...baseWorkout.workout_exercises[0],
      exercise: {
        ...baseWorkout.workout_exercises[0].exercise,
        equipment: 'Bodyweight',
      },
    },
  ],
};

const makeAllSetsCompleted = () => ({
  ...baseWorkout,
  workout_exercises: baseWorkout.workout_exercises.map((we) => ({
    ...we,
    exercise_sets: we.exercise_sets.map((s) => ({ ...s, completed: true, weight: 100, reps: 10 })),
  })),
});

describe('ActiveWorkoutScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetWorkoutQuery.mockReturnValue({
      data: baseWorkout,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockCompleteWorkoutFn.mockReturnValue({
      unwrap: () => Promise.resolve({ workout: { ...baseWorkout, completed: true } }),
    });
    mockLogSetFn.mockReturnValue({
      unwrap: () => Promise.resolve({ exercise_set: { ...baseSet, completed: true, weight: 100, reps: 10 } }),
      abort: jest.fn(),
    });
  });

  it('shows ActivityIndicator while workout fetch is in-flight', () => {
    mockUseGetWorkoutQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: jest.fn() });
    const { UNSAFE_getAllByType } = render(<ActiveWorkoutScreen />);
    expect(UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  });

  it('shows full-screen error with retry button on fetch failure', () => {
    const mockRefetch = jest.fn();
    mockUseGetWorkoutQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: mockRefetch });
    const { getByText } = render(<ActiveWorkoutScreen />);
    expect(getByText('Failed to load workout. Please try again.')).toBeTruthy();
    fireEvent.press(getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders exercise names and set rows after successful load', () => {
    const { getByText } = render(<ActiveWorkoutScreen />);
    expect(getByText('Bench Press')).toBeTruthy();
    expect(getByText('Set 1')).toBeTruthy();
    expect(getByText('Pull Day')).toBeTruthy();
  });

  it('redirects to /home if fetched workout is already completed', () => {
    mockUseGetWorkoutQuery.mockReturnValue({
      data: { ...baseWorkout, completed: true },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<ActiveWorkoutScreen />);
    expect(mockReplace).toHaveBeenCalledWith('/home');
  });

  it('Log button calls logSet with correct payload', async () => {
    const { getByLabelText, getByText } = render(<ActiveWorkoutScreen />);
    fireEvent.changeText(getByLabelText('Weight for set 1'), '100');
    await act(async () => {
      fireEvent.press(getByLabelText('Log set'));
    });
    expect(mockLogSetFn).toHaveBeenCalledWith({ id: 1, weight: 100, reps: 10, completed: true });
  });

  it('Log button is disabled while save is in-flight', () => {
    mockLogSetFn.mockReturnValue({ unwrap: () => new Promise(() => {}), abort: jest.fn() });
    const { getByLabelText, getByText } = render(<ActiveWorkoutScreen />);
    fireEvent.changeText(getByLabelText('Weight for set 1'), '100');
    act(() => {
      fireEvent.press(getByLabelText('Log set'));
    });
    expect(getByLabelText('Saving...')).toBeTruthy();
  });

  it('Log button re-enables after save failure', async () => {
    mockLogSetFn.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Network error')),
      abort: jest.fn(),
    });
    const { getByLabelText, getByText } = render(<ActiveWorkoutScreen />);
    fireEvent.changeText(getByLabelText('Weight for set 1'), '100');
    await act(async () => {
      fireEvent.press(getByLabelText('Log set'));
    });
    expect(getByLabelText('Log set')).toBeTruthy();
  });

  it('set row shows static values with logged badge after successful save', async () => {
    const { getByLabelText, getByText } = render(<ActiveWorkoutScreen />);
    fireEvent.changeText(getByLabelText('Weight for set 1'), '100');
    await act(async () => {
      fireEvent.press(getByLabelText('Log set'));
    });
    expect(getByText('100 lbs × 10 reps')).toBeTruthy();
    expect(getByText('✓')).toBeTruthy();
  });

  it('shows inline error on the set row after save failure, values preserved', async () => {
    mockLogSetFn.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Network error')),
      abort: jest.fn(),
    });
    const { getByLabelText, getByText } = render(<ActiveWorkoutScreen />);
    fireEvent.changeText(getByLabelText('Weight for set 1'), '80');
    await act(async () => {
      fireEvent.press(getByLabelText('Log set'));
    });
    expect(getByText('Failed to save set. Tap Log to retry.')).toBeTruthy();
    expect(getByLabelText('Weight for set 1').props.value).toBe('80');
  });

  it('tapping a logged row re-enters edit mode with pre-filled values', async () => {
    const { getByLabelText, getByText } = render(<ActiveWorkoutScreen />);
    fireEvent.changeText(getByLabelText('Weight for set 1'), '100');
    await act(async () => {
      fireEvent.press(getByLabelText('Log set'));
    });
    await act(async () => {
      fireEvent.press(getByLabelText('Set 1 logged. Tap to edit.'));
    });
    expect(getByLabelText('Log set')).toBeTruthy();
  });

  it('input values survive re-render (state held at screen level)', () => {
    const { getByLabelText, rerender } = render(<ActiveWorkoutScreen />);
    fireEvent.changeText(getByLabelText('Weight for set 1'), '135');
    rerender(<ActiveWorkoutScreen />);
    expect(getByLabelText('Weight for set 1').props.value).toBe('135');
  });

  it('Finish Workout with all sets logged calls complete mutation without confirmation', async () => {
    mockUseGetWorkoutQuery.mockReturnValue({ data: makeAllSetsCompleted(), isLoading: false, isError: false, refetch: jest.fn() });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<ActiveWorkoutScreen />);
    await act(async () => {
      fireEvent.press(getByText('Finish Workout'));
    });
    expect(alertSpy).not.toHaveBeenCalledWith('End workout early?', expect.any(String), expect.any(Array));
    expect(mockCompleteWorkoutFn).toHaveBeenCalled();
  });

  it('Finish Workout with partial sets shows confirmation prompt', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<ActiveWorkoutScreen />);
    await act(async () => {
      fireEvent.press(getByText('Finish Workout'));
    });
    expect(alertSpy).toHaveBeenCalledWith('End workout early?', expect.any(String), expect.any(Array));
  });

  it('Finish Workout success navigates to /home', async () => {
    mockUseGetWorkoutQuery.mockReturnValue({ data: makeAllSetsCompleted(), isLoading: false, isError: false, refetch: jest.fn() });
    const { getByText } = render(<ActiveWorkoutScreen />);
    await act(async () => {
      fireEvent.press(getByText('Finish Workout'));
    });
    expect(mockReplace).toHaveBeenCalledWith('/home');
  });

  it('Finish Workout failure shows Alert and user stays on screen', async () => {
    mockUseGetWorkoutQuery.mockReturnValue({ data: makeAllSetsCompleted(), isLoading: false, isError: false, refetch: jest.fn() });
    mockCompleteWorkoutFn.mockReturnValue({ unwrap: () => Promise.reject(new Error('Server error')) });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<ActiveWorkoutScreen />);
    await act(async () => {
      fireEvent.press(getByText('Finish Workout'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Could not finish workout', expect.any(String), expect.any(Array));
    expect(mockReplace).not.toHaveBeenCalledWith('/home');
  });

  it('bodyweight set: Log button calls logSet with weight null when weight left blank', async () => {
    mockUseGetWorkoutQuery.mockReturnValue({
      data: bodyweightWorkout,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const { getByText, getByLabelText } = render(<ActiveWorkoutScreen />);
    await act(async () => {
      fireEvent.press(getByLabelText('Log set'));
    });
    expect(mockLogSetFn).toHaveBeenCalledWith({ id: 1, weight: null, reps: 10, completed: true });
  });

  it('bodyweight set logged with no extra weight shows reps only', async () => {
    mockUseGetWorkoutQuery.mockReturnValue({
      data: bodyweightWorkout,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const { getByText, queryByText, getByLabelText } = render(<ActiveWorkoutScreen />);
    await act(async () => {
      fireEvent.press(getByLabelText('Log set'));
    });
    expect(getByText('10 reps')).toBeTruthy();
    expect(getByText('✓')).toBeTruthy();
    expect(queryByText(/lbs/)).toBeNull();
  });

  it('resume path shows previously logged sets in green logged state', () => {
    const resumeWorkout = {
      ...baseWorkout,
      workout_exercises: baseWorkout.workout_exercises.map((we) => ({
        ...we,
        exercise_sets: we.exercise_sets.map((s) => ({ ...s, completed: true, weight: 95, reps: 8 })),
      })),
    };
    mockUseGetWorkoutQuery.mockReturnValue({ data: resumeWorkout, isLoading: false, isError: false, refetch: jest.fn() });
    const { getByText } = render(<ActiveWorkoutScreen />);
    expect(getByText('95 lbs × 8 reps')).toBeTruthy();
    expect(getByText('✓')).toBeTruthy();
  });

  it('tapping a resumed API-logged set re-enters edit mode', async () => {
    const resumeWorkout = {
      ...baseWorkout,
      workout_exercises: baseWorkout.workout_exercises.map((we) => ({
        ...we,
        exercise_sets: we.exercise_sets.map((s) => ({ ...s, completed: true, weight: 95, reps: 8 })),
      })),
    };
    mockUseGetWorkoutQuery.mockReturnValue({ data: resumeWorkout, isLoading: false, isError: false, refetch: jest.fn() });
    const { getByText, getByLabelText } = render(<ActiveWorkoutScreen />);
    expect(getByText('95 lbs × 8 reps')).toBeTruthy();
    await act(async () => {
      fireEvent.press(getByLabelText('Set 1 logged. Tap to edit.'));
    });
    expect(getByLabelText('Log set')).toBeTruthy();
  });

  it('resumed bodyweight set (weight null) shows as locked', () => {
    const resumeBodyweightWorkout = {
      ...bodyweightWorkout,
      workout_exercises: bodyweightWorkout.workout_exercises.map((we) => ({
        ...we,
        exercise_sets: we.exercise_sets.map((s) => ({ ...s, completed: true, weight: null, reps: 12 })),
      })),
    };
    mockUseGetWorkoutQuery.mockReturnValue({ data: resumeBodyweightWorkout, isLoading: false, isError: false, refetch: jest.fn() });
    const { getByText } = render(<ActiveWorkoutScreen />);
    expect(getByText('12 reps')).toBeTruthy();
    expect(getByText('✓')).toBeTruthy();
  });
});
