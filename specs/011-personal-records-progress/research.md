# Research: Personal Records + Exercise Progress Charts

**Branch**: `011-personal-records-progress` | **Date**: 2026-05-19

---

## Decision 1 — Chart Library

**Decision**: `react-native-gifted-charts`

**Rationale**:
- Good line chart support with a clean API
- Supports `react-native-svg` for rendering (no Skia native module required)
- Works with Expo SDK 54 and React Native 0.81
- Lighter weight than Victory Native v40 (which requires `@shopify/react-native-skia`)
- Does not conflict with existing `react-native-reanimated ~4.1.1` — chart animations are optional and the SVG rendering path does not depend on Reanimated

**New dependencies required** (must install with `npx expo install` per constitution):
- `react-native-svg` — rendering engine for gifted-charts (not yet in package.json)
- `react-native-gifted-charts` — the chart component library

**Alternatives considered**:
- `victory-native` v40+ — requires `@shopify/react-native-skia`, a larger native module that would extend build times and add native binary weight; rejected for MVP
- `react-native-chart-kit` — older project, less maintained, lower quality line charts; rejected
- Custom View-based chart — zero deps but requires custom path math; rejected for scope reasons; revisit if gifted-charts causes issues

---

## Decision 2 — PR Detection Comparison Scope

**Decision**: Compare each logged set against: (a) all historical completed workouts from `useGetWorkoutsQuery()`, AND (b) the current workout's exercise_sets via `useGetWorkoutQuery(workoutId)` cache.

**Rationale**:
- Lifters can PR on Set 3 of a session (e.g., a warm-up set 1 at 135, working set 3 at 155 which is their all-time best)
- Including the current workout's already-logged sets (from `useGetWorkoutQuery` cache) handles this correctly
- The cache may lag by one set (logSet does not invalidate ActiveWorkout), meaning the set immediately prior is occasionally missed — this is an acceptable edge case for MVP and the user will still see the PR badge on the history view after refresh

**Alternatives considered**:
- Historical-only (exclude current session): simpler, but misses intra-session PRs entirely; rejected
- Augmenting with `loggedMap` local state: more accurate but requires deriving exerciseId from loggedMap entries which are keyed by setId — more complex; deferred to a future improvement

---

## Decision 3 — Toast Animation

**Decision**: Use React Native's built-in `Animated` API (not Reanimated) for the slide-down toast.

**Rationale**:
- `react-native-reanimated` v4 introduced breaking API changes (`useSharedValue`, `withTiming` still work but hook signatures changed in some areas)
- The existing codebase uses Reanimated only via `RestTimer.tsx` (which was written for the SDK at the time)
- A slide-down translateY animation is trivial with `Animated.Value` from React Native core — no additional dep, no compatibility risk
- If a future developer wants Reanimated-based toast, it is a self-contained component swap

**Alternatives considered**:
- Reanimated `withTiming`: likely works but riskier given v4 API surface; rejected for this isolated component
- Third-party toast library: over-engineered for a single use case; rejected

---

## Decision 4 — PR Data Architecture

**Decision**: Pure functions in `src/lib/stats/` operating on `WorkoutDetail[]`. No Redux state, no RTK Query additions.

**Rationale**:
- All required data is already fetched by `useGetWorkoutsQuery()` and `useGetWorkoutQuery()`
- PRs are derived facts (not stored facts) — recomputing from source is correct behavior and auto-handles edits to past sets
- `useMemo` is sufficient for memoising expensive scans over workout history at current data volumes (< 200 workouts is typical for a personal-use app)
- Avoids adding a new Redux slice and synchronisation logic

**Alternatives considered**:
- Store PR set IDs in Redux: fast reads but requires invalidation on any set edit; rejected for MVP complexity
- Store PRs server-side: no backend changes in scope; rejected

---

## Decision 5 — Exercise ID Lookup in handleLog

**Decision**: Derive `exerciseId` inside `handleLog` from the existing `workout` state using `workout.workout_exercises.find(we => we.exercise_sets.some(s => s.id === set.id))?.exercise.id`. Do not change the `handleLog` function signature.

**Rationale**:
- `workout` data is already in scope in `active-workout.tsx` via `useGetWorkoutQuery`
- Avoids cascading prop changes through `ExerciseSection` → `SetRow` → callback
- The lookup is O(exercises × sets_per_exercise) which is < 150 operations for any realistic workout — negligible

**Alternatives considered**:
- Add `exerciseId` param to `handleLog`: requires touching 3 call sites and the `ExerciseSection` component interface; more churn for same result; rejected
