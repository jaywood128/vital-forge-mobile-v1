import { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, ActivityIndicator, StyleSheet, Alert, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useLazyGetWorkoutsPageQuery,
  WorkoutDetail,
  WorkoutCursor,
} from '../src/features/workouts/workoutsApi';
import { Screen, WorkoutHistoryCard, WorkoutHistorySkeletonCard } from '../src/components/ui';
import { colors, spacing, typography } from '../src/theme';

const PAGE_SIZE = 20;
const SKELETON_COUNT = 3;

export default function HistoryScreen() {
  const router = useRouter();
  const [triggerGetPage, { isFetching }] = useLazyGetWorkoutsPageQuery();
  const [workouts, setWorkouts] = useState<WorkoutDetail[]>([]);
  const [cursor, setCursor] = useState<WorkoutCursor | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadPage = useCallback(
    async (pageCursor?: WorkoutCursor) => {
      if (isFetching) return;
      try {
        const result = await triggerGetPage({ cursor: pageCursor, limit: PAGE_SIZE }).unwrap();
        setWorkouts((prev) => (pageCursor ? [...prev, ...result.data] : result.data));
        setCursor(result.meta.next_cursor);
        setHasMore(result.meta.has_more);
      } catch {
        Alert.alert('Error', 'Could not load workout history. Please try again.');
      } finally {
        setInitialLoading(false);
      }
    },
    [isFetching, triggerGetPage]
  );

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEndReached = useCallback(() => {
    if (!isFetching && hasMore && cursor) {
      loadPage(cursor);
    }
  }, [isFetching, hasMore, cursor, loadPage]);

  const renderFooter = () => {
    if (!isFetching || initialLoading) return null;
    return (
      <>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <WorkoutHistorySkeletonCard key={`skeleton-${i}`} />
        ))}
      </>
    );
  };

  if (initialLoading) {
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
        data={workouts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <WorkoutHistoryCard
            workout={item}
            onPress={() => router.push(`/workout-detail?id=${item.id}`)}
          />
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workouts yet. Start your first session!</Text>
          </View>
        }
        contentContainerStyle={workouts.length === 0 ? styles.emptyList : undefined}
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
