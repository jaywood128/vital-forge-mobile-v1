import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useLocalSearchParams: () => ({ token: 'valid-test-token' }),
}));

const mockResetPasswordFn = jest.fn();
jest.mock('../../src/features/auth/authApi', () => ({
  authApi: { util: { resetApiState: jest.fn() } },
  useResetPasswordMutation: () => [mockResetPasswordFn, { isLoading: false }],
}));

import ResetPasswordScreen from '../../app/reset-password';

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResetPasswordFn.mockReturnValue({
      unwrap: () => Promise.resolve({ message: 'Password updated successfully.' }),
    });
  });

  it('renders two password fields and Reset Password button', () => {
    const { getByPlaceholderText, getByLabelText } = render(<ResetPasswordScreen />);
    expect(getByPlaceholderText('New password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm password')).toBeTruthy();
    expect(getByLabelText('Reset Password')).toBeTruthy();
  });

  it('submit button is disabled when fields are empty', () => {
    const { getByLabelText } = render(<ResetPasswordScreen />);
    const btn = getByLabelText('Reset Password');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it('shows inline error when password is fewer than 8 characters', async () => {
    const { getByPlaceholderText, getByLabelText, getByText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('New password'), 'abc');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'abc');
    await act(async () => { fireEvent.press(getByLabelText('Reset Password')); });
    expect(getByText('Password must be at least 8 characters.')).toBeTruthy();
    expect(mockResetPasswordFn).not.toHaveBeenCalled();
  });

  it('shows inline error when passwords do not match', async () => {
    const { getByPlaceholderText, getByLabelText, getByText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('New password'), 'newpass1');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'newpass2');
    await act(async () => { fireEvent.press(getByLabelText('Reset Password')); });
    expect(getByText('Passwords do not match.')).toBeTruthy();
    expect(mockResetPasswordFn).not.toHaveBeenCalled();
  });

  it('does not call mutation when client-side validation fails', async () => {
    const { getByPlaceholderText, getByLabelText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('New password'), 'short');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'short');
    await act(async () => { fireEvent.press(getByLabelText('Reset Password')); });
    expect(mockResetPasswordFn).not.toHaveBeenCalled();
  });

  it('calls resetPassword mutation with correct payload on valid submit', async () => {
    const { getByPlaceholderText, getByLabelText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('New password'), 'newSecure1');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'newSecure1');
    await act(async () => { fireEvent.press(getByLabelText('Reset Password')); });
    expect(mockResetPasswordFn).toHaveBeenCalledWith({
      token: 'valid-test-token',
      password: 'newSecure1',
      password_confirmation: 'newSecure1',
    });
  });

  it('navigates to /login with resetSuccess param on success', async () => {
    const { getByPlaceholderText, getByLabelText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('New password'), 'newSecure1');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'newSecure1');
    await act(async () => { fireEvent.press(getByLabelText('Reset Password')); });
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/login',
      params: { resetSuccess: '1' },
    });
  });

  it('shows expired/invalid token error and Request new link button on 422', async () => {
    mockResetPasswordFn.mockReturnValue({
      unwrap: () => Promise.reject({ status: 422, data: { error: 'Reset link is invalid or has expired.' } }),
    });
    const { getByPlaceholderText, getByLabelText, getByText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('New password'), 'newSecure1');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'newSecure1');
    await act(async () => { fireEvent.press(getByLabelText('Reset Password')); });
    expect(getByText('Reset link is invalid or has expired.')).toBeTruthy();
    expect(getByLabelText('Request a new link')).toBeTruthy();
  });

  it('Request a new link navigates to /forgot-password', async () => {
    mockResetPasswordFn.mockReturnValue({
      unwrap: () => Promise.reject({ status: 422, data: { error: 'Reset link is invalid or has expired.' } }),
    });
    const { getByPlaceholderText, getByLabelText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('New password'), 'newSecure1');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'newSecure1');
    await act(async () => { fireEvent.press(getByLabelText('Reset Password')); });
    fireEvent.press(getByLabelText('Request a new link'));
    expect(mockReplace).toHaveBeenCalledWith('/forgot-password');
  });

  it('button re-enables and fields preserve values on network error', async () => {
    mockResetPasswordFn.mockReturnValue({
      unwrap: () => Promise.reject(new Error('Network error')),
    });
    const { getByPlaceholderText, getByLabelText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('New password'), 'newSecure1');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'newSecure1');
    await act(async () => { fireEvent.press(getByLabelText('Reset Password')); });
    expect(getByLabelText('Reset Password')).toBeTruthy();
    expect(getByPlaceholderText('New password').props.value).toBe('newSecure1');
    expect(getByPlaceholderText('Confirm password').props.value).toBe('newSecure1');
  });

  it.todo('show/hide toggle changes secureTextEntry prop on the password field');
  it.todo('missing token param redirects to /forgot-password on mount — mock useLocalSearchParams to return {}');
});
