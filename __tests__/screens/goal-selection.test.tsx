import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: ({ children, ...props }: any) => <View {...props}>{children}</View> };
});

import GoalSelectionScreen from '../../app/goal-selection';

describe('GoalSelectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both goal cards', () => {
    const { getByText } = render(<GoalSelectionScreen />);
    expect(getByText('Build Muscle')).toBeTruthy();
    expect(getByText('Get Stronger')).toBeTruthy();
  });

  it('navigates to /training-days with physique when Build Muscle is tapped', () => {
    const { getByText } = render(<GoalSelectionScreen />);
    fireEvent.press(getByText('Build Muscle'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/training-days',
      params: { goal: 'physique' },
    });
  });

  it('navigates to /training-days with strength when Get Stronger is tapped', () => {
    const { getByText } = render(<GoalSelectionScreen />);
    fireEvent.press(getByText('Get Stronger'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/training-days',
      params: { goal: 'strength' },
    });
  });

  it('makes no API call — goal selection only navigates', () => {
    const { getByText } = render(<GoalSelectionScreen />);
    fireEvent.press(getByText('Build Muscle'));
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('renders correctly on re-mount (back navigation scenario)', () => {
    const first = render(<GoalSelectionScreen />);
    first.unmount();
    const { getByText } = render(<GoalSelectionScreen />);
    expect(getByText('Build Muscle')).toBeTruthy();
    expect(getByText('Get Stronger')).toBeTruthy();
  });
});
