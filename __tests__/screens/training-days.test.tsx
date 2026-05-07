import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useLocalSearchParams: () => ({ goal: 'physique' }),
}));

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: ({ children, ...props }: any) => <View {...props}>{children}</View> };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View> };
});

import TrainingDaysScreen from '../../app/training-days';

describe('TrainingDaysScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders all four day options', () => {
    const { getByLabelText } = render(<TrainingDaysScreen />);
    expect(getByLabelText('3 days per week')).toBeTruthy();
    expect(getByLabelText('4 days per week')).toBeTruthy();
    expect(getByLabelText('5 days per week')).toBeTruthy();
    expect(getByLabelText('6 days per week')).toBeTruthy();
  });

  it('navigates to /experience-level with goal and days as string', () => {
    const { getByLabelText } = render(<TrainingDaysScreen />);
    fireEvent.press(getByLabelText('4 days per week'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/experience-level',
      params: { goal: 'physique', days: '4' },
    });
  });

  it('passes days as a string (not a number) in params', () => {
    const { getByLabelText } = render(<TrainingDaysScreen />);
    fireEvent.press(getByLabelText('6 days per week'));
    const params = mockPush.mock.calls[0][0].params;
    expect(typeof params.days).toBe('string');
    expect(params.days).toBe('6');
  });

  it('forwards the goal param received from goal-selection', () => {
    const { getByLabelText } = render(<TrainingDaysScreen />);
    fireEvent.press(getByLabelText('3 days per week'));
    expect(mockPush.mock.calls[0][0].params.goal).toBe('physique');
  });

  it('calls router.back when the back button is pressed', () => {
    const { getByLabelText } = render(<TrainingDaysScreen />);
    fireEvent.press(getByLabelText('Go back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
