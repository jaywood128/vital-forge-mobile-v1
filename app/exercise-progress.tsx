import { useState, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetWorkoutsQuery, useGetPersonalRecordsQuery } from '../src/features/workouts/workoutsApi';
import { Screen } from '../src/components/ui';
import ExerciseChart from '../src/components/ExerciseChart';
import { colors, radius, spacing, typography } from '../src/theme';
import { getExerciseSeries } from '../src/lib/stats/exerciseHistory';

type Metric = 'maxWeight' | '1rm' | 'volume';

const METRICS: { key: Metric; label: string; unit: string }[] = [
  { key: 'maxWeight', label: 'Max Weight', unit: 'lbs' },
  { key: '1rm', label: 'Est. 1RM', unit: 'lbs' },
  { key: 'volume', label: 'Volume', unit: 'lbs' },
];

export default function ExerciseProgressScreen() {
  const { exerciseId, exerciseName } = useLocalSearchParams<{
    exerciseId: string;
    exerciseName: string;
  }>();
  const router = useRouter();
  const [activeMetric, setActiveMetric] = useState<Metric>('maxWeight');

  const { data: allWorkouts = [] } = useGetWorkoutsQuery();
  const { data: personalRecords = [] } = useGetPersonalRecordsQuery({});
  const id = Number(exerciseId);

  const series = useMemo(
    () => getExerciseSeries(allWorkouts, id, activeMetric),
    [allWorkouts, id, activeMetric]
  );

  const best1RM = useMemo(() => {
    const prs = personalRecords.filter((pr) => pr.exercise_id === id);
    if (prs.length === 0) return null;
    return Math.max(...prs.map((pr) => pr.estimated_1rm));
  }, [personalRecords, id]);

  const activeMetricMeta = METRICS.find((m) => m.key === activeMetric)!;

  const latestValue = series.length > 0 ? series[series.length - 1].y : null;
  const firstValue = series.length > 0 ? series[0].y : null;
  const delta =
    latestValue !== null && firstValue !== null && series.length > 1
      ? latestValue - firstValue
      : null;

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Text style={styles.backChevron}>‹</Text>
        <Text style={styles.backLabel}>Workout</Text>
      </Pressable>

      <Text style={styles.title} numberOfLines={2}>
        {exerciseName}
      </Text>

      <View style={styles.metricPicker}>
        {METRICS.map((m) => (
          <Pressable
            key={m.key}
            style={[styles.metricTab, activeMetric === m.key && styles.metricTabActive]}
            onPress={() => setActiveMetric(m.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeMetric === m.key }}
          >
            <Text style={[styles.metricTabText, activeMetric === m.key && styles.metricTabTextActive]}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ExerciseChart data={series} metricLabel={`${activeMetricMeta.label} (${activeMetricMeta.unit})`} />

        <View style={styles.statsRow}>
          {latestValue !== null && (
            <StatCard
              label={`Latest ${activeMetricMeta.label}`}
              value={`${Math.round(latestValue)} ${activeMetricMeta.unit}`}
            />
          )}
          {best1RM !== null && (
            <StatCard label="All-Time 1RM" value={`${Math.round(best1RM)} lbs`} highlight />
          )}
          {delta !== null && (
            <StatCard
              label="Total Change"
              value={`${delta >= 0 ? '+' : ''}${Math.round(delta)} ${activeMetricMeta.unit}`}
              positive={delta >= 0}
            />
          )}
        </View>

        <Text style={styles.sessionCount}>
          {series.length} session{series.length !== 1 ? 's' : ''} tracked
        </Text>
      </ScrollView>
    </Screen>
  );
}

function StatCard({
  label,
  value,
  highlight,
  positive,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, positive === false && styles.statValueNegative]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  title: {
    ...typography.titleLight,
    fontSize: 22,
    marginBottom: spacing.md,
  },
  metricPicker: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'transparent',
  },
  metricTabActive: {
    borderColor: colors.electricBlueLight,
    backgroundColor: 'rgba(74,144,217,0.15)',
  },
  metricTabText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    textAlign: 'center',
  },
  metricTabTextActive: {
    color: colors.electricBlueLight,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statCardHighlight: {
    borderWidth: 1,
    borderColor: colors.energeticOrange,
    backgroundColor: 'rgba(245,166,35,0.08)',
  },
  statLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 4,
  },
  statValue: {
    ...typography.subtitle,
    color: colors.pureWhite,
    fontWeight: '700',
  },
  statValueNegative: {
    color: '#F87171',
  },
  sessionCount: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
