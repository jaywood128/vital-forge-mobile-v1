import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Card } from './Card';
import { colors, spacing, typography } from '../../theme';
import { WorkoutDetail } from '../../features/workouts/workoutsApi';

type WorkoutHistoryCardProps = {
  workout: WorkoutDetail;
  onPress: () => void;
};

export function WorkoutHistoryCard({ workout, onPress }: WorkoutHistoryCardProps) {
  const [year, month, day] = workout.workout_date.slice(0, 10).split('-').map(Number);
  const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const exerciseCount = workout.workout_exercises.length;
  const setsLogged = workout.workout_exercises
    .flatMap((e) => e.exercise_sets)
    .filter((s) => s.completed).length;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <Card variant="dark" style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.date}>{formattedDate}</Text>
          <Text style={styles.badge}>{exerciseCount} exercises</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>{workout.name}</Text>
        <Text style={styles.sets}>{setsLogged} sets logged</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
  card: {
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.4)',
  },
  badge: {
    ...typography.caption,
    color: colors.electricBlueLight,
  },
  name: {
    ...typography.subtitle,
    color: colors.pureWhite,
    fontWeight: '600',
  },
  sets: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.4)',
    marginTop: spacing.xs,
  },
});
