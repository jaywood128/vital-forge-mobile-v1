import { WorkoutDetail } from '../../features/workouts/workoutsApi';

export type ExerciseSeriesPoint = { x: string; y: number };

function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function getExerciseSeries(
  workouts: WorkoutDetail[],
  exerciseId: number,
  metric: 'maxWeight' | '1rm' | 'volume'
): ExerciseSeriesPoint[] {
  const sorted = [...workouts]
    .filter((w) => w.completed)
    .sort((a, b) => a.workout_date.localeCompare(b.workout_date));

  const points: ExerciseSeriesPoint[] = [];

  for (const workout of sorted) {
    const we = workout.workout_exercises.find((e) => e.exercise.id === exerciseId);
    if (!we) continue;

    const validSets = we.exercise_sets.filter(
      (s) => s.completed && s.weight != null && s.weight > 0 && s.reps != null && s.reps > 0
    );
    if (validSets.length === 0) continue;

    let value: number;
    if (metric === 'maxWeight') {
      value = Math.max(...validSets.map((s) => s.weight!));
    } else if (metric === '1rm') {
      value = Math.max(...validSets.map((s) => epley1RM(s.weight!, s.reps!)));
    } else {
      value = validSets.reduce((sum, s) => sum + s.weight! * s.reps!, 0);
    }

    points.push({ x: workout.workout_date.slice(0, 10), y: Math.round(value * 10) / 10 });
  }

  return points;
}

