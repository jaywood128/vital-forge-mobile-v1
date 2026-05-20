import { WorkoutDetail } from '../../features/workouts/workoutsApi';
import { calculateEpley1RM } from './epley';

/**
 * Returns the set ID of the current all-time best (highest estimated 1RM) per exercise.
 * At most one set ID per exercise — the badge means "this is your personal best", not
 * "you beat your record on this set".
 */
export function detectPRSetIds(workouts: WorkoutDetail[]): Set<number> {
  // exerciseId → { setId, best1RM }
  const bestByExercise = new Map<number, { setId: number; best1RM: number }>();

  for (const workout of workouts) {
    for (const we of workout.workout_exercises) {
      const exerciseId = we.exercise.id;
      for (const set of we.exercise_sets) {
        if (!set.completed || !set.weight || set.weight <= 0 || !set.reps || set.reps <= 0) {
          continue;
        }
        const estimated1RM = calculateEpley1RM(set.weight, set.reps);
        const current = bestByExercise.get(exerciseId);
        if (!current || estimated1RM > current.best1RM) {
          bestByExercise.set(exerciseId, { setId: set.id, best1RM: estimated1RM });
        }
      }
    }
  }

  const prSetIds = new Set<number>();
  for (const { setId } of bestByExercise.values()) {
    prSetIds.add(setId);
  }
  return prSetIds;
}
