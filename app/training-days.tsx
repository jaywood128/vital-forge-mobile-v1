import { Text, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radius } from '../src/theme';

const DAY_OPTIONS = [3, 4, 5, 6];

export default function TrainingDaysScreen() {
  const router = useRouter();
  const { goal } = useLocalSearchParams<{ goal: string }>();

  const handleSelectDays = (days: number) => {
    router.push({ pathname: '/experience-level', params: { goal, days: String(days) } });
  };

  return (
    <LinearGradient
      colors={[colors.deepNavy, colors.deepNavyLight, colors.electricBlue]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </SafeAreaView>
      <View style={styles.content}>
        <Text style={styles.title}>How many days{'\n'}can you train?</Text>
        <Text style={styles.subtitle}>Per week. Be realistic — consistency beats intensity.</Text>

        <View style={styles.grid}>
          {DAY_OPTIONS.map((days) => (
            <Pressable
              key={days}
              onPress={() => handleSelectDays(days)}
              style={({ pressed }) => [styles.dayCard, pressed && styles.dayCardPressed]}
              accessibilityRole="button"
              accessibilityLabel={`${days} days per week`}
            >
              <Text style={styles.dayNumber}>{days}</Text>
              <Text style={styles.dayLabel}>days / week</Text>
            </Pressable>
          ))}
        </View>
      </View>
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
    ...typography.bodyLight,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.md,
    paddingTop: spacing.xl,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  dayCard: {
    backgroundColor: colors.pureWhite,
    borderRadius: radius.card,
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.warmGray2,
  },
  dayCardPressed: {
    opacity: 0.85,
  },
  dayNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.deepNavy,
    lineHeight: 56,
  },
  dayLabel: {
    ...typography.caption,
    color: colors.mediumGray,
    marginTop: spacing.xs,
  },
});
