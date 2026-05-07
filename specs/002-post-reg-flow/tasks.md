# Tasks: Post-Registration Flow (002)

**Input**: specs/002-post-reg-flow/plan.md, spec.md, research.md
**Branch**: `002-post-reg-flow`

---

## Phase 1: Setup — Jest + Testing Infrastructure

**Purpose**: Get tests runnable before writing any feature code.

- [ ] T001 Install jest-expo, @testing-library/react-native, @testing-library/jest-native as devDependencies
- [ ] T002 Add jest config to package.json (preset: jest-expo, setupFilesAfterFramework, transformIgnorePatterns)
- [ ] T003 [P] Create `__tests__/` directory structure matching plan.md

---

## Phase 2: Foundational — Onboarding Redux Slice

**Purpose**: The slice that carries pre-registration selections into the signup screen. All other tasks depend on this.

**⚠️ CRITICAL**: signup.tsx update and preferencesApi both read from this slice.

### Tests for Onboarding Slice

- [ ] T004 [P] Write unit tests for `onboardingSlice` in `__tests__/store/onboardingSlice.test.ts`
  - Test initial state (all nulls)
  - Test each action: setGoalType, setTrainingDays, setExperienceLevel, setSelectedTemplate
  - Test clearOnboarding resets all fields to null

### Implementation

- [ ] T005 Create `src/store/onboardingSlice.ts` with `GoalType`, `DifficultyLevel` types, `OnboardingState`, and all actions
- [ ] T006 Register onboardingSlice in `src/store/store.ts`

**Checkpoint**: `npx jest __tests__/store/onboardingSlice.test.ts` passes

---

## Phase 3: User Story 2 — Preferences API Slice (P1)

**Goal**: RTK Query slice that can POST, GET, and PATCH `/api/v1/user_preference` using the JWT from SecureStore (via existing baseQuery).

**Independent Test**: Mock the API — call `createUserPreference`, verify the correct request body is sent.

### Tests for Preferences API

- [ ] T007 [P] Write RTK Query tests in `__tests__/features/preferences/preferencesApi.test.ts`
  - Test `createUserPreference` sends correct URL, method, and body
  - Test `getUserPreference` maps response to `UserPreference` type
  - Test tag invalidation: `createUserPreference` invalidates `UserPreference`
  - **[STUB - 20%]** Test `createUserPreference` when the API returns 422 (validation error)
  - **[STUB - 20%]** Test `updateUserPreference` with partial body (only some fields set)

### Implementation

- [ ] T008 Create `src/features/preferences/preferencesApi.ts` with:
  - `UserPreference` type (id, user_id, primary_goal, training_days_per_week, experience_level, preferred_workout_duration, onboarding_completed, timestamps)
  - `createUserPreference` mutation → `POST /api/v1/user_preference`
  - `getUserPreference` query → `GET /api/v1/user_preference`
  - `updateUserPreference` mutation → `PATCH /api/v1/user_preference`
  - Tag: `'UserPreference'`
- [ ] T009 Register `preferencesApi` in `src/store/store.ts` (reducer + middleware)
- [ ] T010 Export hooks from `preferencesApi.ts`: `useCreateUserPreferenceMutation`, `useGetUserPreferenceQuery`, `useUpdateUserPreferenceMutation`

**Checkpoint**: `npx jest __tests__/features/preferences/` passes

---

## Phase 4: User Story 1 — Signup Screen Update (P1)

**Goal**: After registration succeeds, automatically store JWT → fire-and-forget save preferences → clear onboarding state → navigate to dashboard.

**Independent Test**: Simulate a successful signup — verify SecureStore is called, createUserPreference is dispatched, router.replace('/home') is called, in that order.

### Tests for Signup Screen

