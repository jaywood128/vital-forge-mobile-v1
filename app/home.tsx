import { Text, StyleSheet, Alert, View, Pressable } from 'react-native';
import { useGetCurrentUserQuery, useLogoutMutation } from '../src/features/auth/authApi';
import { useGetPreferenceQuery } from '../src/features/userPreference/userPreferenceApi';
import { useGetTemplateQuery } from '../src/features/templates/templatesApi';
import { useGetWorkoutsQuery } from '../src/features/workouts/workoutsApi';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radius } from '../src/theme';
import { Screen, Card, Button } from '../src/components/ui';

const GOAL_LABEL: Record<string, string> = {
  physique: 'Build Muscle',
  strength: 'Get Stronger',
};

export default function HomeScreen() {
  const { data: user, isLoading } = useGetCurrentUserQuery();
  const { data: preference } = useGetPreferenceQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const router = useRouter();

  const templateId = preference?.selected_workout_template_id ?? 0;
  const { data: template } = useGetTemplateQuery(templateId, {
    skip: !preference?.selected_workout_template_id,
  });
  const { data: workouts } = useGetWorkoutsQuery();
  console.log(`Workouts: ${workouts}`)
  const completedCount =
    workouts?.filter(
      (w) => w.completed && w.workout_template_id === templateId
    )?.length ?? 0;

  const daysPerWeek = template?.days_per_week ?? 1;
  const nextDay = (completedCount % daysPerWeek) + 1;
  const nextDayData = template?.days?.find((d) => d.day_number === nextDay);
  const nextDayName = nextDayData?.name ?? `Day ${nextDay}`;

  const hasActiveWorkout = template?.has_active_workout ?? false;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {}
    try {
      await SecureStore.deleteItemAsync('authToken');
    } catch {}
    Alert.alert('Logged out', 'You have been logged out.');
    router.replace('/login');
  };

  const handleCardPress = () => {
    router.push({
      pathname: '/workout-preview',
      params: {
        templateId: String(templateId),
        dayNumber: String(nextDay),
        dayName: nextDayName,
      },
    });
  };

  const handleResumePress = () => {
    // Feature 005 placeholder — navigate home with active workout context
    router.push('/home');
  };

  if (isLoading) {
    return (
      <Screen>
        <Text style={styles.loadingText}>Loading...</Text>
      </Screen>
    );
  }

  const activeProgrammeCard = preference?.selected_workout_template_name ? (
    <>
      {hasActiveWorkout ? (
        <Card style={[styles.card, styles.programmeCard]}>
          <Text style={styles.programmeLabel}>Active Programme</Text>
          <Text style={styles.programmeName}>{preference.selected_workout_template_name}</Text>
          <View style={styles.programmeMeta}>
            {preference.primary_goal && (
              <View style={styles.programmeChip}>
                <Text style={styles.programmeChipText}>{GOAL_LABEL[preference.primary_goal] ?? preference.primary_goal}</Text>
              </View>
            )}
            {preference.training_days_per_week && (
              <View style={styles.programmeChip}>
                <Text style={styles.programmeChipText}>{preference.training_days_per_week} days/week</Text>
              </View>
            )}
            {preference.experience_level && (
              <View style={styles.programmeChip}>
                <Text style={styles.programmeChipText}>{preference.experience_level}</Text>
              </View>
            )}
          </View>
        </Card>
      ) : (
        <Pressable
          onPress={handleCardPress}
          accessibilityRole="button"
          accessibilityLabel={`Start workout: ${nextDayName}`}
          style={({ pressed }) => [pressed && styles.cardPressed]}
        >
          <Card style={[styles.card, styles.programmeCard]}>
            <Text style={styles.programmeLabel}>Active Programme</Text>
            <Text style={styles.programmeName}>{preference.selected_workout_template_name}</Text>
            <Text style={styles.nextUpLabel}>
              Next Up: Day {nextDay} — {nextDayName}
            </Text>
            <View style={styles.programmeMeta}>
              {preference.primary_goal && (
                <View style={styles.programmeChip}>
                  <Text style={styles.programmeChipText}>{GOAL_LABEL[preference.primary_goal] ?? preference.primary_goal}</Text>
                </View>
              )}
              {preference.training_days_per_week && (
                <View style={styles.programmeChip}>
                  <Text style={styles.programmeChipText}>{preference.training_days_per_week} days/week</Text>
                </View>
              )}
              {preference.experience_level && (
                <View style={styles.programmeChip}>
                  <Text style={styles.programmeChipText}>{preference.experience_level}</Text>
                </View>
              )}
            </View>
          </Card>
        </Pressable>
      )}

      {hasActiveWorkout && (
        <Button
          title="Resume Workout"
          onPress={handleResumePress}
          variant="primary"
          style={styles.resumeButton}
        />
      )}
    </>
  ) : preference ? (
    <Card style={styles.card}>
      <Text style={styles.prefsTitle}>Your Preferences</Text>
      <View style={styles.prefRow}>
        <Text style={styles.prefLabel}>Goal</Text>
        <Text style={styles.prefValue}>
          {preference.primary_goal ? GOAL_LABEL[preference.primary_goal] ?? preference.primary_goal : '—'}
        </Text>
      </View>
      <View style={styles.prefRow}>
        <Text style={styles.prefLabel}>Training days</Text>
        <Text style={styles.prefValue}>
          {preference.training_days_per_week ? `${preference.training_days_per_week} days/week` : '—'}
        </Text>
      </View>
      <View style={styles.prefRow}>
        <Text style={styles.prefLabel}>Experience</Text>
        <Text style={styles.prefValue}>{preference.experience_level ?? '—'}</Text>
      </View>
      <View style={[styles.prefRow, styles.prefRowLast]}>
        <Text style={styles.prefLabel}>Onboarding</Text>
        <Text style={[styles.prefValue, preference.onboarding_completed ? styles.complete : styles.incomplete]}>
          {preference.onboarding_completed ? 'Complete' : 'Incomplete'}
        </Text>
      </View>
    </Card>
  ) : null;

  return (
    <Screen>
      <Card style={styles.card}>
        <Text style={styles.title}>Welcome{user?.first_name ? `, ${user.first_name}` : ''}!</Text>
        {user && <Text style={styles.subtitle}>{user.email}</Text>}
        <Text style={styles.body}>Ready to work out?</Text>
      </Card>

      {activeProgrammeCard}

      <Button
        title={isLoggingOut ? 'Logging out...' : 'Logout'}
        onPress={handleLogout}
        disabled={isLoggingOut}
        variant="destructive"
        style={styles.logoutButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  cardPressed: {
    opacity: 0.85,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.subtitle,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
  },
  loadingText: {
    ...typography.body,
    textAlign: 'center',
  },
  logoutButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
  resumeButton: {
    marginBottom: spacing.lg,
  },
  programmeCard: {
    borderColor: colors.electricBlue,
    borderWidth: 2,
  },
  programmeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.electricBlue,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  programmeName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.deepNavy,
    marginBottom: spacing.xs,
  },
  nextUpLabel: {
    ...typography.caption,
    color: colors.electricBlue,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  programmeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  programmeChip: {
    backgroundColor: colors.lightBlue,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  programmeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.electricBlue,
  },
  prefsTitle: {
    ...typography.subtitle,
    fontWeight: '600',
    color: colors.deepNavy,
    marginBottom: spacing.md,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmGray2,
  },
  prefRowLast: {
    borderBottomWidth: 0,
  },
  prefLabel: {
    ...typography.caption,
    color: colors.mediumGray,
  },
  prefValue: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.deepNavy,
  },
  complete: {
    color: colors.freshGreen,
  },
  incomplete: {
    color: colors.energeticOrange,
  },
});
