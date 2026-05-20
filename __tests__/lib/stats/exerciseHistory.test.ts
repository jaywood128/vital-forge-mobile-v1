import { getCurrentBests, getExerciseSeries } from '../../../src/lib/stats/exerciseHistory';
import { WorkoutDetail } from '../../../src/features/workouts/workoutsApi';

const makeWorkout = (id: number, date: string, sets: { weight: number | null; reps: number | null; completed?: boolean }[], exerciseId = 1): WorkoutDetail => ({
  id,
  name: 'Test Workout',
  completed: true,
  started_at: null,
  completed_at: null,
  workout_date: date,
  workout_template_id: null,
  workout_exercises: [{
    id: id * 10,
    order_position: 1,
    notes: null,
    rest_between_sets: null,
    completed: true,
    exercise: { id: exerciseId, name: 'Bench Press', muscle_group: null, equipment: null, exercise_type: 'barbell' },
    exercise_sets: sets.map((s, i) => ({
      id: id * 100 + i,
      set_number: i + 1,
      reps: s.reps,
      weight: s.weight,
      weight_unit: 'lbs',
      rpe: null,
      to_failure: false,
      notes: null,
      completed: s.completed ?? true,
    })),
  }],
});

describe('getCurrentBests', () => {
  it('returns null best1RM when no workouts', () => {
    expect(getCurrentBests([], 1)).toEqual({ best1RM: null });
  });

  it('returns null best1RM when exercise has no completed sets', () => {
    const workouts = [makeWorkout(1, '2024-01-01', [{ weight: 135, reps: 8, completed: false }])];
    expect(getCurrentBests(workouts, 1)).toEqual({ best1RM: null });
  });

  it('returns null for bodyweight exercise (null weight)', () => {
    const workouts = [makeWorkout(1, '2024-01-01', [{ weight: null, reps: 10 }])];
    expect(getCurrentBests(workouts, 1)).toEqual({ best1RM: null });
  });

  it('returns correct best1RM from single session', () => {
    const workouts = [makeWorkout(1, '2024-01-01', [{ weight: 135, reps: 8 }])];
    const { best1RM } = getCurrentBests(workouts, 1);
    expect(best1RM).toBeCloseTo(171, 0);
  });

  it('returns highest 1RM across multiple sessions', () => {
    const workouts = [
      makeWorkout(1, '2024-01-01', [{ weight: 135, reps: 8 }]),
      makeWorkout(2, '2024-01-08', [{ weight: 145, reps: 8 }]),
    ];
    const { best1RM } = getCurrentBests(workouts, 1);
    expect(best1RM).toBeGreaterThan(171);
  });

  it('ignores other exercises', () => {
    const workouts = [makeWorkout(1, '2024-01-01', [{ weight: 225, reps: 5 }], 2)];
    expect(getCurrentBests(workouts, 1)).toEqual({ best1RM: null });
  });
});

describe('getExerciseSeries', () => {
  it('returns empty array when no workouts', () => {
    expect(getExerciseSeries([], 1, 'maxWeight')).toEqual([]);
  });

  it('returns empty array when exercise has no completed sets', () => {
    const workouts = [makeWorkout(1, '2024-01-01', [{ weight: 135, reps: 8, completed: false }])];
    expect(getExerciseSeries(workouts, 1, 'maxWeight')).toEqual([]);
  });

  it('returns one point per session in chronological order', () => {
    const workouts = [
      makeWorkout(2, '2024-01-08', [{ weight: 145, reps: 8 }]),
      makeWorkout(1, '2024-01-01', [{ weight: 135, reps: 8 }]),
    ];
    const series = getExerciseSeries(workouts, 1, 'maxWeight');
    expect(series).toHaveLength(2);
    expect(series[0].x).toBe('2024-01-01');
    expect(series[1].x).toBe('2024-01-08');
  });

  it('maxWeight metric returns heaviest set in session', () => {
    const workouts = [makeWorkout(1, '2024-01-01', [{ weight: 135, reps: 8 }, { weight: 145, reps: 5 }])];
    const series = getExerciseSeries(workouts, 1, 'maxWeight');
    expect(series[0].y).toBe(145);
  });

  it('1rm metric returns highest estimated 1RM in session', () => {
    const workouts = [makeWorkout(1, '2024-01-01', [{ weight: 135, reps: 8 }])];
    const series = getExerciseSeries(workouts, 1, '1rm');
    expect(series[0].y).toBeCloseTo(171, 0);
  });

  it('volume metric returns sum of weight × reps across all sets', () => {
    const workouts = [makeWorkout(1, '2024-01-01', [
      { weight: 135, reps: 8 },
      { weight: 135, reps: 8 },
      { weight: 135, reps: 6 },
    ])];
    const series = getExerciseSeries(workouts, 1, 'volume');
    expect(series[0].y).toBe(135 * 8 + 135 * 8 + 135 * 6);
  });

  it('ignores other exercises', () => {
    const workouts = [makeWorkout(1, '2024-01-01', [{ weight: 225, reps: 5 }], 2)];
    expect(getExerciseSeries(workouts, 1, 'maxWeight')).toEqual([]);
  });

  it.todo('handles multiple exercises in same workout — only includes target exercise data points');
  it.todo('skips sessions where all sets for the exercise are incomplete');
});
