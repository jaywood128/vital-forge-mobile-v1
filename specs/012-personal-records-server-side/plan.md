# PR Summary Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After completing a workout, show a celebratory modal listing new personal records before navigating home, and fix the during-workout badge so only the best set per exercise is badged.

**Architecture:** Backend `persist_prs` returns newly created PRs in the `complete` response. Mobile stores these in state, shows a `PRSummaryModal` (React Native `Modal`) with animated confetti dots and per-PR cards, then navigates home on dismiss. Badge logic is fixed client-side to show only one badge per exercise (the current session best).

**Tech Stack:** Ruby on Rails (backend), React Native 0.81 + Expo SDK 54, RTK Query, React Native `Animated` API, `expo-haptics` (already installed).

---

## File Map

| File | Change |
|------|--------|
| `vital-forge-v1/app/controllers/api/v1/workouts_controller.rb` | `persist_prs` returns new PR array; `complete` includes it in response |
| `vital-forge-v1/spec/requests/api/v1/workouts_spec.rb` | Add assertion for `new_personal_records` in complete response |
| `vital-forge-mobile-v1/src/features/workouts/workoutsApi.ts` | Add `NewPersonalRecord` type; update `completeWorkout` return type |
| `vital-forge-mobile-v1/src/components/PRSummaryModal.tsx` | New — hybrid celebration modal component |
| `vital-forge-mobile-v1/app/active-workout.tsx` | Fix badge logic; add modal state; update `handleFinishWorkout` |

---

## Task 1: Backend — return new PRs from complete endpoint

**Files:**
- Modify: `vital-forge-v1/app/controllers/api/v1/workouts_controller.rb`

- [ ] **Step 1: Update `persist_prs` to return newly created PRs**

Replace the current `persist_prs` method (it currently returns nothing):

```ruby
def persist_prs(workout)
  exercise_ids = workout.workout_exercises.map(&:exercise_id)
  current_bests = PersonalRecord
    .where(user_id: workout.user_id, exercise_id: exercise_ids)
    .group_by(&:exercise_id)
    .transform_values { |prs| prs.max_by(&:estimated_1rm) }

  new_prs = []

  workout.workout_exercises
         .includes(:exercise, :exercise_sets)
         .each do |we|
    best_set = we.exercise_sets
                 .select { |s| s.completed? && s.weight.present? && s.weight > 0 && s.reps.present? && s.reps > 0 }
                 .max_by { |s| epley_1rm(s.weight, s.reps) }
    next unless best_set

    new_1rm = epley_1rm(best_set.weight, best_set.reps)
    current_best = current_bests[we.exercise_id]
    next if current_best && new_1rm <= current_best.estimated_1rm

    PersonalRecord.create!(
      user_id:         workout.user_id,
      exercise_id:     we.exercise_id,
      exercise_set_id: best_set.id,
      estimated_1rm:   new_1rm.round(2),
      weight:          best_set.weight,
      reps:            best_set.reps,
      recorded_at:     workout.completed_at || Time.current
    )

    new_prs << {
      exercise_name: we.exercise.name,
      weight:        best_set.weight.to_f,
      reps:          best_set.reps,
      estimated_1rm: new_1rm.round(2),
      previous_best: current_best&.estimated_1rm&.to_f
    }
  end

  new_prs
end
```

- [ ] **Step 2: Update `complete` action to include new PRs in response**

```ruby
def complete
  workout = current_user.workouts.find(params[:id])
  workout.complete! unless workout.completed?
  new_prs = persist_prs(workout)
  render json: {
    workout: serialize_workout(workout),
    new_personal_records: new_prs
  }, status: :ok
rescue ActiveRecord::RecordNotFound
  render json: { error: "Workout not found" }, status: :not_found
rescue Workout::InvalidTransition => e
  render json: { error: e.message }, status: :unprocessable_entity
rescue ActiveRecord::RecordInvalid => e
  render json: { errors: e.record.errors.to_hash(true) }, status: :unprocessable_entity
end
```

---

## Task 2: Backend — update specs for new response shape

**Files:**
- Modify: `vital-forge-v1/spec/requests/api/v1/workouts_spec.rb`

- [ ] **Step 1: Add `new_personal_records` assertion to the complete action success spec**

Find the test `'marks workout complete for the user (JWT)'` and add:

