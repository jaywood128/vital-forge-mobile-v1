import { Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { type PrimaryGoal } from '../src/features/userPreference/userPreferenceApi';
import { colors, spacing, typography, radius } from '../src/theme';

type GoalOption = {
  key: PrimaryGoal;
  title: string;
  description: string;
};

const GOALS: GoalOption[] = [
  {
    key: 'physique',
    title: 'Build Muscle',
    description: 'Maximize hypertrophy and muscle growth with progressive overload. Programmes include Push/Pull/Legs, Arnold Split and Bro Split.',
  },
  {
    key: 'strength',
    title: 'Get Stronger',
    description: 'Increase your one-rep maxes and build raw strength with compound lifts. Programmes include 5/3/1, Upper/Lower Split and Full Body.',
  },
];

export default function GoalSelectionScreen() {
  const router = useRouter();

  const handleSelectGoal = (goal: PrimaryGoal) => {
    router.push({ pathname: '/training-days', params: { goal } });
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
        <Text style={styles.title}>{"What's your goal?"}</Text>
        <Text style={styles.subtitle}>This shapes the programmes we recommend for you.</Text>

        {GOALS.map((goal) => (
          <Pressable
            key={goal.key}
            onPress={() => handleSelectGoal(goal.key)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={goal.title}
          >
            <Text style={styles.cardTitle}>{goal.title}</Text>
            <Text style={styles.cardDescription}>{goal.description}</Text>
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
    lineHeight: 20,
  },
});
