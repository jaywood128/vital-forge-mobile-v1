import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';

type PRToastProps = {
  exerciseName: string;
  previous1RM: number;
  current1RM: number;
  onDismiss: () => void;
  /** Bottom offset in px — pass the footer height so the toast clears it */
  bottomOffset?: number;
};

export default function PRToast({ exerciseName, previous1RM, current1RM, onDismiss, bottomOffset = 0 }: PRToastProps) {
  const { bottom } = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(120)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: bottomOffset + bottom + spacing.sm, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>🏆 New PR — {exerciseName}</Text>
        <Text style={styles.subtitle}>
          1RM {Math.round(previous1RM)} → {Math.round(current1RM)} lbs
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: spacing.md,
  },
  inner: {
    backgroundColor: colors.navyDeep,
    borderLeftWidth: 4,
    borderLeftColor: colors.energeticOrange,
    borderRadius: 8,
    padding: spacing.md,
  },
  title: {
    ...typography.body,
    color: colors.pureWhite,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
});
