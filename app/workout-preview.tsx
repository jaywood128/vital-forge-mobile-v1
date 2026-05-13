import { Text, StyleSheet, View, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetTemplateQuery, type TemplateExercise } from '../src/features/templates/templatesApi';
import { useStartWorkoutMutation } from '../src/features/workouts/workoutsApi';
import { colors, spacing, typography, radius } from '../src/theme';
import { Screen, Card, Button } from '../src/components/ui';

function ExerciseRow({ item }: { item: TemplateExercise }) {
  return (
    <View style={styles.exerciseRow}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.exercise.name}</Text>
        {item.exercise.muscle_group ? (
          <View style={styles.muscleChip}>
            <Text style={styles.muscleChipText}>{item.exercise.muscle_group}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.setsBadge}>
        <Text style={styles.setsText}>{item.recommended_sets} sets</Text>
        <Text style={styles.repsText}>{item.recommended_reps} reps</Text>
      </View>
    </View>
  );
}

export default function WorkoutPreviewScreen() {
  const { templateId, dayNumber, dayName } = useLocalSearchParams<{
    templateId: string;
    dayNumber: string;
    dayName: string;
  }>();
  const router = useRouter();

  const { data: template, isLoading, isError, refetch } = useGetTemplateQuery(
    Number(templateId),
    { skip: !templateId }
  );
  const [startWorkout, { isLoading: isStarting }] = useStartWorkoutMutation();

  const currentDay = template?.days?.find((d) => d.day_number === Number(dayNumber));

  const handleStartWorkout = async () => {
    if (!templateId || !dayNumber) return;
    try {
      const result = await startWorkout({
        templateId: Number(templateId),
        day_number: Number(dayNumber),
      }).unwrap();
      router.replace({
        pathname: '/active-workout',
        params: { workoutId: String(result.workout.id), dayName: dayName ?? '' },
      });
    } catch (err: any) {
      if (err?.status === 409) {
        Alert.alert(
          'Workout Already In Progress',
          'You have an unfinished workout. Would you like to resume it?',
          [
            {
              text: 'Resume',
              onPress: () => {
                if (err.data?.active_workout_id) {
                  router.replace({
                    pathname: '/active-workout',
                    params: { workoutId: String(err.data.active_workout_id) },
                  });
                }
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Error', 'Could not start workout. Please try again.', [
          { text: 'Try Again' },
        ]);
      }
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={colors.electricBlue} style={styles.loader} />
      </Screen>
    );
  }

  if (isError || !template) {
    return (
      <Screen>
        <Text style={styles.errorText}>Failed to load workout details.</Text>
        <Button title="Retry" onPress={refetch} variant="secondary" style={styles.retryButton} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={styles.headerCard}>
        <Text style={styles.programmeName}>{template.name}</Text>
        <View style={styles.chips}>
          {template.goal_type && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {template.goal_type === 'physique' ? 'Build Muscle' : 'Get Stronger'}
              </Text>
            </View>
          )}
          {template.difficulty_level && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{template.difficulty_level}</Text>
            </View>
          )}
        </View>
        <Text style={styles.dayLabel}>
          Day {dayNumber} — {dayName}
        </Text>
      </Card>

      <FlatList
        data={currentDay?.exercises ?? []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ExerciseRow item={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No exercises scheduled for this day.</Text>
        }
      />

      <View style={styles.footer}>
        <Button
          title={isStarting ? 'Starting...' : 'Start Workout'}
          onPress={handleStartWorkout}
          variant="primary"
          disabled={isStarting || !currentDay}
          style={styles.startButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.xxl,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.mediumGray,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  retryButton: {
    alignSelf: 'center',
  },
  headerCard: {
    marginBottom: spacing.md,
  },
  programmeName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.deepNavy,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.lightBlue,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.electricBlue,
  },
  dayLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.electricBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmGray2,
  },
  exerciseInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  exerciseName: {
    ...typography.subtitle,
    color: colors.deepNavy,
    marginBottom: spacing.xs,
  },
  muscleChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lightBlue,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  muscleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.electricBlue,
  },
  setsBadge: {
    alignItems: 'flex-end',
  },
  setsText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.deepNavy,
  },
  repsText: {
    ...typography.caption,
    color: colors.mediumGray,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.mediumGray,
    marginTop: spacing.xl,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  startButton: {
    minHeight: spacing.touchMin,
  },
});
