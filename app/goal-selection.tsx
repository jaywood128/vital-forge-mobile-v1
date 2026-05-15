import { Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  const handleSelectGoal = (goal: PrimaryGoal) => {
    router.push({ pathname: '/training-days', params: { goal } });
  };

  return (
    <LinearGradient
      colors={[colors.navyDeep, colors.navyMid]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]}
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
