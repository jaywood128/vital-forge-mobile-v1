import { Text, Pressable, StyleSheet, ScrollView, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { type FitnessGoal, useSetGoalMutation } from '../src/features/goals/goalsApi';
import { colors, spacing, typography, radius } from '../src/theme';

type GoalOption = {
  key: FitnessGoal;
  title: string;
  description: string;
};

const GOALS: GoalOption[] = [
  {
    key: 'build_muscle',
    title: 'Build Muscle',
    description: 'Maximize hypertrophy and muscle growth with progressive overload.',
  },
  {
    key: 'lose_fat',
    title: 'Lose Fat',
    description: 'Burn calories and improve body composition through targeted training.',
  },
  {
    key: 'get_stronger',
    title: 'Get Stronger',
    description: 'Increase your one-rep maxes and build raw strength.',
  },
  {
    key: 'general_fitness',
    title: 'General Fitness',
    description: 'Improve overall health, conditioning, and feel great.',
  },
];

export default function GoalSelectionScreen() {
  const router = useRouter();
  const [setGoal, { isLoading }] = useSetGoalMutation();

  const handleSelectGoal = async (goal: FitnessGoal) => {
    try {
      await setGoal({ fitness_goal: goal }).unwrap();
    } catch {
      // Goal save failure is non-blocking — proceed to home regardless
      Alert.alert('Notice', 'Could not save your goal right now. You can set it later in your profile.');
    }
    router.replace('/home');
  };

  const handleSkip = () => {
    router.replace('/home');
  };

  return (
    <LinearGradient
      colors={[colors.deepNavy, colors.deepNavyLight, colors.electricBlue]}
      style={styles.gradient}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>What's your goal?</Text>
        <Text style={styles.subtitle}>Choose what you want to focus on. You can change this anytime.</Text>

        {GOALS.map((goal) => (
          <Pressable
            key={goal.key}
            onPress={() => !isLoading && handleSelectGoal(goal.key)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={goal.title}
          >
            <Text style={styles.cardTitle}>{goal.title}</Text>
            <Text style={styles.cardDescription}>{goal.description}</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [styles.card, styles.skipCard, pressed && styles.cardPressed]}
          accessibilityRole="button"
          accessibilityLabel="Skip for now"
        >
          <Text style={styles.skipTitle}>Skip for now</Text>
          <Text style={styles.skipDescription}>Explore templates and set your goal later.</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>All features are available regardless of your goal.</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.titleLight,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyLight,
    textAlign: 'center',
    marginBottom: spacing.xl,
    opacity: 0.85,
  },
  card: {
    backgroundColor: colors.pureWhite,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    minHeight: spacing.touchMin,
    borderWidth: 1,
    borderColor: colors.warmGray2,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.deepNavy,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...typography.caption,
    color: colors.mediumGray,
  },
  skipCard: {
    backgroundColor: 'transparent',
    borderColor: colors.pureWhite,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  skipTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.pureWhite,
    marginBottom: spacing.xs,
  },
  skipDescription: {
    ...typography.caption,
    color: colors.pureWhite,
    opacity: 0.8,
  },
  footer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  footerText: {
    ...typography.caption,
    color: colors.pureWhite,
    textAlign: 'center',
    opacity: 0.7,
  },
});
