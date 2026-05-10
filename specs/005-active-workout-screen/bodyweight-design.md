# Design: Bodyweight Set Rows

**Date:** 2026-05-10
**Branch:** 005-active-workout-screen
**Scope:** `app/active-workout.tsx` only. No backend, API, store, or other screen changes.

---

## Problem

Bodyweight exercises (pull-ups, dips, push-ups) show a weight input requiring `lbs`, which makes no sense. The set row must adapt based on exercise type — reps only by default, with an optional extra weight field for weighted calisthenics.

---

## Detection

`ExerciseSection` passes `isBodyweight={exercise.exercise.equipment === 'Bodyweight'}` as a prop to each `SetRow`. The `equipment` field is already returned by `GET /api/v1/workouts/:id` — no API or backend changes required.

---

## SetRow Changes

### New prop

```typescript
type SetRowProps = {
  // ... existing props
  isBodyweight: boolean;
};
```

### Unlogged state

Both weight and reps inputs render side by side for visual consistency.

**Weight input (bodyweight only):**
- Label above: `+WEIGHT` (replaces `WEIGHT`) with `lbs` below — signals extra/added weight
- Input border: dashed, dimmed — communicates optional without a text label
- Placeholder text: `optional`

**Reps input:** unchanged.

**`canLog` logic:**
- Weighted (existing): `weight.trim().length > 0 && reps.trim().length > 0`
- Bodyweight: `reps.trim().length > 0` — weight field may be blank

### Logged state display

| Scenario | Display |
|---|---|
| Bodyweight, no extra weight | `10 reps ✓` |
| Bodyweight + extra weight | `+25 lbs × 10 reps ✓` |
| Weighted (existing) | `185 lbs × 8 ✓` |

The `+` prefix on extra weight distinguishes it as added weight, not total bodyweight.

### Re-edit behaviour

Tapping a logged bodyweight row:
- Pre-fills reps with the saved value
- Weight field stays empty if no extra weight was logged; pre-fills if extra weight was saved

---

## API Payload

No backend changes. `weight: null` is already valid (`allow_nil: true` on the model).

| Scenario | Payload |
|---|---|
| Bodyweight, no extra weight | `{ exercise_set: { weight: null, reps: 10, completed: true } }` |
| Bodyweight + extra weight | `{ exercise_set: { weight: 25, reps: 10, completed: true } }` |
| Weighted (existing) | `{ exercise_set: { weight: 185, reps: 8, completed: true } }` |

Weight value derived from input: `weight.trim() ? Number(weight) : null`

---

## Input State Initialisation

Bodyweight sets initialise the same way as weighted: `{ weight: '', reps: String(set.reps ?? '') }`. The weight field defaults to empty — users only fill it if adding extra weight.

---

## Tests

Two new cases added to `__tests__/screens/active-workout.test.tsx`:

| Test | Assertion |
|---|---|
| Bodyweight set: `+` enabled with reps only (weight blank) | `canLog` is true when reps filled, weight empty, `isBodyweight` true |
| Bodyweight set logged with no extra weight | Logged row shows `10 reps ✓`, not `lbs` |

---

## Files Changed

| File | Change |
|---|---|
| `app/active-workout.tsx` | Add `isBodyweight` prop to `SetRow`; adapt `canLog`, labels, logged display, payload |

No other files changed.
