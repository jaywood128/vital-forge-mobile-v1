import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useLocalSearchParams: () => ({ goal: 'physique', days: '4' }),
}));

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: ({ children, ...props }: any) => <View {...props}>{children}</View> };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View> };
});

const mockCreatePreference = jest.fn();
const mockUseCreatePreferenceMutation = jest.fn();

jest.mock('../../src/features/userPreference/userPreferenceApi', () => ({
  ...jest.requireActual('../../src/features/userPreference/userPreferenceApi'),
  useCreatePreferenceMutation: (...args: any[]) => mockUseCreatePreferenceMutation(...args),
}));

import ExperienceLevelScreen from '../../app/experience-level';

describe('ExperienceLevelScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCreatePreferenceMutation.mockReturnValue([mockCreatePreference, { isLoading: false }]);
  });

  it('renders all three experience levels', () => {
    const { getByText } = render(<ExperienceLevelScreen />);
    expect(getByText('Beginner')).toBeTruthy();
    expect(getByText('Intermediate')).toBeTruthy();
    expect(getByText('Advanced')).toBeTruthy();
  });

  it('calls createPreference with the correct params when a level is tapped', async () => {
    mockCreatePreference.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    const { getByText } = render(<ExperienceLevelScreen />);

    await act(async () => {
      fireEvent.press(getByText('Intermediate'));
    });

    expect(mockCreatePreference).toHaveBeenCalledWith({
      primary_goal: 'physique',
      training_days_per_week: 4,
      experience_level: 'Intermediate',
    });
  });

  it('converts the days param string to a number when calling createPreference', async () => {
    mockCreatePreference.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    const { getByText } = render(<ExperienceLevelScreen />);

    await act(async () => {
      fireEvent.press(getByText('Beginner'));
    });

    const call = mockCreatePreference.mock.calls[0][0];
    expect(typeof call.training_days_per_week).toBe('number');
    expect(call.training_days_per_week).toBe(4);
  });

  it('navigates to /template-preview with goal, days and level after selection', async () => {
    mockCreatePreference.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    const { getByText } = render(<ExperienceLevelScreen />);

    await act(async () => {
      fireEvent.press(getByText('Advanced'));
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/template-preview',
        params: { goal: 'physique', days: '4', level: 'Advanced' },
      });
    });
  });

  it('still navigates to /template-preview even when the API call fails', async () => {
    mockCreatePreference.mockReturnValue({
      unwrap: () => Promise.reject(new Error('network error')),
    });
    const { getByText } = render(<ExperienceLevelScreen />);

    await act(async () => {
      fireEvent.press(getByText('Beginner'));
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/template-preview' }),
      );
    });
  });

  it('calls router.back when the back button is pressed', () => {
    const { getByLabelText } = render(<ExperienceLevelScreen />);
    fireEvent.press(getByLabelText('Go back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
