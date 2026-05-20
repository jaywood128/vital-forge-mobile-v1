import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const GRADIENT_NORMAL: [string, string] = ['#00E5FF', '#0080FF'];
const GRADIENT_LOW: [string, string]    = ['#FF4500', '#FF2D78'];

export function RestTimer({ duration, onComplete, onSkip }: Props) {
  const [remaining, setRemaining] = useState(duration);
  const [trackWidth, setTrackWidth] = useState(0);
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
  const progress = remaining / duration;
  const gradient = isLow ? GRADIENT_LOW : GRADIENT_NORMAL;
  const glowColor = isLow ? '#FF4500' : '#00E5FF';

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Rest</Text>

        <View
          style={styles.barTrack}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          <View style={[styles.barFill, { width: `${progress * 100}%` }]}>
            {trackWidth > 0 && (
              <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.barGradient,
                  { width: trackWidth },
                  Platform.select({
                    ios: {
                      shadowColor: glowColor,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.9,
                      shadowRadius: 6,
                    },
                    android: { elevation: 4 },
                  }),
                ]}
              />
            )}
          </View>
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
    backgroundColor: colors.navyDeep,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.45)',
    width: 32,
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    overflow: 'hidden',
    borderRadius: 5,
  },
  barGradient: {
    height: '100%',
    borderRadius: 5,
  },
  countdown: {
    ...typography.caption,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    minWidth: 36,
    textAlign: 'right',
  },
  countdownLow: {
    color: '#FF4500',
  },
  skip: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.35)',
    minWidth: 32,
    textAlign: 'right',
  },
});
