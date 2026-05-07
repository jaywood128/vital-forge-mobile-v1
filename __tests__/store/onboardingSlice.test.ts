import { configureStore } from '@reduxjs/toolkit';
import onboardingReducer, {
  setGoalType,
  setTrainingDays,
  setExperienceLevel,
  setSelectedTemplate,
  clearOnboarding,
  type OnboardingState,
} from '../../src/store/onboardingSlice';

// Helper: create a fresh isolated store for each test
function makeStore() {
  return configureStore({ reducer: { onboarding: onboardingReducer } });
}

describe('onboardingSlice', () => {
  describe('initial state', () => {
    it('starts with all fields null', () => {
      const store = makeStore();
      const state: OnboardingState = store.getState().onboarding;
      expect(state.goal_type).toBeNull();
      expect(state.training_days_per_week).toBeNull();
      expect(state.experience_level).toBeNull();
      expect(state.selected_template_id).toBeNull();
    });
  });

  describe('setGoalType', () => {
    it('sets goal_type to physique', () => {
      const store = makeStore();
      store.dispatch(setGoalType('physique'));
      expect(store.getState().onboarding.goal_type).toBe('physique');
    });

    it('sets goal_type to strength', () => {
      const store = makeStore();
      store.dispatch(setGoalType('strength'));
      expect(store.getState().onboarding.goal_type).toBe('strength');
    });

    it('overwrites a previously set goal_type', () => {
      const store = makeStore();
      store.dispatch(setGoalType('physique'));
      store.dispatch(setGoalType('strength'));
      expect(store.getState().onboarding.goal_type).toBe('strength');
    });
  });

  describe('setTrainingDays', () => {
    it.each([3, 4, 5, 6] as const)('sets training_days_per_week to %i', (days) => {
      const store = makeStore();
      store.dispatch(setTrainingDays(days));
      expect(store.getState().onboarding.training_days_per_week).toBe(days);
    });
  });

  describe('setExperienceLevel', () => {
    it('sets experience_level to Intermediate', () => {
      const store = makeStore();
      store.dispatch(setExperienceLevel('Intermediate'));
      expect(store.getState().onboarding.experience_level).toBe('Intermediate');
    });

    it('can clear experience_level back to null (optional field)', () => {
      const store = makeStore();
      store.dispatch(setExperienceLevel('Advanced'));
      store.dispatch(setExperienceLevel(null));
      expect(store.getState().onboarding.experience_level).toBeNull();
    });
  });

  describe('setSelectedTemplate', () => {
    it('sets selected_template_id', () => {
      const store = makeStore();
      store.dispatch(setSelectedTemplate(42));
      expect(store.getState().onboarding.selected_template_id).toBe(42);
    });

    it('overwrites a previously selected template', () => {
      const store = makeStore();
      store.dispatch(setSelectedTemplate(1));
      store.dispatch(setSelectedTemplate(99));
      expect(store.getState().onboarding.selected_template_id).toBe(99);
    });
  });

  describe('clearOnboarding', () => {
    it('resets all fields to null after they have been set', () => {
      const store = makeStore();
      store.dispatch(setGoalType('physique'));
      store.dispatch(setTrainingDays(4));
      store.dispatch(setExperienceLevel('Beginner'));
      store.dispatch(setSelectedTemplate(7));

      store.dispatch(clearOnboarding());

      const state = store.getState().onboarding;
      expect(state.goal_type).toBeNull();
      expect(state.training_days_per_week).toBeNull();
      expect(state.experience_level).toBeNull();
      expect(state.selected_template_id).toBeNull();
    });

    it('is a no-op when state is already at initial values', () => {
      const store = makeStore();
      store.dispatch(clearOnboarding());
      const state = store.getState().onboarding;
      expect(state).toEqual({
        goal_type: null,
        training_days_per_week: null,
        experience_level: null,
        selected_template_id: null,
      });
    });
  });
});
