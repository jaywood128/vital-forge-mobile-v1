# Tasks: Active Workout Screen

**Input**: Design documents from `specs/005-active-workout-screen/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · checklists/requirements.md ✅ (all 33 items resolved)

**Repo**: All tasks execute in `vital-forge-mobile-v1/`.

---

## Phase 1: Setup

**Purpose**: Confirm correct branch before any code changes.

- [X] T001 Confirm `vital-forge-mobile-v1` is on `005-active-workout-screen` branch before starting any task

---

## Phase 2: Foundational — API Layer

**Purpose**: Fix the broken `logSet` mutation and wire up the correct endpoints. All screen work is blocked until this phase is complete.

**⚠️ CRITICAL**: The existing `logSet` mutation in `workoutsApi.ts` points to a non-existent endpoint (`POST /api/v1/workouts/:id/sets`). This must be removed before any screen work begins.

- [ ] T002 Update `src/features/workouts/workoutsApi.ts`: (1) remove the broken `logSet` mutation (wrong endpoint — `POST /api/v1/workouts/:id/sets` does not exist); (2) add new `ExerciseSet` type with full fields (`id`, `set_number`, `reps`, `weight`, `weight_unit`, `completed`, `notes`); (3) expand the existing `WorkoutExercise` type to include `exercise` (nested: `id`, `name`, `muscle_group`, `equipment`, `exercise_type`), `exercise_sets: ExerciseSet[]`, and `rest_between_sets`; (4) add new `WorkoutDetail` type with full nested shape (do NOT rename or remove the existing `Workout` type — it is used by `getWorkouts` and `home.tsx`); (5) add `getWorkout` query (`GET /api/v1/workouts/:id`, `transformResponse` to unwrap `response.data`, `providesTags: [{ type: 'ActiveWorkout', id }]`); `completeWorkout` mutation already exists and is correct — do not add it again

- [ ] T003 [P] Create `src/features/workouts/exerciseSetsApi.ts` — new RTK Query slice with `logSet` mutation (`PATCH /api/v1/exercise_sets/:id`, body `{ exercise_set: { weight, reps, completed: true } }`); export `useLogSetMutation` hook; define `LogSetPayload` type (`{ id: number; weight: number; reps: number; completed: true }`)

- [ ] T004 Register `exerciseSetsApi` reducer (`exerciseSetsApi.reducer`) and middleware (`exerciseSetsApi.middleware`) in `src/store/store.ts`

---

## Phase 3: User Story 1 — See Today's Workout (P1)

**Story goal**: User arrives from Start Workout or Resume Workout, sees all exercises with their planned sets ready to log.

**Independent test**: Navigate to `/active-workout?workoutId=X` and confirm exercises and empty set rows render correctly; confirm loading and error states show.

- [ ] T005 Register the `active-workout` route in `app/_layout.tsx` — add `<Stack.Screen name="active-workout" options={{ headerShown: false }} />`

- [ ] T006 [US1] Create `app/active-workout.tsx` screen — accept nav params `workoutId: string` and `dayName?: string`; call `useGetWorkoutQuery(Number(workoutId))`; show `ActivityIndicator` while loading; show full-screen error message with retry button on fetch failure; redirect to `/home` via `router.replace` if fetched workout has `completed: true`

- [ ] T007 [US1] Implement exercise list in `app/active-workout.tsx` — render `FlatList` of `workout.workout_exercises` (ordered by `order_position` from API); each item renders an `ExerciseSection` showing exercise name and muscle group chip; render header `Card` with `workout.name` and `dayName` param (omit day label if `dayName` not provided); note: full day label display is only exercised end-to-end after T013 passes `dayName` from `workout-preview.tsx`

---

## Phase 4: User Story 2 — Log a Set (P1)

**Story goal**: User taps a set row, enters weight and reps, taps Log, row updates to show saved values with green tint. Tapping a logged row re-opens inputs pre-filled. Values survive scroll.

**Independent test**: Tap a set row, enter weight and reps, tap Log; confirm `PATCH /api/v1/exercise_sets/:id` called with correct payload; confirm row shows green tint and static values; confirm re-tap pre-fills inputs.

- [ ] T008 [US2] Add screen-level input state in `app/active-workout.tsx` — `useState` keyed by `exerciseSetId` storing `{ weight: string; reps: string }` for all sets; initialise reps from `exercise_set.reps` (template pre-fill), weight as empty string; pass state and setter down to `SetRow` as props so values survive FlatList virtualisation on scroll

- [ ] T009 [P] [US2] Implement `SetRow` component inline in `app/active-workout.tsx` — **Unlogged state**: set number label, weight `TextInput` (numeric keyboard, initially empty, `lbs` label adjacent), reps `TextInput` (numeric keyboard, pre-filled from template), Log `Button`; **Logged state**: `colors.success` green-tinted background, static text showing `{weight}lbs × {reps}`, tappable to re-enter edit mode; accept `inputState`, `onInputChange`, `onLog`, `isLoading`, `error` props

- [ ] T010 [US2] Wire `useLogSetMutation` into `SetRow` in `app/active-workout.tsx` — on Log tap: validate weight and reps are non-empty (show inline validation message if not); call `logSet({ id: set.id, weight: Number(weight), reps: Number(reps), completed: true })`; disable Log button while in-flight; re-enable on success or failure; on success: switch row to logged state; on failure: show inline plain-English error on the row, preserve entered values, re-enabled Log button acts as retry; implement 10-second timeout via `AbortController` + `setTimeout` — on timeout fire `controller.abort()` and treat as failure (RTK Query has no built-in per-request timeout; pass `signal: controller.signal` in the fetch options or wrap in a custom `baseQueryWithTimeout` if reuse is needed)

---

## Phase 5: User Story 3 — Finish Workout (P2)

**Story goal**: User taps Finish Workout, session is marked complete, user lands on home screen.

**Independent test**: Tap Finish Workout with all sets logged — confirm `PATCH /api/v1/workouts/:id/complete` called and user navigates to `/home`; tap with partial sets — confirm confirmation prompt appears first.

- [ ] T011 [US3] Add sticky footer to `app/active-workout.tsx` — fixed-position `View` at bottom of screen (visible at all scroll positions); render `Button` labelled "Finish Workout" inside it

- [ ] T012 [US3] Implement Finish Workout flow in `app/active-workout.tsx` — on button tap: check if every `exercise_set.completed === true`; if partial: show `Alert.alert('End workout early?', ..., [Cancel, Finish])`; on confirm (or if all sets logged): call `useCompleteWorkoutMutation(workoutId)`; on success: `router.replace('/home')`; on failure: `Alert.alert` with plain-English error, user remains on screen

---

## Phase 6: Navigation Integration

**Purpose**: Wire up the existing screens to pass the correct params to the new active-workout route. These tasks are independent of each other and can run in parallel.

- [ ] T013 [P] Update `app/workout-preview.tsx` — replace `router.replace('/home')` (post-start success) with `router.replace({ pathname: '/active-workout', params: { workoutId: String(result.workout.id), dayName: selectedDayName } })`; ensure `selectedDayName` is available from the day selection state on that screen

- [ ] T014 [P] Update 409 Resume alert in `app/workout-preview.tsx` — change the Resume `onPress` to `router.replace({ pathname: '/active-workout', params: { workoutId: String(err.data.active_workout_id) } })` (dayName omitted on resume — header shows workout name only)

- [ ] T015 [P] Update `app/home.tsx` — fix `handleResumePress` to navigate to `/active-workout` with the in-progress workout id: find workout where `!w.completed && w.started_at !== null`, then `router.push({ pathname: '/active-workout', params: { workoutId: String(activeWorkout.id) } })`

---

## Phase 7: Tests

**Purpose**: Verify the screen against the spec's key acceptance criteria.

- [ ] T016 Create `__tests__/screens/active-workout.test.tsx` and implement the following test cases:

  | Test | Spec reference |
  |---|---|
  | Shows `ActivityIndicator` while workout fetch is in-flight | US1 scenario 3 |
  | Shows full-screen error + retry on fetch failure | US1 scenario 4, FR-012 |
  | Renders exercise names and set rows after successful load | US1 scenario 1–2 |
  | Redirects to `/home` if fetched workout is already completed | Edge case, CHK022 |
  | Log button calls `PATCH /api/v1/exercise_sets/:id` with correct payload | US2 scenario 2, FR-005 |
  | Log button is disabled while save is in-flight | US2 scenario 3, FR-007 |
  | Log button re-enables after save failure | FR-007 |
  | Set row shows green tint + static values after successful save | US2 scenario 2, FR-006 |
  | Inline error shown on row after save failure, values preserved | US2 scenario 4, SC-005 |
  | Tapping a logged row re-enters edit mode with pre-filled values | US2 scenario 6, FR-004 |
  | Input values survive scroll (state held at screen level) | Edge case, CHK028 |
  | Finish Workout with all sets logged — calls complete, no prompt | US3 scenario 1 |
  | Finish Workout with partial sets — shows confirmation prompt | US3 scenario 3, FR-009 |
  | Finish Workout success — navigates to `/home` | US3 scenario 1, FR-010 |
  | Finish Workout failure — shows Alert, user stays on screen | US3 scenario 4 |
  | Resume path shows previously logged sets in logged state (green tint, static values) | SC-004, US1 scenario 5 |

---

## Dependencies

```
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010
                                                              ↓
                                                   T011 → T012
T013, T014, T015 (parallel, after T006 confirms nav param shape)
T016 (after T010 and T012)
```

## Parallel Execution Opportunities

- **T002 + T003**: Different files, no shared state
- **T003 + T005**: Different files, no shared state
- **T008 + T011**: Screen-level state vs sticky footer — different parts of same file (coordinate order)
- **T009 + T011**: SetRow component vs footer — different UI regions
- **T013 + T014 + T015**: Three different files, fully independent

## Implementation Strategy

**MVP scope**: Complete T001–T012 for a fully working active workout screen. T013–T015 connect it to the rest of the app. T016 validates the key paths.

**Suggested order for solo development**:
1. T001–T004 (API layer) — get data flowing first
2. T005–T007 (screen scaffold + exercise list) — see the data on screen
3. T008–T010 (set row + logging) — core feature working end-to-end
4. T011–T012 (finish workout) — close the loop
5. T013–T015 (navigation) — connect to rest of app
6. T016 (tests) — validate
