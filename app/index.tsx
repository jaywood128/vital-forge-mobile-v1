import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radius } from '../src/theme';

export default function Index() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[colors.navyDeep, colors.navyMid]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.content}>
        <Text style={styles.title}>VitalForge</Text>
        <Text style={styles.subtitle}>Your Gym Companion</Text>
      </View>

      <View style={styles.footer}>
        <LinearGradient
          colors={[colors.energeticOrange, '#f07c0a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.pureWhite,
    letterSpacing: -1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '400',
  },
  footer: {
    paddingBottom: spacing.xxl,
  },
  buttonGradient: {
    borderRadius: radius.sm,
    shadowColor: colors.energeticOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    paddingVertical: spacing.md,
    minHeight: spacing.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...typography.button,
    color: colors.pureWhite,
    textAlign: 'center',
  },
});
