# Data Model: Personal Records + Exercise Progress Charts

**Branch**: `011-personal-records-progress` | **Date**: 2026-05-19

## Overview

No new database tables. No new API endpoints. All data is derived client-side from the existing `WorkoutDetail[]` payload already fetched by `useGetWorkoutsQuery()`.

⚠️ **Known limitation**: This design assumes the full workout history is loaded. When pagination is added to `GET /api/v1/workouts`, migrate to a server-side `personal_records` table. See backlog ADR.

---

## Derived Types (TypeScript — new)

### `CurrentBests`
The all-time best numbers for one exercise, derived by scanning full history.

```typescript
type CurrentBests = {
  best1RM: number | null;  // null = no sets logged yet for this exercise
};
```

### `ExerciseSeriesPoint`
One data point on the progress chart — one session's metric value.

```typescript
type ExerciseSeriesPoint = {
  x: string;   // workout_date (ISO date string — used as x-axis label)
  y: number;   // the metric value for that session
};
```

`metric` is one of: `'maxWeight' | '1rm' | 'volume'`

### `PRToastState`
Local state in `active-workout.tsx` controlling the toast display.

```typescript
type PRToastState = {
  visible: boolean;
  exerciseName: string;
  previous1RM: number;
  current1RM: number;
} | null;
```

---

## Existing Types Used (no changes)

| Type | Source | Fields used by this feature |
|---|---|---|
| `WorkoutDetail` | `workoutsApi.ts` | `id`, `workout_date`, `completed`, `workout_exercises` |
| `WorkoutExerciseDetail` | `workoutsApi.ts` | `exercise.id`, `exercise.name`, `exercise.exercise_type`, `exercise_sets` |
| `ExerciseSet` | `workoutsApi.ts` | `id`, `weight`, `reps`, `completed` |

---

## Computation Rules

### Epley 1RM
```
estimated1RM = weight × (1 + reps / 30)
Skip if: weight is null, weight ≤ 0, reps ≤ 0
```

### PR Detection (chronological scan)
```
Sort workouts by workout_date ascending
For each workout → each workout_exercise → each completed set (weight > 0, reps > 0):
  If no prior sets for this exercise_id → skip (first-ever log, no PR)
  If calculateEpley1RM(set.weight, set.reps) > currentMax for this exercise → mark set.id as PR
  Update currentMax
Returns: Set<number> of all PR set IDs
```

### Session Volume
```
volume = sum(weight × reps) for all completed sets of the exercise in one workout
```

### Max Weight (per session)
```
maxWeight = max(weight) across all completed sets of the exercise in one workout
```
