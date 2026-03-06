import { Text, StyleSheet, Alert, View } from 'react-native';
import { useGetCurrentUserQuery, useLogoutMutation } from '../src/features/auth/authApi';
import { useGetPreferenceQuery } from '../src/features/userPreference/userPreferenceApi';
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

  if (isLoading) {
    return (
      <Screen>
        <Text style={styles.loadingText}>Loading...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={styles.card}>
        <Text style={styles.title}>Welcome{user?.first_name ? `, ${user.first_name}` : ''}!</Text>
        {user && <Text style={styles.subtitle}>{user.email}</Text>}
        <Text style={styles.body}>Ready to work out?</Text>
      </Card>

      {preference?.selected_workout_template_name ? (
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
      ) : preference && (
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
      )}

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
