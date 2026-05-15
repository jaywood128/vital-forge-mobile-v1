# Tasks: Workout History

**Input**: Design documents from `/specs/007-workout-history/`  
**Branch**: `007-workout-history`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Included per constitution testing policy (~80% implemented, ~20% `it.todo` stubs with English hints on edge cases and async flows).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no blocking dependency)
- **[Story]**: User story this task belongs to — US1, US2, US3

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Route registration and structural wiring that all screens depend on.

- [x] T001 Register `history` and `workout-detail` routes inside `<Stack>` in `app/_layout.tsx` — add `<Stack.Screen name="history" options={{ headerShown: false }} />` and `<Stack.Screen name="workout-detail" options={{ headerShown: false }} />`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Dark theme tokens and component upgrades that all screens use. Also the RTK Query type fix that unlocks exercise/set data access in screens. Must be complete before any screen work begins.

**⚠️ CRITICAL**: No screen implementation can begin until this phase is complete.

- [x] T00x Add dark theme tokens to `src/theme/colors.ts` — append `navyDeep: '#0a1628'`, `navyMid: '#0f1e3c'`, `navyCard: '#152035'`, `navyInput: '#0d1827'`, `electricBlueLight: '#6eb3f5'` under a `// Dark navy theme (007-workout-history)` comment
- [x] T00x [P] Add dark gradient variant to `src/components/ui/Screen.tsx` — add `variant?: 'light' | 'dark'` prop defaulting to `'dark'`; dark variant wraps children in `<LinearGradient colors={[colors.navyDeep, colors.navyMid]} style={{ flex: 1 }} start={{ x:0, y:0 }} end={{ x:0, y:1 }}>` from `expo-linear-gradient`
- [x] T00x [P] Add dark glass-morphism variant to `src/components/ui/Card.tsx` — add `variant?: 'light' | 'dark'` prop defaulting to `'dark'`; dark variant uses `backgroundColor: 'rgba(255,255,255,0.06)'`, `borderWidth: 1`, `borderColor: 'rgba(255,255,255,0.10)'`, `borderRadius: radius.card`, `padding: spacing.lg`; light variant preserves existing white card style
- [x] T00x Update `getWorkouts` return type in `src/features/workouts/workoutsApi.ts` — change `builder.query<Workout[], void>` to `builder.query<WorkoutDetail[], void>` and update `transformResponse` type accordingly; confirm `home.tsx` still compiles (it only accesses fields present on both types)

**Checkpoint**: Dark tokens available, Screen/Card have dark variants, workouts list typed correctly — screen implementation can now begin.

---

## Phase 3: User Story 1 — Browse Completed Workouts (Priority: P1) 🎯 MVP

**Goal**: User opens History from home, sees FlatList of completed workout cards sorted newest first. Each card shows formatted date, workout name, exercise count, total sets logged.

**Independent Test**: Navigate Home → tap "History" → verify list renders, cards show correct data, empty state appears when no workouts, loading state appears during fetch.

### Implementation

- [x] T00x [P] [US1] Build `src/components/ui/WorkoutHistoryCard.tsx` — `Pressable` wrapping a dark `Card`; top row: formatted date left (`typography.caption`, `rgba(255,255,255,0.4)`) + exercise count badge right (`electricBlueLight`); middle: workout name (`typography.subtitle`, `pureWhite`); bottom: total sets string (`typography.caption`, `rgba(255,255,255,0.4)`); props: `workout: WorkoutDetail`, `onPress: () => void`; derive `formattedDate`, `exerciseCount`, `setsLogged` inside the component
- [x] T00x [US1] Export `WorkoutHistoryCard` from `src/components/ui/index.ts` (depends T006)
- [x] T00x [US1] Build `app/history.tsx` — dark `Screen`; `useGetWorkoutsQuery()` for data; filter `completed === true` and sort by `workout_date` desc; `FlatList<WorkoutDetail>` with `keyExtractor={item => item.id.toString()}`; loading state: `ActivityIndicator` centred; empty state: `Text` "No workouts yet. Start your first session!"; error state: `Alert.alert` on mount; each item renders `WorkoutHistoryCard` with `onPress={() => router.push('/workout-detail?id=' + item.id)}` (depends T001, T002, T003, T004, T005, T006, T007)
- [x] T00x [US1] Add "History" `Pressable` button to `app/home.tsx` — style as secondary-style button (outline, `electricBlue` border, `electricBlue` text) placed below the active workout card; `onPress={() => router.push('/history')}` (depends T001, T008)

