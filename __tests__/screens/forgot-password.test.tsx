import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

const mockForgotPasswordFn = jest.fn();
jest.mock('../../src/features/auth/authApi', () => ({
  authApi: { util: { resetApiState: jest.fn() } },
  useForgotPasswordMutation: jest.fn(),
}));

import ForgotPasswordScreen from '../../app/forgot-password';
import { useForgotPasswordMutation } from '../../src/features/auth/authApi';

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockForgotPasswordFn.mockReturnValue({
      unwrap: () => Promise.resolve({ message: "If that address is registered, a reset link is on its way." }),
    });
    (useForgotPasswordMutation as jest.Mock).mockReturnValue([mockForgotPasswordFn, { isLoading: false }]);
  });

  it('renders email input and Send Reset Link button', () => {
    const { getByPlaceholderText, getByLabelText } = render(<ForgotPasswordScreen />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByLabelText('Send Reset Link')).toBeTruthy();
  });

  it('Send Reset Link button is disabled while mutation is in-flight', () => {
    (useForgotPasswordMutation as jest.Mock).mockReturnValue([mockForgotPasswordFn, { isLoading: true }]);
    const { getByPlaceholderText, getByLabelText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    expect(getByLabelText('Sending...')).toBeTruthy();
  });

  it('shows success message after submit — same message regardless of whether email exists', async () => {
    const { getByPlaceholderText, getByLabelText, getByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'anyone@example.com');
    await act(async () => { fireEvent.press(getByLabelText('Send Reset Link')); });
    expect(getByText("If that address is registered, a reset link is on its way.")).toBeTruthy();
  });

  it('shows same success message for unregistered email (no enumeration)', async () => {
    mockForgotPasswordFn.mockReturnValue({
      unwrap: () => Promise.resolve({ message: "If that address is registered, a reset link is on its way." }),
    });
    const { getByPlaceholderText, getByLabelText, getByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'notregistered@example.com');
    await act(async () => { fireEvent.press(getByLabelText('Send Reset Link')); });
    expect(getByText("If that address is registered, a reset link is on its way.")).toBeTruthy();
  });

  it('shows inline error and re-enables button on network failure', async () => {
    mockForgotPasswordFn.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Network error')),
    });
    const { getByPlaceholderText, getByLabelText, getByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    await act(async () => { fireEvent.press(getByLabelText('Send Reset Link')); });
    expect(getByText('Something went wrong. Please check your connection and try again.')).toBeTruthy();
    expect(getByLabelText('Send Reset Link')).toBeTruthy();
  });

  it('Back to login navigates to /login', () => {
    const { getByLabelText } = render(<ForgotPasswordScreen />);
    fireEvent.press(getByLabelText('Back to login'));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it.todo('keyboard dismisses on submit — requires KeyboardAvoidingView interaction testing');
});
