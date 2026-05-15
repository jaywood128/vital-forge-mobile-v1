import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SignupScreen from '../../app/signup';
import onboardingReducer, { setGoalType, setTrainingDays } from '../../src/store/onboardingSlice';
import { authApi } from '../../src/features/auth/authApi';
import { preferencesApi } from '../../src/features/preferences/preferencesApi';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace, push: mockRouterPush }),
}));

const mockSetItemAsync = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-secure-store', () => ({
  setItemAsync: (...args: any[]) => mockSetItemAsync(...args),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children,
}));

// Mock RTK Query hooks directly — simpler and more reliable than mocking baseQuery
const mockSignupFn = jest.fn();
const mockCreatePrefFn = jest.fn();

jest.mock('../../src/features/auth/authApi', () => ({
  ...jest.requireActual('../../src/features/auth/authApi'),
  useSignupMutation: () => [mockSignupFn, { isLoading: false }],
}));

jest.mock('../../src/features/preferences/preferencesApi', () => ({
  ...jest.requireActual('../../src/features/preferences/preferencesApi'),
  useCreateUserPreferenceMutation: () => [mockCreatePrefFn, {}],
}));

// ─── Store & Render ───────────────────────────────────────────────────────────

function makeStore(preloaded?: Partial<ReturnType<typeof onboardingReducer>>) {
  return configureStore({
    reducer: {
      onboarding: onboardingReducer,
      [authApi.reducerPath]: authApi.reducer,
      [preferencesApi.reducerPath]: preferencesApi.reducer,
    },
    preloadedState: preloaded
      ? { onboarding: { goal_type: null, training_days_per_week: null, experience_level: null, selected_template_id: null, ...preloaded } }
      : undefined,
    middleware: (get) => get().concat(authApi.middleware, preferencesApi.middleware),
  });
}

function renderSignup(store = makeStore()) {
  return { store, ...render(<Provider store={store}><SignupScreen /></Provider>) };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fillAndSubmit(queries: ReturnType<typeof renderSignup>) {
  const { getByPlaceholderText, getByText } = queries;
  fireEvent.changeText(getByPlaceholderText('First Name'), 'John');
  fireEvent.changeText(getByPlaceholderText('Last Name'), 'Doe');
  fireEvent.changeText(getByPlaceholderText('Email'), 'john@example.com');
  fireEvent.changeText(getByPlaceholderText('Phone number (required)'), '5551234567');
  fireEvent.changeText(getByPlaceholderText('Password'), 'Password1!');
  fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password1!');
  await act(async () => { fireEvent.press(getByText('Sign Up')); });
}

beforeEach(() => {
  jest.clearAllMocks();
  // RTK Query mutations return an object with .unwrap() — not a plain Promise.
  // mockReturnValue (not mockResolvedValue) because .unwrap() is called synchronously.
  mockSignupFn.mockReturnValue({
    unwrap: () => Promise.resolve({ user: { id: 1, email: 'john@example.com' }, token: 'jwt-abc123' }),
  });
  mockCreatePrefFn.mockReturnValue({
    unwrap: () => Promise.resolve({ data: {} }),
    catch: jest.fn().mockReturnThis(),
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SignupScreen', () => {
  describe('successful registration', () => {
    it('stores the JWT in SecureStore after signup', async () => {
      const screen = renderSignup();
      await fillAndSubmit(screen);
      await waitFor(() => {
        expect(mockSetItemAsync).toHaveBeenCalledWith('authToken', 'jwt-abc123');
      });
    });

    it('navigates to /goal-selection after storing the token', async () => {
      const screen = renderSignup();
      await fillAndSubmit(screen);
      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/goal-selection');
      });
    });

    it('navigates to /goal-selection regardless of onboarding state', async () => {
      // createUserPreference was moved out of signup into the goal-selection screen.
      // Signup always routes to /goal-selection after a successful registration.
      const store = makeStore({ goal_type: 'physique', training_days_per_week: 4 });
      const screen = renderSignup(store);
      await fillAndSubmit(screen);
      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/goal-selection');
      });
      expect(mockCreatePrefFn).not.toHaveBeenCalled();
    });

    it('does not call createUserPreference during signup', async () => {
      // Preference creation was moved to the goal-selection screen.
      const screen = renderSignup();
      await fillAndSubmit(screen);
      await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/goal-selection'));
      expect(mockCreatePrefFn).not.toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    it('shows inline error for invalid email', async () => {
      const { getByPlaceholderText, getByText, findByText } = renderSignup();
      fireEvent.changeText(getByPlaceholderText('First Name'), 'John');
      fireEvent.changeText(getByPlaceholderText('Last Name'), 'Doe');
      fireEvent.changeText(getByPlaceholderText('Email'), 'bad-email');
      fireEvent.changeText(getByPlaceholderText('Phone number (required)'), '5551234567');
      fireEvent.changeText(getByPlaceholderText('Password'), 'Password1!');
      fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password1!');
      fireEvent.press(getByText('Sign Up'));
      expect(await findByText(/valid email/i)).toBeTruthy();
      expect(mockSignupFn).not.toHaveBeenCalled();
    });

    it('shows inline error when passwords do not match', async () => {
      const { getByPlaceholderText, getByText, findByText } = renderSignup();
      fireEvent.changeText(getByPlaceholderText('First Name'), 'John');
      fireEvent.changeText(getByPlaceholderText('Last Name'), 'Doe');
      fireEvent.changeText(getByPlaceholderText('Email'), 'john@example.com');
      fireEvent.changeText(getByPlaceholderText('Phone number (required)'), '5551234567');
      fireEvent.changeText(getByPlaceholderText('Password'), 'Password1!');
      fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Different1!');
      fireEvent.press(getByText('Sign Up'));
      expect(await findByText(/do not match/i)).toBeTruthy();
    });

    it('shows inline error when phone number is too short', async () => {
      const { getByPlaceholderText, getByText, findByText } = renderSignup();
      fireEvent.changeText(getByPlaceholderText('First Name'), 'John');
      fireEvent.changeText(getByPlaceholderText('Last Name'), 'Doe');
      fireEvent.changeText(getByPlaceholderText('Email'), 'john@example.com');
      fireEvent.changeText(getByPlaceholderText('Phone number (required)'), '123');
      fireEvent.changeText(getByPlaceholderText('Password'), 'Password1!');
      fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password1!');
      fireEvent.press(getByText('Sign Up'));
      expect(await findByText(/digit/i)).toBeTruthy();
      expect(mockSignupFn).not.toHaveBeenCalled();
    });
  });
});
