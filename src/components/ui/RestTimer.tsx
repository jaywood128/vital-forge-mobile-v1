import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '../../theme';

type Props = {
  duration: number;
  onComplete: () => void;
  onSkip: () => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RestTimer({ duration, onComplete, onSkip }: Props) {
  const [remaining, setRemaining] = useState(duration);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    if (remaining <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCompleteRef.current();
      return;
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const isLow = remaining <= 10;
  const barColor = isLow ? colors.brightRed : colors.electricBlueLight;
  const barWidth = `${(remaining / duration) * 100}%` as `${number}%`;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Rest</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: barWidth, backgroundColor: barColor }]} />
        </View>
        <Text style={[styles.countdown, isLow && styles.countdownLow]}>
          {formatTime(remaining)}
        </Text>
        <Pressable
          onPress={onSkip}
          hitSlop={12}
          accessibilityLabel="Skip rest timer"
          accessibilityRole="button"
        >
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.pureWhite,
    borderTopWidth: 1,
    borderTopColor: colors.warmGray2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.mediumGray,
    width: 32,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.warmGray2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  countdown: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.darkCharcoal,
    minWidth: 36,
    textAlign: 'right',
  },
  countdownLow: {
    color: colors.brightRed,
  },
  skip: {
    ...typography.caption,
    color: colors.mediumGray,
    minWidth: 32,
    textAlign: 'right',
  },
});
