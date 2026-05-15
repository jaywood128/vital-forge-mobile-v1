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
    ...typography.body,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.md,
    paddingTop: spacing.xl,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  dayCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardPressed: {
    opacity: 0.75,
    borderColor: colors.electricBlueLight,
  },
  dayNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.pureWhite,
    lineHeight: 56,
  },
  dayLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
    marginTop: spacing.xs,
  },
});
