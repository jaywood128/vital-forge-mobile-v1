import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '../theme';
import { NewPersonalRecord } from '../features/workouts/workoutsApi';

type Props = {
  prs: NewPersonalRecord[];
  onDone: () => void;
};

const DOT_COLORS = [
  colors.energeticOrange,
  colors.electricBlueLight,
  colors.success,
  colors.energeticOrange,
  '#A78BFA',
  colors.electricBlueLight,
  colors.energeticOrange,
];

export default function PRSummaryModal({ prs, onDone }: Props) {
  const scale   = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dots    = useRef(DOT_COLORS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 90, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    dots.forEach((dot, i) => {
      const loop = () => {
        Animated.sequence([
          Animated.timing(dot, { toValue: -8, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue:  0, duration: 280, useNativeDriver: true }),
        ]).start(({ finished }) => { if (finished) loop(); });
      };
      timeouts.push(setTimeout(loop, i * 100));
    });

    return () => {
      timeouts.forEach(clearTimeout);
      dots.forEach((d) => d.stopAnimation());
    };
  }, []);

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>

          <View style={styles.dotsRow}>
            {dots.map((dot, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: DOT_COLORS[i], transform: [{ translateY: dot }] },
                ]}
              />
            ))}
          </View>

          <Text style={styles.heroText}>You crushed it.</Text>
          <Text style={styles.heroSub}>
            {prs.length} New Personal Record{prs.length !== 1 ? 's' : ''}
          </Text>

          <View style={styles.streakPill}>
            <Text style={styles.streakText}>🔥 Keep the streak alive</Text>
          </View>

          <View style={styles.divider} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {prs.map((pr, i) => (
              <View key={i} style={styles.prCard}>
                <View style={styles.prLeft}>
                  <Text style={styles.prExercise}>{pr.exercise_name}</Text>
                  <Text style={styles.prSet}>
                    {pr.weight} lbs × {pr.reps} reps
                  </Text>
                  {pr.previous_best === null ? (
                    <Text style={styles.prFirst}>✦ First PR</Text>
                  ) : (
                    <Text style={styles.prDelta}>
                      ↑ {Math.round(pr.estimated_1rm - pr.previous_best)} lbs from{' '}
                      {Math.round(pr.previous_best)}
                    </Text>
                  )}
                </View>
                <View style={styles.pr1rmCol}>
                  <Text style={styles.pr1rm}>{Math.round(pr.estimated_1rm)}</Text>
                  <Text style={styles.pr1rmLabel}>est. 1RM lbs</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>🎉 Done — keep it up!</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: '#111E35',
    borderRadius: radius.lg + 4,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    maxHeight: '85%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  heroText: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.pureWhite,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.energeticOrange,
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: 0.4,
  },
  streakPill: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  streakText: {
    backgroundColor: 'rgba(245,166,35,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.3)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '700',
    color: colors.energeticOrange,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: spacing.md,
  },
  scroll: {
    maxHeight: 280,
  },
  scrollContent: {
    gap: spacing.sm,
  },
  prCard: {
    backgroundColor: 'rgba(245,166,35,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.20)',
    borderLeftWidth: 3,
    borderLeftColor: colors.energeticOrange,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  prLeft: {
    flex: 1,
  },
  prExercise: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.pureWhite,
    marginBottom: 3,
  },
  prSet: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  prFirst: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  prDelta: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.energeticOrange,
  },
  pr1rmCol: {
    alignItems: 'flex-end',
  },
  pr1rm: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.energeticOrange,
    lineHeight: 30,
  },
  pr1rmLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: colors.energeticOrange,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: colors.energeticOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.pureWhite,
    letterSpacing: 0.3,
  },
});
