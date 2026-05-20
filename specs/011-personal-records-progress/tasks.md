# Tasks: Personal Records + Exercise Progress Charts

**Branch**: `011-personal-records-progress`
**Input**: Design documents from `specs/011-personal-records-progress/`

---

## Phase 1: Setup

**Purpose**: Install dependencies and create file structure before any implementation.

- [ ] T001 Install `react-native-svg` via `npx expo install react-native-svg`
- [ ] T002 Install `react-native-gifted-charts` via `npx expo install react-native-gifted-charts`
- [ ] T003 Create directory `src/lib/stats/` (three empty `.ts` files: `epley.ts`, `prDetection.ts`, `exerciseHistory.ts`)
- [ ] T004 Create directory `__tests__/lib/stats/` (three empty `.test.ts` files to match)

**Checkpoint**: Dependencies installed, file scaffolding in place. Run `npx expo start` to verify no install errors before proceeding.

---

## Phase 2: Foundational — Pure Stats Functions + Tests

**Purpose**: The pure functions that all UI stories depend on. Must be complete and tested before touching any screen.

**⚠️ CRITICAL**: No UI work can begin until this phase is complete. All screens depend on these functions.

- [ ] T005 [P] Implement `calculateEpley1RM(weight, reps)` in `src/lib/stats/epley.ts` — returns `weight × (1 + reps / 30)`; returns `0` if weight ≤ 0 or reps ≤ 0
- [ ] T006 [P] Write unit tests for `epley.ts` in `__tests__/lib/stats/epley.test.ts` — ~80% implemented, ~20% as labelled stubs per constitution testing policy
- [ ] T007 Implement `detectPRSetIds(workouts)` in `src/lib/stats/prDetection.ts` — chronological scan, returns `Set<number>` of PR set IDs (depends on T005)
- [ ] T008 Write unit tests for `prDetection.ts` in `__tests__/lib/stats/prDetection.test.ts` — cover: first-ever set (no PR), new PR fires, tie does not fire, bodyweight (null weight) skipped, intra-session PR
- [ ] T009 [P] Implement `getCurrentBests(workouts, exerciseId)` in `src/lib/stats/exerciseHistory.ts` — returns `{ best1RM: number | null }`
- [ ] T010 [P] Implement `getExerciseSeries(workouts, exerciseId, metric)` in `src/lib/stats/exerciseHistory.ts` — returns `ExerciseSeriesPoint[]` for `maxWeight`, `1rm`, or `volume`
- [ ] T011 Write unit tests for `exerciseHistory.ts` in `__tests__/lib/stats/exerciseHistory.test.ts` — cover: empty history, single session, multiple sessions, bodyweight exercise, each metric type

**Checkpoint**: Run `npx jest --no-coverage __tests__/lib/stats/` — all tests pass before moving on.

---

## Phase 3: US1 — PR Celebration in Active Workout

**Goal**: A lifter sees a 🏆 badge, slide-down toast, and feels a haptic the moment they log a new personal record.

**Independent test**: Open an active workout, log a set heavier than any previous set for that exercise → PR celebration fires. Log a lighter set → nothing.

- [ ] T012 Create `src/components/PRBadge.tsx` — renders a small 🏆 badge using `colors` and `spacing` tokens; accepts optional `style` prop
- [ ] T013 Create `src/components/PRToast.tsx` — slide-down animated banner using `Animated` API (not Reanimated); props: `exerciseName`, `previous1RM`, `current1RM`, `onDismiss`; auto-dismisses after 3000ms
- [ ] T014 Add `useGetWorkoutsQuery()` call to `app/active-workout.tsx` (cached — no new network request if home screen already fetched)
- [ ] T015 Add `prToastState` local state (`PRToastState | null`) to `app/active-workout.tsx`
- [ ] T016 Wire PR detection into `handleLog` success path in `app/active-workout.tsx` — after `await promise.unwrap()`: derive `exerciseId`, compute PR set IDs, check if just-logged set is a PR, update `prToastState` if so
- [ ] T017 Fire `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` on PR detection in `app/active-workout.tsx`
- [ ] T018 Render `<PRBadge />` on logged set rows in `app/active-workout.tsx` where `prSetIds.has(set.id)`
- [ ] T019 Render `<PRToast />` in `app/active-workout.tsx` when `prToastState !== null`; pass `onDismiss` that sets state to `null`

**Checkpoint**: Run simulator, log a set heavier than any historical set → see toast + badge + haptic. Log lighter → nothing fires.

---

## Phase 4: US2 — PR Badges in Workout History

**Goal**: Past workouts in history show 🏆 on set rows that were PRs when they were logged.

**Independent test**: Open a past workout in history that contains a known PR set → 🏆 badge appears on that set row only.