### Tests

- [x] T01x [P] [US1] Write `__tests__/screens/history.test.tsx` — mock `useGetWorkoutsQuery` at module level using RTK Query mock pattern; implement these cases (~80%): (1) renders loading indicator when `isLoading: true`; (2) renders FlatList with one card per completed workout; (3) card displays formatted date, workout name, exercise count, sets count; (4) tapping a card calls `router.push` with correct workout id; (5) renders empty-state text when data is empty array; leave as `it.todo` stubs (~20%): (6) error state — stub hint: "mock isError: true, verify Alert.alert is called with a message"; (7) filters out non-completed workouts — stub hint: "pass mixed data with completed: false items, verify only completed items appear in FlatList"

**Checkpoint**: Home → History navigation works. List renders, cards are correct, empty state visible.

---

## Phase 4: User Story 2 — View Workout Detail (Priority: P2)

**Goal**: User taps a history card and sees full breakdown: workout header, each exercise with muscle-group chip, every logged set with weight × reps or reps-only, success-green checkmarks.

**Independent Test**: Tap any history card → verify detail screen header shows correct name/date/sets, exercises list with chips, weighted and bodyweight set rows display correctly.

### Implementation

- [x] T01x [US2] Build `app/workout-detail.tsx` — read `id` with `useLocalSearchParams<{ id: string }>()`; call `useGetWorkoutQuery(Number(id))`; dark `Screen`; header section: workout name (`typography.title`, `pureWhite`), formatted date (`typography.caption`, `rgba(255,255,255,0.4)`), total sets badge; map `workout.workout_exercises` in order into inline `ExerciseHistorySection` components (exercise name `typography.subtitle` `pureWhite`, muscle group chip `rgba(74,144,217,0.2)` bg / `electricBlueLight` text / `radius.sm`); each section maps `exercise_sets` into inline `SetHistoryRow` (set number `typography.caption` `mediumGray`, weight×reps or reps-only label `typography.body` `pureWhite`, `✓` in `colors.success`, row bg `rgba(16,185,129,0.12)`, left border `3` wide `colors.success`); bodyweight detection: `exercise.exercise_type === 'bodyweight'` or `weight === null || weight === 0`; back button in header using `router.back()`; loading: `ActivityIndicator`; error/not-found: inline error message + "Go back" button (depends T001, T002, T003, T004, T005)

### Tests

- [x] T01x [P] [US2] Write `__tests__/screens/workout-detail.test.tsx` — mock `useGetWorkoutQuery` and `useLocalSearchParams` at module level; implement (~80%): (1) renders workout name and formatted date in header; (2) renders each exercise name and muscle group chip; (3) weighted set row shows "185 × 8" format; (4) bodyweight set row (`exercise_type: 'bodyweight'`) shows "12 reps" format; (5) loading state renders ActivityIndicator; leave as `it.todo` stubs (~20%): (6) back button calls router.back() — stub hint: "mock useRouter, render screen, press back button, assert router.back was called"; (7) 404/error state — stub hint: "mock isError: true on useGetWorkoutQuery, verify error message and go-back button render"

**Checkpoint**: Full flow works — History list → tap card → Detail screen with all exercises and sets.

---

## Phase 5: User Story 3 — Navigate Back from Detail (Priority: P3)

