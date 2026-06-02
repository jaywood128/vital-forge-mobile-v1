import { Pressable, Text, View, StyleSheet } from 'react-native';
import { spacing } from '../../theme';
import { WorkoutDetail } from '../../features/workouts/workoutsApi';

type WorkoutHistoryCardProps = {
  workout: WorkoutDetail;
  onPress: () => void;
};

type AccentKey = 'strength' | 'cardio' | 'hiit' | 'default';

const ACCENT: Record<AccentKey, { bar: string; dot: string; label: string }> = {
  strength: { bar: '#4A90D9', dot: '#4A90D9', label: 'Strength' },
  cardio:   { bar: '#F5A623', dot: '#F5A623', label: 'Cardio' },
  hiit:     { bar: '#EF4444', dot: '#EF4444', label: 'HIIT' },
  default:  { bar: '#4A90D9', dot: '#4A90D9', label: 'Workout' },
};

function accentKey(workoutType: string | null): AccentKey {
  const t = (workoutType ?? '').toLowerCase();
  if (t === 'cardio') return 'cardio';
  if (t === 'hiit') return 'hiit';
  if (t === 'strength') return 'strength';
  return 'default';
}

function relativeDate(workoutDate: string): string {
  const [year, month, day] = workoutDate.slice(0, 10).split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'TODAY';
  if (diff === 1) return 'YESTERDAY';
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

export function WorkoutHistoryCard({ workout, onPress }: WorkoutHistoryCardProps) {
  const accent = ACCENT[accentKey(workout.workout_type)];
  const exerciseCount = workout.workout_exercises.length;
  const setsLogged = workout.workout_exercises
    .flatMap((e) => e.exercise_sets)
    .filter((s) => s.completed).length;
  const dateLabel = relativeDate(workout.workout_date);
  const duration = workout.duration_minutes;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accent.bar }]} />

      <View style={styles.inner}>
        {/* Name row + duration */}
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{workout.name}</Text>
          {duration != null && (
            <Text style={styles.duration}>
              {duration}<Text style={styles.durationUnit}> min</Text>
            </Text>
          )}
        </View>

        {/* Type chip + relative date */}
        <View style={styles.metaRow}>
          <View style={[styles.typeDot, { backgroundColor: accent.dot }]} />
          <Text style={styles.typeLabel}>{accent.label}</Text>
          <Text style={styles.dateSep}>·</Text>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
        </View>

        {/* Stats row */}
        {(exerciseCount > 0 || setsLogged > 0) && (
          <View style={styles.statsRow}>
            {exerciseCount > 0 && (
              <Text style={styles.stat}>🏋️ {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</Text>
            )}
            {setsLogged > 0 && (
              <Text style={styles.stat}>⚡ {setsLogged} sets</Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16,28,50,0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 9,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.75,
  },
  accentBar: {
    width: 3,
    borderRadius: 0,
  },
  inner: {
    flex: 1,
    padding: spacing.md,
    paddingLeft: 12,
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    marginRight: spacing.sm,
  },
  duration: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
  },
  durationUnit: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dateSep: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.2)',
    marginHorizontal: 2,
  },
  dateLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  stat: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
  },
});
