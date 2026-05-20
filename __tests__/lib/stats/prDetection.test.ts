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

  it('does not mark first-ever set as PR (no prior history to beat)', () => {
    const workouts = [makeWorkout(1, '2024-01-01', [{ setId: 10, weight: 135, reps: 8 }])];
    expect(detectPRSetIds(workouts).has(10)).toBe(false);
  });

  it('marks set as PR when 1RM exceeds all-time best', () => {
    const workouts = [
      makeWorkout(1, '2024-01-01', [{ setId: 10, weight: 135, reps: 8 }]),
      makeWorkout(2, '2024-01-08', [{ setId: 20, weight: 145, reps: 8 }]),
    ];
    expect(detectPRSetIds(workouts).has(20)).toBe(true);
  });

  it('does not mark set as PR when 1RM ties but does not exceed best', () => {
    const workouts = [
      makeWorkout(1, '2024-01-01', [{ setId: 10, weight: 135, reps: 8 }]),
      makeWorkout(2, '2024-01-08', [{ setId: 20, weight: 135, reps: 8 }]),
    ];
    expect(detectPRSetIds(workouts).has(20)).toBe(false);
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

  it('detects intra-session PR when two sets in same workout both exceed previous best', () => {
    const workouts = [
      makeWorkout(1, '2024-01-01', [{ setId: 10, weight: 135, reps: 8 }]),
      makeWorkout(2, '2024-01-08', [
        { setId: 20, weight: 145, reps: 8 },
        { setId: 21, weight: 150, reps: 8 },
      ]),
    ];
    const prIds = detectPRSetIds(workouts);
    expect(prIds.has(20)).toBe(true);
    expect(prIds.has(21)).toBe(true);
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
    expect(prIds.has(20)).toBe(true);
    expect(prIds.has(21)).toBe(true);
  });

  it.todo('handles workouts passed in reverse chronological order — should still detect PRs correctly');
  it.todo('handles very large set IDs without hash collision in the Set');
});
