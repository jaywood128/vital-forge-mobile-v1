import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

type PRBadgeProps = {
  style?: StyleProp<ViewStyle>;
};

export default function PRBadge({ style }: PRBadgeProps) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.trophy}>🏆</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.energeticOrange,
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  trophy: {
    fontSize: 12,
  },
});
