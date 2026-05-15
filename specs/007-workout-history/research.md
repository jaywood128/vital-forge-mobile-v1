# Research: 007 Workout History

**Branch**: `007-workout-history` | **Date**: 2026-05-14

---

## 1. Dark Theme Token Dependency

**Decision**: Add `navyDeep`, `navyMid`, `navyCard`, `navyInput`, `electricBlueLight` to `src/theme/colors.ts` on this branch.

**Rationale**: These tokens exist on `006-ui-redesign` but not on `development` (the base of this branch). The spec requires the deep navy dark theme. Adding them here causes a trivial merge conflict when 006 lands on `development` — both sides set identical values, resolved in seconds.

**Alternatives considered**:
- Wait for 006 to merge before starting 007 — rejected; blocks progress unnecessarily
- Use raw hex strings inline — violates Constitution I (no hardcoded hex in screens)

---

## 2. Workout List Endpoint — Type Gap

**Decision**: Define a `HistoryWorkoutExercise` type that extends `WorkoutExercise` with `exercise_sets: ExerciseSet[]` and `exercise: { name: string; muscle_group: string | null }`. Compute "total sets logged" as `workout_exercises.flatMap(e => e.exercise_sets).filter(s => s.completed).length`.

**Rationale**: The spec states "GET /api/v1/workouts returns all completed workouts with exercises and sets — no backend changes needed." The existing `WorkoutExercise` type is a minimal shape written only for the home screen. `ExerciseSet` is already typed in `workoutsApi.ts`. The Rails serializer likely includes sets in the list response; the frontend type just hasn't been extended. `WorkoutExerciseDetail` (used by `getWorkout`) already types `exercise_sets: ExerciseSet[]`, confirming the shape exists server-side.

**Fallback**: If the API does not return sets in the list response, the card omits the sets badge and shows exercise count only — graceful degradation, not a crash.

**Alternatives considered**:
- Call `getWorkout(id)` per list card to get sets — N+1 API problem, rejected
- Add `sets_count` to the Rails serializer — rejected (no backend changes allowed)

---

## 3. Expo Router — Passing Workout ID to Detail Screen

**Decision**: Navigate via `router.push('/workout-detail?id=<id>')`. Read in the detail screen with `useLocalSearchParams<{ id: string }>()`, parse with `Number(id)`.

**Rationale**: Idiomatic Expo Router 6 pattern, consistent with `workout-preview.tsx` and `active-workout.tsx`. No Redux state or context needed for a scalar navigation param.

**Alternatives considered**:
- Redux store for selected workout ID — overkill for read-only navigation
- `router.push({ pathname, params })` object form — equivalent, less readable URL

---

## 4. Screen Component — Dark Gradient on Development Base

**Decision**: Add `variant?: 'light' | 'dark'` to `Screen`, defaulting to `'dark'`. Dark variant wraps children in `LinearGradient colors={[colors.navyDeep, colors.navyMid]}`. Mirror 006 exactly.

**Rationale**: `Screen.tsx` on `development` only supports `'light'`. Mirroring 006 means when `development` (post-006) merges into 007, the conflict is identical code on both sides — accept either side, done in seconds.

---

## 5. Card Component — Glass-Morphism Dark Variant

**Decision**: Add `variant?: 'light' | 'dark'` to `Card`. Dark: `rgba(255,255,255,0.06)` background, `rgba(255,255,255,0.10)` border. Mirror 006 exactly.

**Rationale**: Same merge-conflict reasoning as Screen. No visual difference between 006 and 007 implementations.

---

## 6. FlatList for History List (Constitution VII)

**Decision**: `FlatList<HistoryWorkout>` with `keyExtractor={item => item.id.toString()}`.

**Rationale**: Constitution VII mandates FlatList for variable-length lists. A dedicated user can accumulate 150–200 workouts over a year. `ScrollView + map` renders all items simultaneously and keeps them in memory; `FlatList` virtualises the list — only on-screen items exist in the component tree at any moment. Memory stays flat regardless of list length. No performance tuning needed at MVP scale.

---

## 7. Date Formatting

**Decision**: `new Date(workout_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })` → "Thu, May 14".

**Rationale**: Matches the spec format exactly. No library needed. `toLocaleDateString` is available in the Hermes JS engine (Expo default).

**Alternatives considered**: `date-fns`, `dayjs` — unnecessary dependencies for one format string.

---

## 8. Bodyweight Exercise Detection

**Decision**: Treat as bodyweight when `exercise.exercise_type === 'bodyweight'`. Show reps only (no weight). Fallback: `weight === null || weight === 0`.

**Rationale**: `exercise_type` is the semantic source of truth on `WorkoutExerciseDetail.exercise`. Null/zero weight is a safe secondary fallback if the field is absent.
