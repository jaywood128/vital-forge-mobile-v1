# Component Contracts: 007 Workout History

All components live in `src/components/ui/` or inline in their screen file. Inline is preferred for single-use components; extract to `src/components/ui/` only if reused across screens.

---

## `WorkoutHistoryCard`

**Location**: `src/components/ui/WorkoutHistoryCard.tsx` (shared — may be reused by future dashboard)

**Purpose**: Renders a single completed-workout summary card in the history list.

```ts
type WorkoutHistoryCardProps = {
  workout: WorkoutDetail;
  onPress: () => void;
};
```

**Visual contract**:
- Dark glass-morphism card (`Card` with `variant='dark'`)
- Row 1: formatted date (left, `typography.caption`, `rgba(255,255,255,0.4)`) + exercise count badge (right, `electricBlueLight`)
- Row 2: workout name (`typography.subtitle`, `pureWhite`)
- Row 3: total sets logged (`typography.caption`, `rgba(255,255,255,0.4)`) e.g. "12 sets"
- Entire card is `Pressable` — `onPress` fires tap-to-detail navigation
- Minimum touch target: 44pt (Constitution VI) — card height naturally exceeds this

**Computed props** (derived inside the component):
```ts
const formattedDate = new Date(workout.workout_date).toLocaleDateString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric',
});
const exerciseCount = workout.workout_exercises.length;
const setsLogged = workout.workout_exercises
  .flatMap(e => e.exercise_sets)
  .filter(s => s.completed).length;
```

---

## `ExerciseHistorySection`

**Location**: Inline in `app/workout-detail.tsx` (single-use)

**Purpose**: Renders one exercise's name, muscle-group chip, and its set rows inside the detail screen.

```ts
type ExerciseHistorySectionProps = {
  workoutExercise: WorkoutExerciseDetail;
};
```

**Visual contract**:
- Exercise name: `typography.subtitle`, `pureWhite`
- Muscle group chip: `rgba(74,144,217,0.2)` background, `electricBlueLight` text, `radius.sm` border radius
- Set rows rendered below (see `SetHistoryRow`)

---

## `SetHistoryRow`

**Location**: Inline in `app/workout-detail.tsx` (single-use)

**Purpose**: Renders one logged set with weight × reps or reps-only, plus a success checkmark.

```ts
type SetHistoryRowProps = {
  set: ExerciseSet;
  isBodyweight: boolean;
};
```

**Visual contract**:
- Left: set number (`typography.caption`, `mediumGray`) e.g. "Set 1"
- Centre: weight/reps label (`typography.body`, `pureWhite`)
  - Weighted: `"185 × 8"`
  - Bodyweight: `"12 reps"`
- Right: green checkmark `✓` (`colors.success`)
- Background: `rgba(16,185,129,0.12)` (logged-set row tint), left border `3px solid colors.success`

---

## Existing Primitives Used (no changes needed on 006 base)

| Primitive | Usage |
|---|---|
| `Screen` (dark variant) | Both screens — gradient background |
| `Card` (dark variant) | `WorkoutHistoryCard`, detail exercise sections |
| `Button` | Not used (read-only screens) |
| `TextField` | Not used (read-only screens) |
