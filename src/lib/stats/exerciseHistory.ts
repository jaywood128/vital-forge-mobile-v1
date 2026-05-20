import { WorkoutDetail } from '../../features/workouts/workoutsApi';
import { calculateEpley1RM } from './epley';

export type CurrentBests = {
  best1RM: number | null;
};

export type ExerciseSeriesPoint = {
  x: string;  // workout_date — used as x-axis label
  y: number;  // metric value for that session
};

export function getCurrentBests(workouts: WorkoutDetail[], exerciseId: number): CurrentBests {
  let best1RM: number | null = null;

  for (const workout of workouts) {
    for (const we of workout.workout_exercises) {
      if (we.exercise.id !== exerciseId) continue;
      for (const set of we.exercise_sets) {
        if (!set.completed || !set.weight || set.weight <= 0 || !set.reps || set.reps <= 0) continue;
        const estimated = calculateEpley1RM(set.weight, set.reps);
        if (best1RM === null || estimated > best1RM) {
          best1RM = estimated;
        }
      }
    }
  }

  return { best1RM };
}

export function getExerciseSeries(
  workouts: WorkoutDetail[],
  exerciseId: number,
  metric: 'maxWeight' | '1rm' | 'volume'
): ExerciseSeriesPoint[] {
  const sorted = [...workouts].sort(
    (a, b) => new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()
  );

  const points: ExerciseSeriesPoint[] = [];

  for (const workout of sorted) {
    for (const we of workout.workout_exercises) {
      if (we.exercise.id !== exerciseId) continue;

      const completedSets = we.exercise_sets.filter(
        (s) => s.completed && s.weight && s.weight > 0 && s.reps && s.reps > 0
      );
      if (completedSets.length === 0) continue;

      let y: number;
      if (metric === 'maxWeight') {
        y = Math.max(...completedSets.map((s) => s.weight as number));
      } else if (metric === '1rm') {
        y = Math.max(...completedSets.map((s) => calculateEpley1RM(s.weight as number, s.reps as number)));
      } else {
        y = completedSets.reduce((sum, s) => sum + (s.weight as number) * (s.reps as number), 0);
      }

      points.push({ x: workout.workout_date, y });
    }
  }

  return points;
}