**Goal**: User returns from detail to history list in one action; list does not re-fetch (RTK cache hit).

**Independent Test**: Open detail → tap back → verify list re-appears without a second network call.

### Implementation

- [x] T01x [US3] Verify back navigation is complete in `app/workout-detail.tsx` — confirm the back button added in T011 calls `router.back()`; confirm `app/_layout.tsx` Stack registration (T001) means hardware back (Android) is handled automatically; no additional code needed if T011 and T001 are done; add an `it.todo` stub to `__tests__/screens/workout-detail.test.tsx` for cache-hit verification: "navigating back should not trigger a second getWorkouts call — stub hint: assert useGetWorkoutsQuery is called exactly once regardless of back-navigation"

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T01x [P] Run TypeScript strict check across all new files — `npx tsc --noEmit` from repo root; fix any type errors in `app/history.tsx`, `app/workout-detail.tsx`, `src/components/ui/WorkoutHistoryCard.tsx`
- [x] T01x [P] Run ESLint across new files — `npm run lint`; fix any warnings in new screens and component
- [x] T01x Manual smoke test per `specs/007-workout-history/quickstart.md` — start Rails API + Expo, navigate Home → History → Detail → Back, verify golden path end-to-end on simulator

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** (T001): No dependencies — start immediately
- **Phase 2** (T002–T005): Depends on Phase 1 — BLOCKS all screen work
- **Phase 3** (T006–T010): Depends on Phase 2 — MVP deliverable
- **Phase 4** (T011–T012): Depends on Phase 2; T011 also uses navigation from Phase 1
- **Phase 5** (T013): Depends on T011 and T001 being complete
- **Phase 6** (T014–T016): Depends on all story phases complete

### Within Phase 2

```
T002 (colors.ts) → T003 (Screen.tsx) [parallel with T004]
T002 (colors.ts) → T004 (Card.tsx)   [parallel with T003]
T005 (workoutsApi.ts)                 [parallel with T002-T004]
```

### Within Phase 3

```
T006 (WorkoutHistoryCard) [parallel with T010 (tests)]
T006 → T007 (export from index.ts)
T006 + T007 + Phase 2 → T008 (history.tsx)
T008 + T001 → T009 (home.tsx History button)
```

### Parallel Opportunities

```bash
# Phase 2 — run all in parallel (different files):
T002  # src/theme/colors.ts
T003  # src/components/ui/Screen.tsx
T004  # src/components/ui/Card.tsx
T005  # src/features/workouts/workoutsApi.ts

# Phase 3 — component + tests in parallel:
T006  # src/components/ui/WorkoutHistoryCard.tsx
T010  # __tests__/screens/history.test.tsx

# Phase 4 — screen + tests in parallel (write tests first if TDD):
T011  # app/workout-detail.tsx
T012  # __tests__/screens/workout-detail.test.tsx

# Polish — run in parallel:
T014  # tsc --noEmit
T015  # npm run lint
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. T001 — register routes
2. T002–T005 — foundation
3. T006–T009 — WorkoutHistoryCard + history screen + home button
4. **Validate**: Home → History navigation, cards render, empty state works
5. Ship US1 independently if needed

### Full Delivery

1. Phase 1 + 2 (foundation)
2. Phase 3 (US1) → validate independently
3. Phase 4 (US2) → validate independently
4. Phase 5 (US3) → confirm back nav + cache
5. Phase 6 (polish + lint + smoke test)
6. PR to `development`

---

## Notes

- T003 and T004 are mirroring `006-ui-redesign` exactly — when 006 merges to `development`, conflicts in these files resolve by accepting either side (identical values)
- `it.todo` stubs in T010 and T012 are intentional per the constitution's testing policy — leave them as stubs for developer completion
- All colours must reference `colors.*` tokens — no raw hex strings in screens or components
- `useGetWorkoutsQuery` caches the list under `['Workouts']` — back-navigation from detail is a cache hit with zero re-fetch