```ruby
it 'marks workout complete for the user (JWT)' do
  patch "/api/v1/workouts/#{workout.id}/complete",
        headers: { 'Authorization' => "Bearer #{jwt_token}" },
        as: :json

  expect(response).to have_http_status(:ok)
  workout.reload
  expect(workout.completed).to be(true)
  expect(workout.completed_at).not_to be_nil
  expect(workout.duration_minutes).to be >= 1
  body = JSON.parse(response.body)
  expect(body).to have_key('new_personal_records')
  expect(body['new_personal_records']).to be_an(Array)
end
```

- [ ] **Step 2: Add a spec asserting new PRs are returned when a PR is set**

Add inside the `context 'PR persistence'` block, after the existing three PR specs:

```ruby
it 'returns new_personal_records in the complete response when a PR is set' do
  w = build_workout_with_set(weight: 225, reps: 5)

  patch "/api/v1/workouts/#{w.id}/complete",
        headers: { 'Authorization' => "Bearer #{pr_token}" }, as: :json

  expect(response).to have_http_status(:ok)
  body = JSON.parse(response.body)
  prs = body['new_personal_records']
  expect(prs.length).to eq(1)
  expect(prs.first['exercise_name']).to eq('Squat')
  expect(prs.first['weight']).to eq(225.0)
  expect(prs.first['reps']).to eq(5)
  expect(prs.first['estimated_1rm']).to be > 225
  expect(prs.first['previous_best']).to be_nil
end

it 'returns empty new_personal_records when no PR is set' do
  existing_set = nil
  w_old = build_workout_with_set(weight: 315, reps: 5)
  w_old.workout_exercises.first.exercise_sets.first.tap { |s| existing_set = s }
  PersonalRecord.create!(
    user: pr_user, exercise: exercise, exercise_set: existing_set,
    estimated_1rm: 365.00, weight: 315, reps: 5, recorded_at: 1.week.ago
  )
  w = build_workout_with_set(weight: 225, reps: 5)

  patch "/api/v1/workouts/#{w.id}/complete",
        headers: { 'Authorization' => "Bearer #{pr_token}" }, as: :json

  body = JSON.parse(response.body)
  expect(body['new_personal_records']).to eq([])
end
```

- [ ] **Step 3: Run the backend specs and confirm all pass**

```bash
bundle exec rspec spec/requests/api/v1/workouts_spec.rb
```

Expected: all green.

- [ ] **Step 4: Commit backend changes**

```bash
git add app/controllers/api/v1/workouts_controller.rb \
        spec/requests/api/v1/workouts_spec.rb
git commit -m "feat(012): return new_personal_records in complete workout response"
```

---

## Task 3: Mobile — add NewPersonalRecord type and update completeWorkout

**Files:**
- Modify: `vital-forge-mobile-v1/src/features/workouts/workoutsApi.ts`

- [ ] **Step 1: Add `NewPersonalRecord` type and update `completeWorkout` return type**

Add the type after the existing `PersonalRecord` type (around line 86):

```typescript
export type NewPersonalRecord = {
  exercise_name: string;
  weight: number;
  reps: number;
  estimated_1rm: number;
  previous_best: number | null;
};
```

Update the `completeWorkout` mutation signature from:

```typescript
completeWorkout: builder.mutation<{ workout: Workout }, number>({
```

to:

```typescript
completeWorkout: builder.mutation<{ workout: Workout; new_personal_records: NewPersonalRecord[] }, number>({
```

---

## Task 4: Mobile — build PRSummaryModal component

