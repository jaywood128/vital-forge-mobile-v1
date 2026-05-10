# Bodyweight Set Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt the active workout set row so bodyweight exercises (pull-ups, dips, etc.) show reps as required and weight as optional extra weight, while weighted exercises are unchanged.

**Architecture:** `equipment === 'Bodyweight'` is already in the API response. `ExerciseSection` derives `isBodyweight` from `exercise.exercise.equipment` and passes it as a prop to `SetRow`. `SetRow` branches on `isBodyweight` for `canLog` logic, weight input styling, logged display, and API payload. `LogSetPayload.weight` becomes `number | null` to allow sending `null` for no extra weight.

**Tech Stack:** React Native, TypeScript, RTK Query, `@testing-library/react-native`

---

## File Map

| File | Change |
|---|---|
| `src/features/workouts/exerciseSetsApi.ts` | `LogSetPayload.weight: number` → `number | null` |
| `app/active-workout.tsx` | `LoggedSetData`, `SetRowProps`, `canLog`, weight input UI, logged display, `handleLog` payload, `ExerciseSection` wiring |
| `__tests__/screens/active-workout.test.tsx` | Two new test cases |

---

## Task 1: Widen `LogSetPayload.weight` to `number | null`

**Files:**
- Modify: `src/features/workouts/exerciseSetsApi.ts`

The backend's `exercise_set` model has `validates :weight, allow_nil: true` — `null` is already a valid payload value. The TypeScript type needs to match.

- [ ] **Open `src/features/workouts/exerciseSetsApi.ts` and change `weight: number` to `weight: number | null` in `LogSetPayload`:**

```typescript
export type LogSetPayload = {
  id: number;
  weight: number | null;
  reps: number;
  completed: true;
};
```

- [ ] **Run TypeScript check to confirm no downstream type errors:**

```bash
npx tsc --noEmit
```

Expected: no errors. If errors appear they will be in `active-workout.tsx` where `weight: Number(weight)` is passed — those are fixed in Task 5.

---

## Task 2: Write failing tests

**Files:**
- Modify: `__tests__/screens/active-workout.test.tsx`

Add a `bodyweightWorkout` fixture and two new test cases inside the existing `describe('ActiveWorkoutScreen')` block. Add them after the last existing test (`resume path shows previously logged sets...`).

- [ ] **Add `bodyweightWorkout` fixture after `makeAllSetsCompleted` (line 70):**

```typescript
const bodyweightWorkout = {
  ...baseWorkout,
  workout_exercises: [
    {
      ...baseWorkout.workout_exercises[0],
      exercise: {
        ...baseWorkout.workout_exercises[0].exercise,
        equipment: 'Bodyweight',
      },
    },
  ],
};
```

- [ ] **Add two new tests at the bottom of the `describe` block:**

```typescript
it('bodyweight set: Log button calls logSet with weight null when weight left blank', async () => {
  mockUseGetWorkoutQuery.mockReturnValue({
    data: bodyweightWorkout,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  const { getByText } = render(<ActiveWorkoutScreen />);
  await act(async () => {
    fireEvent.press(getByText('Log'));
  });
  expect(mockLogSetFn).toHaveBeenCalledWith({ id: 1, weight: null, reps: 10, completed: true });
});

it('bodyweight set logged with no extra weight shows reps only', async () => {
  mockUseGetWorkoutQuery.mockReturnValue({
    data: bodyweightWorkout,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  const { getByText, queryByText } = render(<ActiveWorkoutScreen />);
  await act(async () => {
    fireEvent.press(getByText('Log'));
  });
  expect(getByText('10 reps')).toBeTruthy();
  expect(getByText('✓')).toBeTruthy();
  expect(queryByText(/lbs/)).toBeNull();
});
```

- [ ] **Run the new tests to confirm they fail:**

```bash
npx jest --no-coverage __tests__/screens/active-workout.test.tsx 2>&1 | tail -20
```

Expected: 2 failures. The first fails because `logSet` is called with `weight: 0` (not `null`). The second fails because the logged row shows `0 lbs × 10 reps` (not `10 reps`).

---

## Task 3: Add `isBodyweight` prop to `SetRowProps` and update `canLog`

**Files:**
- Modify: `app/active-workout.tsx`

- [ ] **Add `isBodyweight: boolean` to `SetRowProps` type (around line 34):**

```typescript
type SetRowProps = {
  set: ExerciseSet;
  input: SetInputState;
  isLogged: boolean;
  loggedData: LoggedSetData | undefined;
  isLoading: boolean;
  error: string | undefined;
  isBodyweight: boolean;
  onInputChange: (field: 'weight' | 'reps', value: string) => void;
  onLog: () => void;
  onReEdit: () => void;
};
```

- [ ] **Update the `SetRow` function signature to destructure `isBodyweight` (around line 46):**

```typescript
function SetRow({
  set,
  input,
  isLogged,
  loggedData,
  isLoading,
  error,
  isBodyweight,
  onInputChange,
  onLog,
  onReEdit,
}: SetRowProps) {
```

- [ ] **Replace the `canLog` line inside `SetRow` (line 57):**

```typescript
const canLog = isBodyweight
  ? input.reps.trim().length > 0
  : input.weight.trim().length > 0 && input.reps.trim().length > 0;
```

---

## Task 4: Update weight input UI for bodyweight

**Files:**
- Modify: `app/active-workout.tsx`

Add a new style `inputOptional` and conditionally apply it + change the placeholder and accessibility label for bodyweight sets.

- [ ] **Replace the weight `TextInput` block inside `SetRow` (the first `<View style={styles.inputGroup}>` block):**

