import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useFocusEffect: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(),
}));

const mockDispatch = jest.fn();

const mockUseGetCurrentUserQuery = jest.fn();
jest.mock('../../src/features/auth/authApi', () => ({
  useGetCurrentUserQuery: () => mockUseGetCurrentUserQuery(),
  useLogoutMutation: () => [jest.fn().mockReturnValue({ unwrap: () => Promise.resolve() }), { isLoading: false }],
}));

const mockUseGetPreferenceQuery = jest.fn();
jest.mock('../../src/features/userPreference/userPreferenceApi', () => ({
  useGetPreferenceQuery: () => mockUseGetPreferenceQuery(),
}));

const mockUseGetTemplateQuery = jest.fn();
jest.mock('../../src/features/templates/templatesApi', () => ({
  useGetTemplateQuery: () => mockUseGetTemplateQuery(),
}));

const mockUseGetWorkoutsQuery = jest.fn();
jest.mock('../../src/features/workouts/workoutsApi', () => ({
  useGetWorkoutsQuery: () => mockUseGetWorkoutsQuery(),
}));

import HomeScreen from '../../app/home';

const baseUser = { first_name: 'Test', email: 'test@example.com' };
const basePreference = {
  selected_workout_template_id: 1,
  selected_workout_template_name: 'Push Pull Legs',
  primary_goal: 'physique',
  training_days_per_week: 3,
  experience_level: 'Intermediate',
  onboarding_completed: true,
};

const baseTemplate = {
  id: 1,
  name: 'Push Pull Legs',
  goal_type: 'physique',
  difficulty_level: 'Intermediate',
  days_per_week: 3,
  has_active_workout: false,
  active_workout_id: null,
  days: [
    { id: 1, day_number: 1, name: 'Push Day', exercises: [] },
    { id: 2, day_number: 2, name: 'Pull Day', exercises: [] },
    { id: 3, day_number: 3, name: 'Legs Day', exercises: [] },
  ],
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(require('react-redux'), 'useDispatch').mockReturnValue(mockDispatch);
    mockUseGetCurrentUserQuery.mockReturnValue({ data: baseUser, isLoading: false });
    mockUseGetPreferenceQuery.mockReturnValue({ data: basePreference });
    mockUseGetTemplateQuery.mockReturnValue({ data: baseTemplate });
    mockUseGetWorkoutsQuery.mockReturnValue({ data: [] });
  });

  it('shows time-aware greeting with first name', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText(/Test\./)).toBeTruthy();
  });

  it('shows weekly stat line', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText(/this week|No workouts/)).toBeTruthy();
  });

  it('shows "Next Up: Day 1 — Push Day" when no workouts completed on a 3-day programme', () => {
    mockUseGetWorkoutsQuery.mockReturnValue({ data: [] });
    const { getByText } = render(<HomeScreen />);
    expect(getByText(/Next Up: Day 1 — Push Day/)).toBeTruthy();
  });

  it('shows "Next Up: Day 2 — Pull Day" when 1 workout completed on 3-day programme', () => {
    mockUseGetWorkoutsQuery.mockReturnValue({
      data: [{ id: 10, completed: true, workout_template_id: 1, workout_exercises: [] }],
    });
    const { getByText } = render(<HomeScreen />);
    expect(getByText(/Next Up: Day 2 — Pull Day/)).toBeTruthy();
  });

  it('shows "Next Up: Day 1" after completing all 3 days (rollover)', () => {
    mockUseGetWorkoutsQuery.mockReturnValue({
      data: [
        { id: 10, completed: true, workout_template_id: 1, workout_exercises: [] },
        { id: 11, completed: true, workout_template_id: 1, workout_exercises: [] },
        { id: 12, completed: true, workout_template_id: 1, workout_exercises: [] },
      ],
    });
    const { getByText } = render(<HomeScreen />);
    expect(getByText(/Next Up: Day 1/)).toBeTruthy();
  });

  it('CTA button shows "Start Day 1" when no active workout', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText(/Start Day 1/)).toBeTruthy();
  });

  it('shows "In Progress" label when active workout exists', () => {
    mockUseGetTemplateQuery.mockReturnValue({
      data: { ...baseTemplate, has_active_workout: true, active_workout_id: 99 },
    });
    mockUseGetWorkoutsQuery.mockReturnValue({
      data: [{ id: 99, completed: false, started_at: null, workout_template_id: 1, workout_exercises: [] }],
    });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('In Progress')).toBeTruthy();
  });

  it('CTA button shows "Resume Workout" when active workout exists', () => {
    mockUseGetTemplateQuery.mockReturnValue({
      data: { ...baseTemplate, has_active_workout: true, active_workout_id: 99 },
    });
    mockUseGetWorkoutsQuery.mockReturnValue({
      data: [{ id: 99, completed: false, started_at: null, workout_template_id: 1, workout_exercises: [] }],
    });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Resume Workout')).toBeTruthy();
  });

  it('no programme card shown when no programme selected', () => {
    mockUseGetPreferenceQuery.mockReturnValue({
      data: { ...basePreference, selected_workout_template_id: null, selected_workout_template_name: null },
    });
    const { queryByText } = render(<HomeScreen />);
    expect(queryByText(/Start Day/)).toBeNull();
    expect(queryByText('Resume Workout')).toBeNull();
  });

  it.todo('navigates to /workout-preview with correct dayNumber on CTA press');

  it('tapping Resume Workout CTA navigates to /active-workout with the in-progress workout id', () => {
    mockUseGetTemplateQuery.mockReturnValue({
      data: { ...baseTemplate, has_active_workout: true, active_workout_id: 99 },
    });
    mockUseGetWorkoutsQuery.mockReturnValue({
      data: [{ id: 99, name: 'Pull Day', completed: false, started_at: null, workout_template_id: 1, workout_exercises: [] }],
    });
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Resume Workout'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/active-workout',
      params: { workoutId: '99', dayName: 'Pull Day' },
    });
  });

  it('Workout History row is visible and navigates to /history', () => {
    const { getByLabelText } = render(<HomeScreen />);
    fireEvent.press(getByLabelText('View workout history'));
    expect(mockPush).toHaveBeenCalledWith('/history');
  });

  it('Log out link is visible at the bottom', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Log out')).toBeTruthy();
  });
});
