import { useEffect } from 'react';
import { FlatList, Pressable, Text, ActivityIndicator, StyleSheet, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useGetWorkoutsQuery, WorkoutDetail } from '../src/features/workouts/workoutsApi';
import { Screen, WorkoutHistoryCard } from '../src/components/ui';
import { colors, spacing, typography } from '../src/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const { data, isLoading, isError } = useGetWorkoutsQuery();

  useEffect(() => {
    if (isError) {
      Alert.alert('Error', 'Could not load workout history. Please try again.');
    }
  }, [isError]);

  const completed = (data ?? [])
    .filter((w) => w.completed)
    .sort((a, b) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime());

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={colors.electricBlueLight} style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Text style={styles.backChevron}>‹</Text>
        <Text style={styles.backLabel}>Home</Text>
      </Pressable>
      <Text style={styles.heading}>Workout History</Text>
      <FlatList<WorkoutDetail>
        data={completed}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <WorkoutHistoryCard
            workout={item}
            onPress={() => router.push(`/workout-detail?id=${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workouts yet. Start your first session!</Text>
          </View>
        }
        contentContainerStyle={completed.length === 0 ? styles.emptyList : undefined}
      />
    </Screen>
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
  heading: {
    ...typography.titleLight,
    fontSize: 24,
    marginBottom: spacing.lg,
  },
  loader: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
});
