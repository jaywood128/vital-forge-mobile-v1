import { WorkoutDetail } from '../../features/workouts/workoutsApi';
import { calculateEpley1RM } from './epley';

export function detectPRSetIds(workouts: WorkoutDetail[]): Set<number> {
  const prSetIds = new Set<number>();
  const bestByExercise = new Map<number, number>();

  const sorted = [...workouts].sort(
    (a, b) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()
  );

  for (const workout of sorted) {
    for (const we of workout.workout_exercises) {
      const exerciseId = we.exercise.id;
      for (const set of we.exercise_sets) {
        if (!set.completed || !set.weight || set.weight <= 0 || !set.reps || set.reps <= 0) {
          continue;
        }
        const estimated1RM = calculateEpley1RM(set.weight, set.reps);
        const currentBest = bestByExercise.get(exerciseId);
        if (currentBest === undefined) {
          bestByExercise.set(exerciseId, estimated1RM);
          continue;
        }
        if (estimated1RM > currentBest) {
          prSetIds.add(set.id);
          bestByExercise.set(exerciseId, estimated1RM);
        }
      }
    }
  }

  return prSetIds;
}
