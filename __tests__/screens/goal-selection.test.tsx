/**
 * Tests for the GoalSelectionScreen component.
 *
 * Strategy: mock the RTK Query hooks directly instead of mocking baseQuery.
 * This avoids the need to configure a real Redux store in component tests.
 * RTK Query hooks return { unwrap: () => Promise } — use mockReturnValue, not
 * mockResolvedValue, because .unwrap() is called synchronously on the returned object.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

// --- mock expo-router ---
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

// --- mock expo-linear-gradient (not available in Jest env) ---
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: ({ children, ...props }: any) => <View {...props}>{children}</View> };
});

// --- mock goalsApi hooks ---
// Using an intermediate jest.fn() lets individual tests override isLoading per-test
// via mockUseSetGoalMutation.mockReturnValue([mockSetGoalFn, { isLoading: true }]).
const mockSetGoalFn = jest.fn();
const mockUseSetGoalMutation = jest.fn();
jest.mock('../../src/features/goals/goalsApi', () => ({
  ...jest.requireActual('../../src/features/goals/goalsApi'),
  useSetGoalMutation: (...args: any[]) => mockUseSetGoalMutation(...args),
}));

import GoalSelectionScreen from '../../app/goal-selection';

describe('GoalSelectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: not loading, ready for a new mutation.
    mockUseSetGoalMutation.mockReturnValue([mockSetGoalFn, { isLoading: false }]);
  });

  it('renders all four goal cards', () => {
    const { getByText } = render(<GoalSelectionScreen />);

    expect(getByText('Build Muscle')).toBeTruthy();
    expect(getByText('Lose Fat')).toBeTruthy();
    expect(getByText('Get Stronger')).toBeTruthy();
    expect(getByText('General Fitness')).toBeTruthy();
  });

  it('renders the Skip for now option', () => {
    const { getByText } = render(<GoalSelectionScreen />);
    expect(getByText('Skip for now')).toBeTruthy();
  });

  it('calls setGoal with correct fitness_goal when a card is tapped', async () => {
    mockSetGoalFn.mockReturnValue({ unwrap: () => Promise.resolve({ fitness_goal: 'build_muscle' }) });
    const { getByText } = render(<GoalSelectionScreen />);

    await act(async () => {
      fireEvent.press(getByText('Build Muscle'));
    });

    expect(mockSetGoalFn).toHaveBeenCalledWith({ fitness_goal: 'build_muscle' });
  });

  it('navigates to /home after selecting a goal', async () => {
    mockSetGoalFn.mockReturnValue({ unwrap: () => Promise.resolve({ fitness_goal: 'lose_fat' }) });
    const { getByText } = render(<GoalSelectionScreen />);

    await act(async () => {
      fireEvent.press(getByText('Lose Fat'));
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/home');
    });
  });

  it('navigates to /home when Skip is tapped without calling setGoal', async () => {
    const { getByText } = render(<GoalSelectionScreen />);

    fireEvent.press(getByText('Skip for now'));

    expect(mockSetGoalFn).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/home');
  });

  it('still navigates to /home even when setGoal API call fails', async () => {
    // The goal save is non-blocking: a network failure must NOT trap the user
    // on this screen. They should always reach /home.
    mockSetGoalFn.mockReturnValue({ unwrap: () => Promise.reject(new Error('network error')) });
    const { getByText } = render(<GoalSelectionScreen />);

    await act(async () => {
      fireEvent.press(getByText('Get Stronger'));
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/home');
    });
  });

  it('ignores taps on goal cards while a request is in-flight (isLoading: true)', () => {
    // Simulate a request already in-flight: the component receives isLoading: true,
    // so all goal card presses should be no-ops.
    mockUseSetGoalMutation.mockReturnValue([mockSetGoalFn, { isLoading: true }]);
    const { getByText } = render(<GoalSelectionScreen />);

    fireEvent.press(getByText('General Fitness'));

    expect(mockSetGoalFn).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders correctly on re-mount (back navigation scenario)', () => {
    // Simulate returning to the screen via back navigation by unmounting then
    // mounting a fresh instance. All options must be present on every mount.
    const first = render(<GoalSelectionScreen />);
    first.unmount();

    const { getByText } = render(<GoalSelectionScreen />);
    expect(getByText('Build Muscle')).toBeTruthy();
    expect(getByText('Lose Fat')).toBeTruthy();
    expect(getByText('Get Stronger')).toBeTruthy();
    expect(getByText('General Fitness')).toBeTruthy();
    expect(getByText('Skip for now')).toBeTruthy();
  });
});
