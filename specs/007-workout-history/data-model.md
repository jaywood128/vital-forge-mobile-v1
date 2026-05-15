# Data Model: 007 Workout History

**Branch**: `007-workout-history` | **Date**: 2026-05-14

No new backend entities. All data is read-only from the existing Rails API. This document describes confirmed API response shapes and the TypeScript type changes needed in `workoutsApi.ts`.

---

## Confirmed API Shape (from `workouts_controller.rb`)

Both `GET /api/v1/workouts` (list) and `GET /api/v1/workouts/:id` (detail) use the same `serialize_workout_with_exercises` serializer. The list endpoint **already returns** full exercise and set data — the current `Workout` / `WorkoutExercise` frontend types are simply under-typed.

Confirmed fields returned by the list endpoint per exercise:

```
exercise_sets: [{ id, set_number, reps, weight, weight_unit, rpe, to_failure, notes, completed }]
exercise: { id, name, muscle_group, equipment, exercise_type }
```

---

## Type Changes to `workoutsApi.ts`

### 1. Update `getWorkouts` return type to `WorkoutDetail[]`

The list and detail endpoints return the same shape. `WorkoutDetail` (already typed) covers the full response. Change `getWorkouts` return type from `Workout[]` to `WorkoutDetail[]`.

**Impact on existing consumers**: `home.tsx` uses `useGetWorkoutsQuery()` — verify it only accesses fields present on both `Workout` and `WorkoutDetail` (id, name, completed, workout_date, workout_template_id, workout_exercises). It does — no breaking change.

### 2. No new types needed

`WorkoutDetail` and `WorkoutExerciseDetail` (both already in `workoutsApi.ts`) cover everything the history screens need:

```ts
// Already exists — no changes needed to the type itself
type WorkoutDetail = {
  id: number;
  name: string;
  completed: boolean;
  started_at: string | null;
  completed_at: string | null;
  workout_date: string;           // ISO string → format as "Thu, May 14"
  workout_template_id: number | null;
  workout_exercises: WorkoutExerciseDetail[];
};

type WorkoutExerciseDetail = {
  id: number;
  order_position: number;
  notes: string | null;
  rest_between_sets: number | null;
  completed: boolean;
  exercise: {
    id: number;
    name: string;
    muscle_group: string | null;
    equipment: string | null;
    exercise_type: string | null;   // 'bodyweight' → show reps only
  };
  exercise_sets: ExerciseSet[];
};

type ExerciseSet = {
  id: number;
  set_number: number;
  reps: number | null;
  weight: number | null;
  weight_unit: string | null;
  rpe: number | null;
  to_failure: boolean;
  notes: string | null;
  completed: boolean;
};
```

---

## Derived Display Values (computed in screen, not stored)

| Display field | Source | Formula |
|---|---|---|
| Formatted date | `workout.workout_date` | `new Date(workout_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })` |
| Exercise count | `workout.workout_exercises` | `.length` |
| Total sets logged | `workout.workout_exercises` | `.flatMap(e => e.exercise_sets).filter(s => s.completed).length` |
| Is bodyweight | `exercise.exercise_type` | `=== 'bodyweight'` (fallback: `weight === null \|\| weight === 0`) |
| Set display label | `set.weight`, `set.reps` | bodyweight → `"12 reps"`, weighted → `"185 × 8"` |

---

## RTK Query Endpoints (existing — no new endpoints)

| Hook | Endpoint | Return type (after update) | Used by |
|---|---|---|---|
| `useGetWorkoutsQuery()` | `GET /api/v1/workouts` | `WorkoutDetail[]` | History List — filter `completed === true` |
| `useGetWorkoutQuery(id)` | `GET /api/v1/workouts/:id` | `WorkoutDetail` | Workout Detail screen |

---

## State

Both screens are **read-only**. No mutations. No cache invalidation triggered.

- History list: cached under `['Workouts']` tag; back-navigation from detail is a cache hit — zero re-fetch.
- Workout detail: cached under `[{ type: 'ActiveWorkout', id }]`.
