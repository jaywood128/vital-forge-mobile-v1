# Implementation Plan: Active Workout Screen

**Branch**: `005-active-workout-screen` | **Date**: 2026-05-08 | **Spec**: [spec.md](./spec.md)

## Summary

Build the active workout screen where users log weight and reps per set in real time. The screen is reached by tapping "Start Workout" on the exercise preview screen (004) or "Resume Workout" on the dashboard. No backend changes required — all API endpoints are already built.

This is a **mobile-only** feature touching one codebase: `vital-forge-mobile-v1`.

---

## Technical Context

**Language/Version**: TypeScript 5.9 strict / React Native 0.81
**Primary Dependencies**: RTK Query, Expo Router 6, StyleSheet + src/theme tokens
**Storage**: No new storage — reads and patches existing backend records
**Testing**: Jest + React Native Testing Library
**Target Platform**: iOS + Android via Expo SDK 54
**Performance Goals**: Set save round-trip < 2s · Finish Workout < 3s
**Constraints**: No new native packages · All RTK Query · FlatList for exercise list · Theme tokens only

---

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. Design System | ✅ Pass | All styles via `src/theme/` tokens; no hardcoded hex |
| II. Component Architecture | ✅ Pass | New screen uses Screen, Card, Button primitives; exercise list via FlatList |
| III. Navigation | ✅ Pass | New route `app/active-workout.tsx`; registered in `_layout.tsx` |
| IV. RTK Query | ✅ Pass | All server data via RTK Query hooks; no `useState` for server state |
| V. Auth / API base | ✅ Pass | Uses existing `baseQuery` with JWT header injection |
| VI. Touch targets | ✅ Pass | Set row inputs and Log button must meet 44pt minimum |
| VII. Long lists | ✅ Pass | Exercise list uses `FlatList`; set rows within each exercise are small fixed count (≤ 6) |
| VIII. TypeScript strict | ✅ Pass | All new types explicitly defined; no implicit `any` |

---

## Known API Bug to Fix First

`workoutsApi.ts` has a `logSet` mutation pointing to a non-existent endpoint:

```typescript
// Current (wrong — this route does not exist)
url: `/api/v1/workouts/${workoutId}/sets`, method: 'POST'

// Correct
url: `/api/v1/exercise_sets/${exerciseSetId}`, method: 'PATCH'
```

This must be fixed in Step 1 before building the screen.

---

## Project Structure

### Documentation (this feature)

```text
specs/005-active-workout-screen/
├── plan.md              ← this file
├── spec.md
├── contracts/
│   └── api-backend.md   ← API contract (read-only reference)
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Mobile source changes (`vital-forge-mobile-v1`)

```text
app/
├── _layout.tsx                    (updated — register active-workout route)
├── active-workout.tsx             (new screen)
├── workout-preview.tsx            (updated — navigate to active-workout on success)
└── home.tsx                       (updated — fix Resume Workout navigation)

src/features/workouts/
├── workoutsApi.ts                 (updated — add getWorkout query, fix types, remove broken logSet)
└── exerciseSetsApi.ts             (new — PATCH /api/v1/exercise_sets/:id)

__tests__/screens/
└── active-workout.test.tsx        (new)
```

---

## Phase 1: API Layer

### Step 1 — Fix and extend `workoutsApi.ts`

**Remove** the broken `logSet` mutation.

**Add** `getWorkout` query with full nested types:

```typescript
export type ExerciseSet = {
  id: number;
  set_number: number;
  reps: number | null;
  weight: number | null;
  weight_unit: string | null;
  rpe: number | null;  // retained in type — backend returns it; NOT sent in LogSetPayload (deferred to backlog)
  to_failure: boolean;
  notes: string | null;
  completed: boolean;
};

export type WorkoutExercise = {
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
    exercise_type: string | null;
  };
  exercise_sets: ExerciseSet[];
};

export type WorkoutDetail = {
  id: number;
  name: string;
  completed: boolean;
  started_at: string | null;
  completed_at: string | null;
  workout_date: string;
  workout_template_id: number | null;
  workout_exercises: WorkoutExercise[];
};
```

Add `getWorkout` endpoint:
```typescript
getWorkout: builder.query<WorkoutDetail, number>({
  query: (id) => `/api/v1/workouts/${id}`,
  transformResponse: (response: { data: WorkoutDetail }) => response.data,
  providesTags: (_result, _err, id) => [{ type: 'ActiveWorkout', id }],
}),
```

### Step 2 — Create `exerciseSetsApi.ts`

New RTK Query slice for the exercise set update endpoint:

```typescript
export type LogSetPayload = {
  id: number;
  weight: number;
  reps: number;
  completed: true;
};

