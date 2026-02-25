# Implementation Plan: Post-Registration Flow

**Branch**: `002-post-reg-flow` | **Date**: 2026-02-24 | **Spec**: specs/002-post-reg-flow/spec.md

## Summary

After registration succeeds, automatically: store the JWT in SecureStore, POST the user's onboarding preferences to `user_preference`, and navigate to the dashboard — with no user interaction required. Implement a Redux onboarding slice to carry selections from the pre-registration screens, add a `preferencesApi` RTK Query slice, update the signup screen to trigger the auto-save, and set up Jest with 80% test coverage (20% scaffolded stubs for developer learning).

## Technical Context

**Language/Version**: TypeScript 5.9 strict
**Primary Dependencies**: Expo SDK 54, RTK Query, Redux Toolkit, expo-secure-store, expo-router
**Storage**: expo-secure-store (JWT), Rails API (user preferences via `/api/v1/user_preference`)
**Testing**: jest-expo + @testing-library/react-native
**Target Platform**: iOS + Android (React Native 0.81)
**Project Type**: Mobile app
**Performance Goals**: Dashboard reachable within 3 seconds of registration completing
**Constraints**: Preference save failure MUST NOT block navigation; offline-capable session check
**Scale/Scope**: Single post-registration flow, 3 new files, 1 updated screen

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Design System | ✅ | No new UI components; existing Button, Card, TextField used |
| II. Component Architecture | ✅ | No new reusable components needed |
| III. Navigation — Expo Router Only | ✅ | `router.replace('/home')` via `useRouter` |
| IV. State Management — RTK Query | ✅ | New `preferencesApi` slice + `onboardingSlice` Redux slice |
| V. Auth — JWT in SecureStore | ✅ | JWT stored via `SecureStore.setItemAsync('authToken', ...)` on signup success |
| VI. Platform Behavior | ✅ | No new interactive elements in this flow |
| VII. Long Lists | ✅ | N/A |
| VIII. TypeScript Strict | ✅ | All new types explicitly defined |
| Testing Policy | ✅ | ~80% implemented, ~20% scaffolded stubs |

## Project Structure

### Documentation (this feature)

```text
specs/002-post-reg-flow/
├── plan.md          ← this file
├── research.md      ← Phase 0
├── data-model.md    ← Phase 1
└── tasks.md         ← Phase 2 (/speckit.tasks output)
```

### Source Code Changes

```text
src/
├── features/
│   ├── auth/
│   │   └── authApi.ts              ← no changes needed
│   └── preferences/
│       └── preferencesApi.ts       ← NEW: RTK Query slice for user_preference
├── store/
│   ├── store.ts                    ← UPDATE: add preferencesApi + onboardingSlice
│   └── onboardingSlice.ts          ← NEW: Redux slice for pre-reg selections
app/
└── signup.tsx                      ← UPDATE: auto-save preferences after JWT stored

__tests__/
├── features/
│   └── preferences/
│       └── preferencesApi.test.ts  ← NEW: RTK Query slice tests
├── store/
│   └── onboardingSlice.test.ts     ← NEW: Redux slice unit tests
└── screens/
    └── signup.test.tsx             ← NEW: signup screen integration tests
```

## Phase 0: Research

See `research.md`.

## Phase 1: Design

### Onboarding Redux Slice (`src/store/onboardingSlice.ts`)

Holds the selections made during pre-registration browsing. Cleared after registration succeeds.

```typescript
type GoalType = 'physique' | 'strength';
type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

interface OnboardingState {
  goal_type: GoalType | null;
  training_days_per_week: 3 | 4 | 5 | 6 | null;
  experience_level: DifficultyLevel | null;
  selected_template_id: number | null;
}
```

Actions: `setGoalType`, `setTrainingDays`, `setExperienceLevel`, `setSelectedTemplate`, `clearOnboarding`

### Preferences RTK Query Slice (`src/features/preferences/preferencesApi.ts`)

```typescript
// POST /api/v1/user_preference
createUserPreference(body: {
  primary_goal: GoalType;
  training_days_per_week: number;
  experience_level?: DifficultyLevel;
  preferred_workout_duration?: number;
}) → UserPreference

// GET /api/v1/user_preference
getUserPreference() → UserPreference

// PATCH /api/v1/user_preference
updateUserPreference(body: Partial<...>) → UserPreference
```

Tag: `'UserPreference'`

### Signup Screen Update (`app/signup.tsx`)

Post-registration sequence (all async, user sees none of this):

```
1. signup(...).unwrap()           → get { token, user }
2. SecureStore.setItemAsync(...)  → store JWT
3. dispatch(createUserPreference) → fire-and-forget (don't await or block on failure)
4. dispatch(clearOnboarding)      → reset slice
5. router.replace('/home')        → navigate
```

The preference save is **fire-and-forget**: if it fails, log the error silently, do not Alert, do not block navigation.