- [ ] T011 Write integration tests in `__tests__/screens/signup.test.tsx`
  - **[FULLY IMPLEMENTED]** Test: successful signup stores JWT in SecureStore with key `authToken`
  - **[FULLY IMPLEMENTED]** Test: successful signup calls router.replace('/home')
  - **[FULLY IMPLEMENTED]** Test: successful signup dispatches createUserPreference with onboarding state values
  - **[FULLY IMPLEMENTED]** Test: if onboarding state is empty (all nulls), createUserPreference is NOT called
  - **[FULLY IMPLEMENTED]** Test: if createUserPreference fails, router.replace('/home') still executes (failure doesn't block navigation)
  - **[STUB - 20%]** Test: successful signup clears the onboarding Redux slice after navigation
    - Hint: after `handleSignup` resolves, select onboarding state from the store and assert all fields are null
  - **[STUB - 20%]** Test: signup with invalid email shows email error inline (not an Alert)
    - Hint: use `fireEvent.changeText` then `fireEvent.press` the submit button, then `getByText` the error message

### Implementation

- [ ] T012 Update `app/signup.tsx`:
  - Add `useSelector` to read `onboardingState` from Redux
  - Add `useCreateUserPreferenceMutation` hook
  - After `SecureStore.setItemAsync('authToken', ...)`:
    1. If onboarding has `goal_type` or `training_days_per_week`, fire `createUserPreference(...)` — do NOT await, wrap in try/catch that only logs
    2. Dispatch `clearOnboarding()`
    3. `router.replace('/home')`

**Checkpoint**: `npx jest __tests__/screens/signup.test.tsx` passes; manual test: register a new account → preferences appear in Rails console

---

## Phase 5: User Story 3 — Session Persistence (P2)

**Goal**: On app launch, check SecureStore for a token; if present and valid, navigate to home; if missing/expired, navigate to login with a toast.

**Independent Test**: Simulate app launch with a valid token in SecureStore → user lands on home without login prompt.

### Tests for Root Layout / Auth Guard

- [ ] T013 [P] Write tests in `__tests__/app/_layout.test.tsx`
  - **[FULLY IMPLEMENTED]** Test: on launch with valid token in SecureStore, getCurrentUser succeeds → route is 'home'
  - **[FULLY IMPLEMENTED]** Test: on launch with no token in SecureStore, user is on login route
  - **[STUB - 20%]** Test: on launch with a token but getCurrentUser returns 401 (expired), user is redirected to login with session-expired toast visible
    - Hint: mock `SecureStore.getItemAsync` to return a token string, mock `getCurrentUser` to return `{ error: 'Not authenticated', status: 401 }`, then assert the toast text is visible in the rendered output
  - **[STUB - 20%]** Test: on launch with no network connection, app shows the last-viewed screen with an offline banner (not the login screen)
    - Hint: this requires mocking `NetInfo` from `@react-native-community/netinfo` to return `{ isConnected: false }` and asserting that the offline banner component is rendered

### Implementation

- [ ] T014 Update `app/_layout.tsx`:
  - On mount: read `authToken` from SecureStore
  - If token exists: call `getCurrentUser`; on success navigate to `/home`; on 401 delete token, navigate to `/login` with `?reason=expired` param
  - If no token: navigate to `/login`
- [ ] T015 Update `app/login.tsx`:
  - Read `reason` param from route; if `reason === 'expired'` show a non-blocking toast: "Your session has expired. Please sign in again."

---

## Phase 6: Polish

- [ ] T016 [P] Update `CLAUDE.md` Active Technologies section to reflect new slices
- [ ] T017 Run full test suite: `npx jest` — all implemented tests green, stubs shown as todo
- [ ] T018 Run `npm run lint` — no new errors

---

## Dependencies & Execution Order

```
T001–T003 (setup) → T004–T006 (onboarding slice) → T007–T010 (preferencesApi) → T011–T012 (signup) → T013–T015 (auth guard) → T016–T018 (polish)
```

Parallelizable within each phase where marked `[P]`.