```tsx
<View style={styles.inputGroup}>
  <TextInput
    style={[styles.input, isBodyweight && styles.inputOptional]}
    value={input.weight}
    onChangeText={(v) => onInputChange('weight', v)}
    placeholder={isBodyweight ? 'optional' : '0'}
    keyboardType="numeric"
    editable={!isLoading}
    accessibilityLabel={
      isBodyweight
        ? `Extra weight for set ${set.set_number}`
        : `Weight for set ${set.set_number}`
    }
  />
  <Text style={[styles.inputUnit, isBodyweight && styles.inputUnitOptional]}>
    {isBodyweight ? '+lbs' : 'lbs'}
  </Text>
</View>
```

- [ ] **Add `inputOptional` and `inputUnitOptional` to the `StyleSheet.create` block at the bottom of the file:**

```typescript
inputOptional: {
  borderStyle: 'dashed',
  borderColor: colors.mediumGray,
  opacity: 0.6,
},
inputUnitOptional: {
  opacity: 0.5,
},
```

---

## Task 5: Update `LoggedSetData` type, logged display, and `handleLog` payload

**Files:**
- Modify: `app/active-workout.tsx`

- [ ] **Update `LoggedSetData` type (around line 28) to allow `null` weight:**

```typescript
type LoggedSetData = { weight: number | null; reps: number };
```

- [ ] **Update the logged row display inside `SetRow` (the `if (isLogged && loggedData)` block, around line 59). Replace the `<Text style={styles.loggedValues}>` line:**

```tsx
<Text style={styles.loggedValues}>
  {isBodyweight
    ? loggedData.weight
      ? `+${loggedData.weight} lbs × ${loggedData.reps} reps`
      : `${loggedData.reps} reps`
    : `${loggedData.weight} lbs × ${loggedData.reps} reps`}
</Text>
```

- [ ] **Update `handleLog` in `ActiveWorkoutScreen` — change the `logSet` call and `loggedMap` update (around lines 238–252). Replace the two relevant lines:**

The call:
```typescript
const promise = logSet({
  id: set.id,
  weight: weight.trim() ? Number(weight) : null,
  reps: Number(reps),
  completed: true,
});
```

The success update:
```typescript
setLoggedMap((prev) => ({
  ...prev,
  [set.id]: { weight: weight.trim() ? Number(weight) : null, reps: Number(reps) },
}));
```

---

## Task 6: Wire `isBodyweight` through `ExerciseSection`

**Files:**
- Modify: `app/active-workout.tsx`

`ExerciseSection` already receives the full `exercise` object — derive `isBodyweight` inside it rather than adding a new prop.

- [ ] **Inside `ExerciseSection` function body, add the derived value before the `return`:**

```typescript
const isBodyweight = exercise.exercise.equipment === 'Bodyweight';
```

- [ ] **Pass `isBodyweight` to every `SetRow` rendered inside `ExerciseSection`. Update the `<SetRow ... />` usage (in the `exercise.exercise_sets.map` block):**

```tsx
<SetRow
  key={set.id}
  set={set}
  input={inputMap[set.id] ?? { weight: '', reps: String(set.reps ?? '') }}
  isLogged={isLogged}
  loggedData={loggedData}
  isLoading={loadingSetId === set.id}
  error={errorMap[set.id]}
  isBodyweight={isBodyweight}
  onInputChange={(field, value) => onInputChange(set.id, field, value)}
  onLog={() => {
    const inp = inputMap[set.id] ?? { weight: '', reps: String(set.reps ?? '') };
    onLog(set, inp.weight, inp.reps);
  }}
  onReEdit={() => onReEdit(set.id)}
/>
```

---

## Task 7: Run all tests and commit

- [ ] **Run the full test suite:**

```bash
npx jest --no-coverage 2>&1 | tail -15
```

Expected:
```
Test Suites: 8 passed, 8 total
Tests:       4 todo, 61 passed, 65 total
```

If any tests fail, check:
- `accessibilityLabel` on the weight input changed from `Weight for set 1` to `Extra weight for set 1` for bodyweight sets — update any test that uses `getByLabelText('Weight for set 1')` if the test exercise now has `equipment: 'Bodyweight'`. The `baseWorkout` fixture uses `equipment: 'Barbell'` so existing tests are unaffected.

- [ ] **Commit:**

```bash
git add app/active-workout.tsx src/features/workouts/exerciseSetsApi.ts __tests__/screens/active-workout.test.tsx
git commit -m "feat(005): bodyweight set rows — reps required, extra weight optional"
```

---

## Self-Review

**Spec coverage:**
- ✅ Detection via `equipment === 'Bodyweight'` → Task 6
- ✅ Weight optional, reps required for bodyweight → Task 3 (`canLog`)
- ✅ Weight input: optional styling, `+lbs` label → Task 4
- ✅ Logged (no extra weight): `10 reps ✓` → Task 5
- ✅ Logged (extra weight): `+25 lbs × 10 reps ✓` → Task 5
- ✅ Payload `weight: null` when blank → Task 5
- ✅ Payload `weight: 25` when entered → Task 5
- ✅ Re-edit: weight pre-fills if previously saved (existing `handleReEdit` + `inputMap` seed handles this — weight field pre-fills from `set.weight` on API-logged sets, stays empty for locally-logged null weight) ✅
- ✅ Two new tests → Task 2

**Placeholder scan:** No TBDs. All code blocks complete.

**Type consistency:**
- `LogSetPayload.weight: number | null` — Task 1
- `LoggedSetData.weight: number | null` — Task 5
- `SetRowProps.isBodyweight: boolean` — Task 3, used in Tasks 4, 5, 6
- All consistent across tasks ✅