- [ ] T020 Add `useGetWorkoutsQuery()` call to `app/workout-detail.tsx`
- [ ] T021 Add `useMemo` in `app/workout-detail.tsx` to compute `prSetIds = detectPRSetIds(allWorkouts)`
- [ ] T022 Render `<PRBadge />` on set rows in `app/workout-detail.tsx` where `prSetIds.has(set.id)`

**Checkpoint**: Open history → workout detail → verify 🏆 badges appear on correct set rows.

---

## Phase 5: US3 — Exercise Progress Charts

**Goal**: Tap any exercise name in workout history → see a progress screen with header bests and a segmented line chart.

**Independent test**: Open a past workout, tap an exercise name → `exercise-progress` screen opens, chart renders data points from multiple sessions.

- [ ] T023 Register `exercise-progress` route in `app/_layout.tsx` — add `<Stack.Screen name="exercise-progress" options={{ headerShown: false }} />`
- [ ] T024 Create `src/components/ExerciseChart.tsx` — wraps `react-native-gifted-charts` `LineChart`; props: `data: ExerciseSeriesPoint[]`, optional `color` (defaults to `colors.electricBlueLight`)
- [ ] T025 Create `app/exercise-progress.tsx` screen — reads `exerciseId` and `exerciseName` from `useLocalSearchParams`; Deep Navy gradient background; header card with bests; segmented control `[Max Weight | 1RM | Volume]`; `<ExerciseChart />`; empty state; single-point note
- [ ] T026 Wrap exercise name `<Text>` in `<Pressable>` in `app/workout-detail.tsx` — navigates to `/exercise-progress?exerciseId=X&exerciseName=Y`; min height `spacing.touchMin`
- [ ] T027 Write screen test in `__tests__/screens/exercise-progress.test.tsx` — follow existing patterns in `__tests__/screens/`

**Checkpoint**: Tap exercise name in history → exercise-progress screen opens, chart renders, segmented control switches metrics.

---

## Phase 6: US4 — Visual Polish

**Goal**: The exercise-progress screen is visually consistent with every other screen.

**Independent test**: Side-by-side comparison with `home.tsx` — same gradient, card surfaces, typography, spacing.

- [ ] T028 Verify `app/exercise-progress.tsx` uses `LinearGradient` with `colors.navyDeep` → `colors.navyMid` (matches all other screens)
- [ ] T029 Verify all `Pressable` elements in new/modified files meet `spacing.touchMin = 44` minimum touch target
- [ ] T030 Verify no hardcoded hex values in any new file — all colors from `src/theme/colors.ts`

**Checkpoint**: Run `npm run lint` → zero new errors.

---

## Phase 7: Polish & Wrap-Up

- [ ] T031 Run full test suite `npx jest --no-coverage` → all tests pass
- [ ] T032 Commit all changes with message `feat(011): personal records + exercise progress charts`
- [ ] T033 [P] Update `CLAUDE.md` active technologies section with new dependencies (`react-native-svg`, `react-native-gifted-charts`) and new files (`src/lib/stats/`, `src/components/PRBadge`, `PRToast`, `ExerciseChart`)

---

## Dependencies & Execution Order

```
Phase 1 (Setup)
    ↓
Phase 2 (Stats Functions) ← BLOCKS everything
    ↓
Phase 3 (US1) ──→ Phase 4 (US2) ──→ Phase 5 (US3) ──→ Phase 6 (US4)
         \___________________________/
         (US2 can start in parallel with US3 — different files)
    ↓
Phase 7 (Polish)
```

### Parallel opportunities within Phase 2
- T005 + T006 (epley) can run alongside T009 + T010 (exerciseHistory) — different files
- T007 + T008 (prDetection) must follow T005 (depends on calculateEpley1RM)

### Parallel opportunities within Phase 5
- T023 (_layout.tsx) and T024 (ExerciseChart component) can run in parallel — different files

---

## Implementation Strategy

### MVP Scope (this weekend)
1. Phase 1: Setup
2. Phase 2: Stats functions + tests
3. Phase 3: US1 (live PR celebration in active workout)
4. Phase 4: US2 (PR badges in history)
5. Phase 5: US3 (exercise progress charts)

**Stop point**: If time runs short, ship Phase 1–4 (PRs only, no charts). The PR celebration alone is a complete, shippable feature.

---

## Notes

- `[P]` = parallelisable — different files, no dependency on an incomplete task
- Commit after each phase checkpoint — makes it easy to bisect if something breaks
- Run `npx expo start --clear` after Phase 1 to pick up native dependency changes
- Constitution §VIII: `useLocalSearchParams()` returns strings — cast `exerciseId` to `number` with `Number(exerciseId)` inside the screen