export const exerciseSetsApi = createApi({
  reducerPath: 'exerciseSetsApi',
  baseQuery,
  endpoints: (builder) => ({
    logSet: builder.mutation<{ exercise_set: ExerciseSet }, LogSetPayload>({
      query: ({ id, ...body }) => ({
        url: `/api/v1/exercise_sets/${id}`,
        method: 'PATCH',
        body: { exercise_set: { ...body, completed: true } },
      }),
    }),
  }),
});

export const { useLogSetMutation } = exerciseSetsApi;
```

Register the reducer and middleware in `src/store/store.ts`.

---

## Phase 2: Screen Implementation

### Step 3 — New screen `app/active-workout.tsx`

**Route params**: `workoutId: string`

**Data flow**:
- `useGetWorkoutQuery(Number(workoutId))` — fetches the full workout with exercises and sets
- `useCompleteWorkoutMutation()` — finishes the workout
- `useLogSetMutation()` (from exerciseSetsApi) — patches individual sets

**Screen structure**:
```
<Screen scrollable>
  <Card>                          ← header
    workout.name
    "Day X — {day name}"         ← derive from workout name or pass as nav param
  </Card>

  <FlatList                       ← exercise list
    data={workout.workout_exercises}
    renderItem={ExerciseSection}
  />

  <View sticky footer>
    <Button "Finish Workout" />
  </View>
</Screen>
```

**`ExerciseSection` component** (inline — single use in this screen):
```
exercise.name + muscle group chip
FlatList (or .map — sets are ≤ 6, fixed count)
  SetRow for each exercise_set
```

**`SetRow` component** (inline):
```
Set {set_number}  |  Weight [____] lbs  |  Reps [____]  |  [Log] button

After logged:
✓  {weight}lbs × {reps}       ← green tint background, tap to re-edit
```

**Logging flow**:
1. User taps set row — inputs become active (or inline editing always visible)
2. User enters weight and reps
3. Taps "Log" — calls `logSet({ id: set.id, weight, reps, completed: true })`
4. On success — row shows logged values with green tint; row remains tappable to re-edit (backend allows PATCH on completed sets)
5. On failure — inline error on the row, values preserved, retry available

**Finish Workout flow**:
1. Check if all sets are logged (`every set.completed === true`)
2. If not all logged → `Alert.alert('End workout early?', ..., [Cancel, Finish])`
3. If all logged → call `completeWorkout(workoutId)` directly (no prompt)
4. On success → `router.replace('/home')`
5. On failure → `Alert.alert` with error, stay on screen

### Step 4 — Update `app/workout-preview.tsx`

Replace the Feature 005 placeholder navigation with the real route:

```typescript
// Before
router.replace('/home');

// After
router.replace({ pathname: '/active-workout', params: { workoutId: String(result.workout.id) } });
```

Also update the 409 Resume alert to pass the `active_workout_id`:
```typescript
onPress: () => router.replace({
  pathname: '/active-workout',
  params: { workoutId: String(err.data.active_workout_id) }
})
```

### Step 5 — Update `app/home.tsx`

Fix the `handleResumePress` placeholder to navigate to the active workout screen.

The `getWorkouts` query already runs on home load. Filter for the in-progress workout:
```typescript
const activeWorkout = workouts?.find(
  w => !w.completed && w.started_at !== null && w.workout_template_id === templateId
);

const handleResumePress = () => {
  if (activeWorkout) {
    router.push({ pathname: '/active-workout', params: { workoutId: String(activeWorkout.id) } });
  }
};
```

### Step 6 — Register route in `_layout.tsx`

Add:
```tsx
<Stack.Screen name="active-workout" options={{ title: 'Active Workout', headerShown: false }} />
```

---

## Phase 3: Tests

### `__tests__/screens/active-workout.test.tsx` (new)

Key cases to cover:

| Test | What it verifies |
|---|---|
| Renders exercise list | Exercise names and set rows visible after load |
| Shows loading state | ActivityIndicator shown while fetch in-flight |
| Shows error state | Error message + retry button on fetch failure |
| Log button calls correct endpoint | `PATCH /api/v1/exercise_sets/:id` with correct payload |
| Log button disabled during save | Prevents double-tap |
| Set row shows logged values after save | Green tint display; tap again to re-edit |
| Finish Workout — all sets logged | Calls complete directly, no prompt |
| Finish Workout — partial sets | Shows "End workout early?" confirmation |
| Finish Workout — navigates to home | `router.replace('/home')` called on success |
| Finish Workout — failure | Error alert shown, user stays on screen |

---

## Complexity Tracking

No constitution violations. No unjustified complexity. All data flows through RTK Query — no local state for server data.

The only local state needed:
- Per-set `weight` and `reps` input values (controlled inputs, `useState` at screen level keyed by `exerciseSetId` — NOT local to each set row, so values survive FlatList virtualisation on scroll)
- This is legitimate UI state — not server state — so `useState` is correct here
