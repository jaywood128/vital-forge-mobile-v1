import { Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { type ExperienceLevel, useCreatePreferenceMutation, isPrimaryGoal } from '../src/features/userPreference/userPreferenceApi';
import { colors, spacing, typography, radius } from '../src/theme';

type LevelOption = {
  key: ExperienceLevel;
  title: string;
  description: string;
};

const LEVELS: LevelOption[] = [
  {
    key: 'Beginner',
    title: 'Beginner',
    description: 'Less than 1 year of consistent training. Focus on learning movement patterns and building a base.',
  },
  {
    key: 'Intermediate',
    title: 'Intermediate',
    description: '1–3 years of consistent training. Ready for structured programmes with progressive overload.',
  },
  {
    key: 'Advanced',
    title: 'Advanced',
    description: '3+ years of consistent training. Comfortable with complex lifts and periodisation.',
  },
];

export default function ExperienceLevelScreen() {
  const router = useRouter();
  const { goal, days } = useLocalSearchParams<{ goal: string; days: string }>();
  const [createPreference, { isLoading }] = useCreatePreferenceMutation();

  const handleSelectLevel = async (level: ExperienceLevel) => {
    try {
      await createPreference({
        primary_goal: isPrimaryGoal(goal) ? goal : 'physique',
        training_days_per_week: Number(days),
        experience_level: level,
      }).unwrap();
    } catch {
      Alert.alert('Notice', 'Could not save your preferences right now. You can update them later in your profile.');
    }
    router.push({ pathname: '/template-preview', params: { goal, days, level } });
  };

  return (
    <LinearGradient
      colors={[colors.navyDeep, colors.navyMid]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Your experience level?</Text>
        <Text style={styles.subtitle}>We use this to match you with the right programme.</Text>

        {LEVELS.map((level) => (
          <Pressable
            key={level.key}
            onPress={() => !isLoading && handleSelectLevel(level.key)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={level.title}
          >
            <Text style={styles.cardTitle}>{level.title}</Text>
            <Text style={styles.cardDescription}>{level.description}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backButton: {
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  backText: {
    ...typography.body,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.pureWhite,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  cardPressed: {
    opacity: 0.75,
    borderColor: colors.electricBlueLight,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.pureWhite,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
  },
});
