import { detectPRSetIds } from '../../../src/lib/stats/prDetection';
import { WorkoutDetail } from '../../../src/features/workouts/workoutsApi';

const makeWorkout = (id: number, date: string, sets: { setId: number; weight: number | null; reps: number | null; completed?: boolean }[], exerciseId = 1): WorkoutDetail => ({
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
    exercise_sets: sets.map(({ setId, weight, reps, completed = true }) => ({
      id: setId,
      set_number: 1,
      reps,
      weight,
      weight_unit: 'lbs',
      rpe: null,
      to_failure: false,
      notes: null,
      completed,
    })),
  }],
});

describe('detectPRSetIds', () => {
  it('returns empty set when no workouts', () => {
    expect(detectPRSetIds([])).toEqual(new Set());
  });

  it('marks the first-ever set as the current personal best', () => {
    const workouts = [makeWorkout(1, '2024-01-01', [{ setId: 10, weight: 135, reps: 8 }])];
    expect(detectPRSetIds(workouts).has(10)).toBe(true);
  });

  it('marks only the best set when a later set beats an earlier one', () => {
    const workouts = [
      makeWorkout(1, '2024-01-01', [{ setId: 10, weight: 135, reps: 8 }]),
      makeWorkout(2, '2024-01-08', [{ setId: 20, weight: 145, reps: 8 }]),
    ];
    const prIds = detectPRSetIds(workouts);
    expect(prIds.has(20)).toBe(true);
    expect(prIds.has(10)).toBe(false);
    expect(prIds.size).toBe(1);
  });

  it('keeps the earlier set when a later set only ties the best 1RM', () => {
    const workouts = [
      makeWorkout(1, '2024-01-01', [{ setId: 10, weight: 135, reps: 8 }]),
      makeWorkout(2, '2024-01-08', [{ setId: 20, weight: 135, reps: 8 }]),
    ];
    const prIds = detectPRSetIds(workouts);
    expect(prIds.has(20)).toBe(false);
    expect(prIds.size).toBe(1);
  });

  it('skips sets where weight is null (bodyweight exercises)', () => {
    const workouts = [
      makeWorkout(1, '2024-01-01', [{ setId: 10, weight: null, reps: 10 }]),
      makeWorkout(2, '2024-01-08', [{ setId: 20, weight: null, reps: 15 }]),
    ];
    expect(detectPRSetIds(workouts).size).toBe(0);
  });

  it('skips sets that are not completed', () => {
    const workouts = [
      makeWorkout(1, '2024-01-01', [{ setId: 10, weight: 135, reps: 8 }]),
      makeWorkout(2, '2024-01-08', [{ setId: 20, weight: 200, reps: 8, completed: false }]),
    ];
    expect(detectPRSetIds(workouts).has(20)).toBe(false);
  });

  it('marks only the single highest set within a session, not every set that beat the prior best', () => {
    const workouts = [
      makeWorkout(1, '2024-01-01', [{ setId: 10, weight: 135, reps: 8 }]),
      makeWorkout(2, '2024-01-08', [
        { setId: 20, weight: 145, reps: 8 },
        { setId: 21, weight: 150, reps: 8 },
      ]),
    ];
    const prIds = detectPRSetIds(workouts);
    expect(prIds.has(21)).toBe(true);
    expect(prIds.has(20)).toBe(false);
    expect(prIds.has(10)).toBe(false);
    expect(prIds.size).toBe(1);
  });

  it('tracks PRs independently per exercise', () => {
    const workouts: WorkoutDetail[] = [
      {
        ...makeWorkout(1, '2024-01-01', [{ setId: 10, weight: 135, reps: 8 }], 1),
        workout_exercises: [
          makeWorkout(1, '2024-01-01', [{ setId: 10, weight: 135, reps: 8 }], 1).workout_exercises[0],
          makeWorkout(1, '2024-01-01', [{ setId: 11, weight: 100, reps: 10 }], 2).workout_exercises[0],
        ],
      },
      {
        ...makeWorkout(2, '2024-01-08', [], 1),
        workout_exercises: [
          makeWorkout(2, '2024-01-08', [{ setId: 20, weight: 145, reps: 8 }], 1).workout_exercises[0],
          makeWorkout(2, '2024-01-08', [{ setId: 21, weight: 110, reps: 10 }], 2).workout_exercises[0],
        ],
      },
    ];
    const prIds = detectPRSetIds(workouts);
    expect(prIds.has(20)).toBe(true);  // best for exercise 1
    expect(prIds.has(21)).toBe(true);  // best for exercise 2
    expect(prIds.has(10)).toBe(false); // exercise 1 old best, superseded
    expect(prIds.has(11)).toBe(false); // exercise 2 old best, superseded
    expect(prIds.size).toBe(2);
  });

  it.todo('handles workouts passed in reverse chronological order — should still detect PRs correctly');
  it.todo('handles very large set IDs without hash collision in the Set');
});
