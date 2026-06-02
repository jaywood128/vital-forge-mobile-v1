import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { radius, spacing } from '../../theme';

export function WorkoutHistorySkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Animated.View style={[styles.bar, styles.dateBar, { opacity }]} />
        <Animated.View style={[styles.bar, styles.badgeBar, { opacity }]} />
      </View>
      <Animated.View style={[styles.bar, styles.nameBar, { opacity }]} />
      <Animated.View style={[styles.bar, styles.metaBar, { opacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bar: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
  },
  dateBar: { width: 100, height: 12 },
  badgeBar: { width: 60, height: 12 },
  nameBar: { width: '70%', height: 18 },
  metaBar: { width: '45%', height: 12 },
});
