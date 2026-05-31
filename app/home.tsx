import { useCallback } from 'react';
import { Text, StyleSheet, Alert, View, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { authApi, useGetCurrentUserQuery, useLogoutMutation } from '../src/features/auth/authApi';
import { userPreferenceApi, useGetPreferenceQuery } from '../src/features/userPreference/userPreferenceApi';
import { templatesApi, useGetTemplateQuery } from '../src/features/templates/templatesApi';
import { workoutsApi, useGetWorkoutsQuery } from '../src/features/workouts/workoutsApi';
import { exerciseSetsApi } from '../src/features/workouts/exerciseSetsApi';
import { goalsApi } from '../src/features/goals/goalsApi';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors, spacing, typography, radius } from '../src/theme';
import { Screen, Card } from '../src/components/ui';

const GOAL_LABEL: Record<string, string> = {
  physique: 'Build Muscle',
  strength: 'Get Stronger',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getISOWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(now);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export default function HomeScreen() {
  const dispatch = useDispatch();
  const { data: user, isLoading } = useGetCurrentUserQuery();
  const { data: preference } = useGetPreferenceQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const router = useRouter();

  const templateId = preference?.selected_workout_template_id ?? 0;
  const { data: template, refetch: refetchTemplate } = useGetTemplateQuery(templateId, {
    skip: !preference?.selected_workout_template_id,
  });

  const { data: workouts, refetch: refetchWorkouts } = useGetWorkoutsQuery();

  useFocusEffect(
    useCallback(() => {
      refetchWorkouts();
      if (preference?.selected_workout_template_id) refetchTemplate();
    }, [preference?.selected_workout_template_id, refetchTemplate, refetchWorkouts])
  );

  const completedCount =
    workouts?.filter(
      (w) => w.completed && w.workout_template_id === templateId
    )?.length ?? 0;

  const weekStart = getISOWeekStart();
  const weeklyCount =
    workouts?.filter((w) => {
      if (!w.completed || !w.workout_date) return false;
      return new Date(w.workout_date) >= weekStart;
    }).length ?? 0;

  // Use actual seeded day count for rotation — some templates (Arnold Split, PPL) have
  // days_per_week > their unique training days because the pattern repeats within the week.
  // Math.max(..., 1) guards against an empty days array producing 0, which would make
  // completedCount % 0 = NaN and break day navigation.
  const actualDayCount = Math.max(template?.days?.length || 1, 1);
  const nextDay = (completedCount % actualDayCount) + 1;
  const nextDayData = template?.days?.find((d) => d.day_number === nextDay);
  const nextDayName = nextDayData?.name ?? `Day ${nextDay}`;

  const activeWorkout = workouts?.find((w) => !w.completed);
  const hasActiveWorkout = template?.has_active_workout ?? !!activeWorkout;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {}
    try {
      await SecureStore.deleteItemAsync('authToken');
    } catch {}
    dispatch(authApi.util.resetApiState());
    dispatch(workoutsApi.util.resetApiState());
    dispatch(exerciseSetsApi.util.resetApiState());
    dispatch(templatesApi.util.resetApiState());
    dispatch(goalsApi.util.resetApiState());
    dispatch(userPreferenceApi.util.resetApiState());
    Alert.alert('Logged out', 'You have been logged out.');
    router.replace('/login');
  };

  const handleCTAPress = () => {
    if (hasActiveWorkout && activeWorkout) {
      router.push({
        pathname: '/active-workout',
        params: {
          workoutId: String(activeWorkout.id),
          dayName: activeWorkout.name ?? '',
        },
      });
    } else {
      router.push({
        pathname: '/workout-preview',
        params: {
          templateId: String(templateId),
          dayNumber: String(nextDay),
          dayName: nextDayName,
        },
      });
    }
  };

  if (isLoading) {
    return (
      <Screen variant="dark">
        <Text style={styles.loadingText}>Loading...</Text>
      </Screen>
    );
  }

  const firstName = user?.first_name ?? '';
  const statLine = weeklyCount > 0
    ? `${weeklyCount} workout${weeklyCount === 1 ? '' : 's'} this week`
    : 'No workouts yet this week';

  return (
    <Screen variant="dark">
      <Text style={styles.greeting}>{getGreeting()}{firstName ? `, ${firstName}` : ''}.</Text>
      <Text style={styles.statLine}>{statLine}</Text>

      {preference?.selected_workout_template_name ? (
        <>
          <Card
            variant="dark"
            borderAccent={colors.electricBlueLight}
            style={styles.programmeCard}
          >
            <Text style={styles.programmeLabel}>Active Programme</Text>
            <Text style={styles.programmeName}>{preference.selected_workout_template_name}</Text>
            {hasActiveWorkout ? (
              <Text style={styles.resumeLabel}>In Progress</Text>
            ) : (
              <Text style={styles.nextUpLabel}>
                Next Up: Day {nextDay} — {nextDayName}
              </Text>
            )}
            <View style={styles.programmeMeta}>
              {preference.primary_goal && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{GOAL_LABEL[preference.primary_goal] ?? preference.primary_goal}</Text>
                </View>
              )}
              {preference.training_days_per_week && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{preference.training_days_per_week} days/week</Text>
                </View>
              )}
              {preference.experience_level && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{preference.experience_level}</Text>
                </View>
              )}
            </View>
          </Card>

          <Pressable
            onPress={handleCTAPress}
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel={hasActiveWorkout ? 'Resume Workout' : `Start Day ${nextDay} — ${nextDayName}`}
          >
            <LinearGradient
              colors={hasActiveWorkout
                ? [colors.success, '#059669']
                : [colors.energeticOrange, '#f07c0a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.ctaGradient, Platform.select({
                ios: {
                  shadowColor: hasActiveWorkout ? colors.success : colors.energeticOrange,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                },
                android: { elevation: 6 },
              })]}
            >
              <Ionicons
                name={hasActiveWorkout ? 'play-circle' : 'flash'}
                size={22}
                color={colors.pureWhite}
                style={styles.ctaIcon}
              />
              <Text style={styles.ctaText}>
                {hasActiveWorkout ? 'Resume Workout' : `Start Day ${nextDay} — ${nextDayName}`}
              </Text>
            </LinearGradient>
          </Pressable>
        </>
      ) : null}

      <Pressable
        onPress={() => router.push('/history')}
        style={({ pressed }) => [styles.historyRow, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="View workout history"
      >
        <Ionicons name="time-outline" size={18} color={colors.electricBlueLight} />
        <Text style={styles.historyLabel}>Workout History</Text>
      </Pressable>

      <View style={styles.spacer} />

      <Pressable
        onPress={handleLogout}
        disabled={isLoggingOut}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Log out"
      >
        <Text style={styles.logoutLink}>{isLoggingOut ? 'Logging out…' : 'Log out'}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    ...typography.body,
    color: colors.pureWhite,
    textAlign: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.pureWhite,
    marginBottom: spacing.xs,
  },
  statLine: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: spacing.lg,
  },
  programmeCard: {
    marginBottom: spacing.md,
  },
  programmeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.electricBlueLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  programmeName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.pureWhite,
    marginBottom: spacing.xs,
  },
  nextUpLabel: {
    ...typography.caption,
    color: colors.electricBlueLight,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  resumeLabel: {
    ...typography.caption,
    color: colors.energeticOrange,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  programmeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: 'rgba(74,144,217,0.2)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.electricBlueLight,
  },
  ctaButton: {
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  ctaPressed: {
    opacity: 0.88,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  ctaIcon: {
    marginRight: 2,
  },
  ctaText: {
    ...typography.button,
    color: colors.pureWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  historyLabel: {
    ...typography.caption,
    color: colors.electricBlueLight,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  logoutLink: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
});
