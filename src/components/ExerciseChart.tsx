import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors, spacing, typography } from '../theme';
import { ExerciseSeriesPoint } from '../lib/stats/exerciseHistory';

type Props = {
  data: ExerciseSeriesPoint[];
  metricLabel: string;
};

const CHART_WIDTH = Dimensions.get('window').width - spacing.md * 2 - 40;

export default function ExerciseChart({ data, metricLabel }: Props) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data yet — log some sets to see your progress.</Text>
      </View>
    );
  }

  const chartData = data.map((pt) => ({
    value: pt.y,
    label: pt.x.slice(5),
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.metricLabel}>{metricLabel}</Text>
      <LineChart
        data={chartData}
        width={CHART_WIDTH}
        height={180}
        color={colors.electricBlueLight}
        thickness={2}
        dataPointsColor={colors.energeticOrange}
        dataPointsRadius={4}
        areaChart
        startFillColor={colors.electricBlueLight}
        endFillColor="transparent"
        startOpacity={0.25}
        endOpacity={0}
        curved
        hideRules
        yAxisColor="rgba(255,255,255,0.1)"
        xAxisColor="rgba(255,255,255,0.1)"
        yAxisTextStyle={styles.axisText}
        xAxisLabelTextStyle={styles.axisText}
        noOfSections={4}
        spacing={CHART_WIDTH / Math.max(chartData.length, 1)}
        initialSpacing={8}
        endSpacing={8}
        hideYAxisText={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  metricLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  axisText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
  },
});
