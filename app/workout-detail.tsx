import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetWorkoutQuery, useGetWorkoutsQuery, WorkoutExerciseDetail, ExerciseSet } from '../src/features/workouts/workoutsApi';
import { Screen } from '../src/components/ui';
import { colors, radius, spacing, typography } from '../src/theme';
import PRBadge from '../src/components/PRBadge';
import { detectPRSetIds } from '../src/lib/stats/prDetection';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: workout, isLoading, isError } = useGetWorkoutQuery(Number(id));
  const { data: allWorkouts = [] } = useGetWorkoutsQuery();
  const prSetIds = useMemo(() => detectPRSetIds(allWorkouts), [allWorkouts]);

  const formattedDate = (() => {
    if (!workout) return '';
    const [y, m, d] = workout.workout_date.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  })();

  const totalSets = workout
    ? workout.workout_exercises.flatMap((e) => e.exercise_sets).filter((s) => s.completed).length
    : 0;

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={colors.electricBlueLight} style={styles.loader} />
      </Screen>
    );
  }

  if (isError || !workout) {
    return (
      <Screen>
        <Text style={styles.errorText}>Could not load workout details.</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Text style={styles.backChevron}>‹</Text>
        <Text style={styles.backLabel}>History</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.workoutName} numberOfLines={2}>{workout.name}</Text>
        <Text style={styles.workoutDate}>{formattedDate}</Text>
        <Text style={styles.setsTotal}>{totalSets} sets logged</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {workout.workout_exercises
          .slice()
          .sort((a, b) => a.order_position - b.order_position)
          .map((we) => (
            <ExerciseHistorySection key={we.id} workoutExercise={we} prSetIds={prSetIds} />
          ))}
      </ScrollView>
    </Screen>
  );
}

function ExerciseHistorySection({
  workoutExercise,
  prSetIds,
}: {
  workoutExercise: WorkoutExerciseDetail;
  prSetIds: ReadonlySet<number>;
}) {
  const router = useRouter();

  return (
    <View style={styles.exerciseSection}>
      <View style={styles.exerciseHeader}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/exercise-progress',
              params: {
                exerciseId: String(workoutExercise.exercise.id),
                exerciseName: workoutExercise.exercise.name,
              },
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`View progress for ${workoutExercise.exercise.name}`}
        >
          <Text style={[styles.exerciseName, styles.exerciseNameTappable]}>
            {workoutExercise.exercise.name}
          </Text>
        </Pressable>
        {workoutExercise.exercise.muscle_group && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{workoutExercise.exercise.muscle_group}</Text>
          </View>
        )}
      </View>
      {workoutExercise.exercise_sets
        .slice()
        .sort((a, b) => a.set_number - b.set_number)
        .map((set) => (
          <SetHistoryRow
            key={set.id}
            set={set}
            isPR={prSetIds.has(set.id)}
            isBodyweight={
              workoutExercise.exercise.exercise_type === 'bodyweight' ||
              set.weight === null ||
              set.weight === 0
            }
          />
        ))}
    </View>
  );
}

function SetHistoryRow({ set, isPR, isBodyweight }: { set: ExerciseSet; isPR: boolean; isBodyweight: boolean }) {
  const label = isBodyweight
    ? `${set.reps ?? 0} reps`
    : `${set.weight ?? 0} × ${set.reps ?? 0}`;

  return (
    <View style={styles.setRow}>
      <Text style={styles.setNumber}>Set {set.set_number}</Text>
      <Text style={styles.setLabel}>{label}</Text>
      {isPR ? <PRBadge style={styles.prBadge} /> : <Text style={styles.checkmark}>✓</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
  },
  errorText: {
    ...typography.body,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.electricBlueLight,
    borderRadius: radius.sm,
  },
  backButtonText: {
    color: colors.electricBlueLight,
    ...typography.caption,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backChevron: {
    fontSize: 28,
    color: colors.electricBlueLight,
    lineHeight: 32,
    marginRight: spacing.xs,
  },
  backLabel: {
    ...typography.caption,
    color: colors.electricBlueLight,
  },
  header: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },
  workoutName: {
    ...typography.titleLight,
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  workoutDate: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: spacing.xs,
  },
  setsTotal: {
    ...typography.caption,
    color: colors.electricBlueLight,
  },
  exerciseSection: {
    marginBottom: spacing.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  exerciseName: {
    ...typography.subtitle,
    color: colors.pureWhite,
    fontWeight: '600',
  },
  chip: {
    backgroundColor: 'rgba(74,144,217,0.2)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipText: {
    ...typography.caption,
    color: colors.electricBlueLight,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  setNumber: {
    ...typography.caption,
    color: colors.mediumGray,
    width: 44,
  },
  setLabel: {
    ...typography.body,
    color: colors.pureWhite,
    flex: 1,
  },
  checkmark: {
    fontSize: 16,
    color: colors.success,
    fontWeight: '700',
  },
  exerciseNameTappable: {
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(255,255,255,0.3)',
  },
  prBadge: {
    alignSelf: 'center',
  },
});