**Files:**
- Create: `vital-forge-mobile-v1/src/components/PRSummaryModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '../theme';
import { NewPersonalRecord } from '../features/workouts/workoutsApi';

type Props = {
  prs: NewPersonalRecord[];
  onDone: () => void;
};

const DOT_COLORS = [
  colors.energeticOrange,
  colors.electricBlueLight,
  colors.success,
  colors.energeticOrange,
  '#A78BFA',
  colors.electricBlueLight,
  colors.energeticOrange,
];

export default function PRSummaryModal({ prs, onDone }: Props) {
  const scale   = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dots    = useRef(DOT_COLORS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 90, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    // Staggered bounce loop per dot
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    dots.forEach((dot, i) => {
      const loop = () => {
        Animated.sequence([
          Animated.timing(dot, { toValue: -8, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue:  0, duration: 280, useNativeDriver: true }),
        ]).start(({ finished }) => { if (finished) loop(); });
      };
      timeouts.push(setTimeout(loop, i * 100));
    });

    return () => {
      timeouts.forEach(clearTimeout);
      dots.forEach((d) => d.stopAnimation());
    };
  }, []);

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>

          {/* Confetti dots */}
          <View style={styles.dotsRow}>
            {dots.map((dot, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: DOT_COLORS[i], transform: [{ translateY: dot }] },
                ]}
              />
            ))}
          </View>

          {/* Header */}
          <Text style={styles.heroText}>You crushed it.</Text>
          <Text style={styles.heroSub}>
            {prs.length} New Personal Record{prs.length !== 1 ? 's' : ''}
          </Text>

          {/* Streak pill */}
          <View style={styles.streakPill}>
            <Text style={styles.streakText}>🔥 Keep the streak alive</Text>
          </View>

          <View style={styles.divider} />

          {/* PR cards */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {prs.map((pr, i) => (
              <View key={i} style={styles.prCard}>
                <View style={styles.prLeft}>
                  <Text style={styles.prExercise}>{pr.exercise_name}</Text>
                  <Text style={styles.prSet}>
                    {pr.weight} lbs × {pr.reps} reps
                  </Text>
                  {pr.previous_best === null ? (
                    <Text style={styles.prFirst}>✦ First PR</Text>
                  ) : (
                    <Text style={styles.prDelta}>
                      ↑ {Math.round(pr.estimated_1rm - pr.previous_best)} lbs from{' '}
                      {Math.round(pr.previous_best)}
                    </Text>
                  )}
                </View>
                <View style={styles.pr1rmCol}>
                  <Text style={styles.pr1rm}>{Math.round(pr.estimated_1rm)}</Text>
                  <Text style={styles.pr1rmLabel}>est. 1RM lbs</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* CTA */}
          <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>🎉 Done — keep it up!</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: '#111E35',
    borderRadius: radius.lg + 4,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    maxHeight: '85%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  heroText: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.pureWhite,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.energeticOrange,
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: 0.4,
  },
  streakPill: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  streakText: {
    backgroundColor: 'rgba(245,166,35,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.3)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '700',
    color: colors.energeticOrange,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.md,
  },
  scroll: {
    maxHeight: 280,
  },
  scrollContent: {
    gap: spacing.sm,
  },
  prCard: {
    backgroundColor: 'rgba(245,166,35,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.20)',
    borderLeftWidth: 3,
    borderLeftColor: colors.energeticOrange,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  prLeft: {
    flex: 1,
  },
  prExercise: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.pureWhite,
    marginBottom: 3,
  },
  prSet: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  prFirst: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  prDelta: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.energeticOrange,
  },
  pr1rmCol: {
    alignItems: 'flex-end',
  },
  pr1rm: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.energeticOrange,
    lineHeight: 30,
  },
  pr1rmLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: colors.energeticOrange,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: colors.energeticOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.pureWhite,
    letterSpacing: 0.3,
  },
});
```

---

## Task 5: Mobile — fix badge logic and wire up modal in active-workout

**Files:**
- Modify: `vital-forge-mobile-v1/app/active-workout.tsx`

- [ ] **Step 1: Add `NewPersonalRecord` import**

Update the workoutsApi import line to include `NewPersonalRecord`:

```typescript
import {
  useGetWorkoutQuery,
  useGetPersonalRecordsQuery,
  useCompleteWorkoutMutation,
  useLogSetMutation,
  type WorkoutExerciseDetail,
  type ExerciseSet,
  type NewPersonalRecord,
} from '../src/features/workouts/workoutsApi';
```

And add the `PRSummaryModal` import:

```typescript
import PRSummaryModal from '../src/components/PRSummaryModal';
```

- [ ] **Step 2: Add `prSummaryData` state**

After the existing `prToastState` state line, add:

```typescript
const [prSummaryData, setPrSummaryData] = useState<NewPersonalRecord[] | null>(null);
```

- [ ] **Step 3: Fix `derivedPrSetIds` — badge only the best set per exercise**

Replace the current `derivedPrSetIds` useMemo with:

