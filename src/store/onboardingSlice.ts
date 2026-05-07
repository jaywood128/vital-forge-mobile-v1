import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type GoalType = 'physique' | 'strength';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type TrainingDays = 3 | 4 | 5 | 6;

export interface OnboardingState {
  goal_type: GoalType | null;
  training_days_per_week: TrainingDays | null;
  experience_level: DifficultyLevel | null;
  selected_template_id: number | null;
}

const initialState: OnboardingState = {
  goal_type: null,
  training_days_per_week: null,
  experience_level: null,
  selected_template_id: null,
};

export const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setGoalType: (state, action: PayloadAction<GoalType>) => {
      state.goal_type = action.payload;
    },
    setTrainingDays: (state, action: PayloadAction<TrainingDays>) => {
      state.training_days_per_week = action.payload;
    },
    setExperienceLevel: (state, action: PayloadAction<DifficultyLevel | null>) => {
      state.experience_level = action.payload;
    },
    setSelectedTemplate: (state, action: PayloadAction<number>) => {
      state.selected_template_id = action.payload;
    },
    clearOnboarding: () => initialState,
  },
});

export const {
  setGoalType,
  setTrainingDays,
  setExperienceLevel,
  setSelectedTemplate,
  clearOnboarding,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