```typescript
const derivedPrSetIds = useMemo((): ReadonlySet<number> => {
  if (!workout) return new Set();
  const bestByExercise: Record<number, number> = {};
  personalRecords.forEach((pr) => {
    const cur = bestByExercise[pr.exercise_id] ?? 0;
    if (pr.estimated_1rm > cur) bestByExercise[pr.exercise_id] = pr.estimated_1rm;
  });
  const ids = new Set<number>();
  workout.workout_exercises.forEach((we) => {
    const storedBest = bestByExercise[we.exercise.id] ?? null;
    const completedSets = we.exercise_sets.filter(
      (s) => s.completed && s.weight != null && s.weight > 0 && s.reps != null && s.reps > 0
    );
    if (completedSets.length === 0) return;
    const bestSet = completedSets.reduce((best, s) => {
      const rm = s.reps! === 1 ? s.weight! : s.weight! * (1 + s.reps! / 30);
      const bRm = best.reps! === 1 ? best.weight! : best.weight! * (1 + best.reps! / 30);
      return rm > bRm ? s : best;
    });
    const bestRm = bestSet.reps! === 1 ? bestSet.weight! : bestSet.weight! * (1 + bestSet.reps! / 30);
    if (storedBest === null || bestRm > storedBest) ids.add(bestSet.id);
  });
  return ids;
}, [workout, personalRecords]);
```

- [ ] **Step 4: Fix `sessionPrSetIds` update in `handleLog` — badge moves to new best**

Replace the `setPrSetIds` call inside `handleLog` (the `if (pr.is_new_pr)` block) with:

```typescript
const pr = result.personal_record;
if (pr.is_new_pr) {
  const we = workout?.workout_exercises.find((w) =>
    w.exercise_sets.some((s) => s.id === set.id)
  );
  if (we) {
    // Badge moves: remove previous session PR for this exercise, add the new best
    const exerciseSetIds = new Set(we.exercise_sets.map((s) => s.id));
    setSessionPrSetIds((prev) => {
      const next = new Set([...prev].filter((id) => !exerciseSetIds.has(id)));
      next.add(set.id);
      return next;
    });
    setPrToastState({
      exerciseName: we.exercise.name,
      previous1RM: pr.previous_estimated_1rm ?? 0,
      current1RM: pr.new_estimated_1rm ?? 0,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}
```

- [ ] **Step 5: Update `handleFinishWorkout` to show modal on PR**

Replace the `doComplete` inner function:

```typescript
const doComplete = async () => {
  try {
    const result = await completeWorkout(workoutIdNum).unwrap();
    if (result.new_personal_records.length > 0) {
      setPrSummaryData(result.new_personal_records);
    } else {
      router.replace('/home');
    }
  } catch (err: any) {
    // 422 = already completed via auto-complete callbacks. Treat as success, no PRs to show.
    if (err?.status === 422) {
      router.replace('/home');
      return;
    }
    Alert.alert('Could not finish workout', 'Please try again.', [{ text: 'OK' }]);
  }
};
```

- [ ] **Step 6: Render `PRSummaryModal` in the JSX**

Add `PRSummaryModal` just before the closing `</LinearGradient>` tag:

```tsx
{prSummaryData && (
  <PRSummaryModal
    prs={prSummaryData}
    onDone={() => {
      setPrSummaryData(null);
      router.replace('/home');
    }}
  />
)}
```

- [ ] **Step 7: Verify the app builds without TypeScript errors**

```bash
cd vital-forge-mobile-v1
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit mobile changes**

```bash
git add src/features/workouts/workoutsApi.ts \
        src/components/PRSummaryModal.tsx \
        app/active-workout.tsx
git commit -m "feat(012): PR summary modal with hybrid celebration design"
```

---

## Self-Review

### Spec coverage
- ✅ `persist_prs` returns new PRs — Task 1
- ✅ `complete` response includes `new_personal_records` — Task 1
- ✅ Backend specs updated — Task 2
- ✅ `NewPersonalRecord` type added — Task 3
- ✅ `PRSummaryModal` component built with hybrid design (confetti, streak pill, 1RM right-aligned) — Task 4
- ✅ Badge moves to best set per exercise — Task 5 Step 3
- ✅ Session PR badge moves on new best — Task 5 Step 4
- ✅ Modal shown after completion if PRs exist — Task 5 Step 5
- ✅ Navigate home from modal Done button — Task 5 Step 6
- ✅ No modal if no new PRs (go straight home) — Task 5 Step 5

### Placeholder scan
No TBDs, TODOs, or vague instructions found.

### Type consistency
- `NewPersonalRecord` defined in Task 3, imported in Task 4 and Task 5 Step 1 ✅
- `persist_prs` returns `new_prs` array in Task 1, used as `result.new_personal_records` in Task 5 Step 5 — matches the JSON key in the render response ✅
- `prSummaryData: NewPersonalRecord[] | null` — type matches `PRSummaryModal` `prs: NewPersonalRecord[]` prop ✅
