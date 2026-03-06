import { Text, Pressable, StyleSheet, ScrollView, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useGetTemplatesQuery, useGetTemplateQuery, type WorkoutTemplate, type TemplateExercise } from '../src/features/templates/templatesApi';
import { useUpdatePreferenceMutation } from '../src/features/userPreference/userPreferenceApi';
import { colors, spacing, typography, radius } from '../src/theme';

const GOAL_LABEL: Record<string, string> = {
  physique: 'Build Muscle',
  strength: 'Get Stronger',
};

function ExpandableTemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: WorkoutTemplate;
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: detail, isFetching } = useGetTemplateQuery(template.id, { skip: !expanded });

  const exercises: TemplateExercise[] = detail?.exercises ?? [];

  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{template.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{template.difficulty_level}</Text>
        </View>
      </View>
      <Text style={styles.cardDescription}>{template.description}</Text>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>{template.days_per_week} days/week</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>{template.estimated_duration_minutes} min/session</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>{template.total_exercises} exercises</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>{template.source}</Text>
      </View>

      <View style={styles.cardActions}>
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={({ pressed }) => [styles.expandToggle, pressed && styles.expandTogglePressed]}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Hide exercises' : 'See exercises'}
        >
          <Text style={styles.expandToggleText}>
            {expanded ? 'Hide exercises ▲' : 'See exercises ▼'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onSelect(template.id)}
          style={({ pressed }) => [
            styles.selectButton,
            selected && styles.selectButtonActive,
            pressed && styles.selectButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={selected ? 'Selected programme' : 'Select this programme'}
        >
          <Text style={[styles.selectButtonText, selected && styles.selectButtonTextActive]}>
            {selected ? '✓ Selected' : 'Select'}
          </Text>
        </Pressable>
      </View>

      {expanded && (
        <View style={styles.exerciseList}>
          {isFetching ? (
            <ActivityIndicator color={colors.electricBlue} size="small" style={styles.exerciseLoader} />
          ) : (
            exercises
              .slice()
              .sort((a, b) => a.order_position - b.order_position)
              .map((item) => (
                <View key={item.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseIndex}>
                    <Text style={styles.exerciseIndexText}>{item.order_position}</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{item.exercise.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {item.recommended_sets} sets × {item.recommended_reps} reps
                      {'  ·  '}{item.exercise.muscle_group}
                      {'  ·  '}{item.exercise.equipment}
                    </Text>
                    {item.notes ? (
                      <Text style={styles.exerciseNotes}>{item.notes}</Text>
                    ) : null}
                  </View>
                </View>
              ))
          )}
        </View>
      )}
    </View>
  );
}

export default function TemplatePreviewScreen() {
  const router = useRouter();
  const { goal, days, level } = useLocalSearchParams<{ goal: string; days: string; level: string }>();
  const { data: allTemplates, isLoading, isError } = useGetTemplatesQuery();
  const [updatePreference] = useUpdatePreferenceMutation();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const matched = allTemplates?.filter((t) => t.goal_type === goal) ?? [];

  const handleSelect = async (id: number) => {
    setSelectedId(id);
    try {
      await updatePreference({ selected_workout_template_id: id }).unwrap();
    } catch {
      // Non-blocking — selection is reflected locally regardless
    }
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Your programmes</Text>
        <Text style={styles.subtitle}>
          Based on your goal ({GOAL_LABEL[goal] ?? goal}), {days} days/week, {level} level.
        </Text>

        {isLoading && (
          <ActivityIndicator color={colors.pureWhite} size="large" style={styles.loader} />
        )}

        {isError && (
          <Text style={styles.errorText}>Could not load programmes. You can browse them from the home screen.</Text>
        )}

        {matched.map((template) => (
          <ExpandableTemplateCard
            key={template.id}
            template={template}
            selected={selectedId === template.id}
            onSelect={handleSelect}
          />
        ))}

        {!isLoading && !isError && matched.length === 0 && (
          <Text style={styles.errorText}>No programmes found. You can browse all templates from the home screen.</Text>
        )}

        <Pressable
          onPress={() => router.replace('/home')}
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Go to dashboard"
        >
          <Text style={styles.ctaText}>Go to Dashboard</Text>
        </Pressable>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
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
  loader: {
    marginTop: spacing.xl,
  },
  errorText: {
    ...typography.bodyLight,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: spacing.lg,
  },
  // Template card
  card: {
    backgroundColor: colors.pureWhite,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warmGray2,
  },
  cardSelected: {
    borderColor: colors.electricBlue,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.deepNavy,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    backgroundColor: colors.lightBlue,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.electricBlue,
  },
  cardDescription: {
    ...typography.caption,
    color: colors.mediumGray,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  metaText: {
    fontSize: 12,
    color: colors.mediumGray,
  },
  metaDot: {
    fontSize: 12,
    color: colors.mediumGray,
  },
  // Card actions row
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.warmGray2,
    marginTop: spacing.xs,
  },
  // Expand toggle
  expandToggle: {
    paddingVertical: spacing.sm,
    flex: 1,
  },
  expandTogglePressed: {
    opacity: 0.6,
  },
  expandToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.electricBlue,
  },
  selectButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.electricBlue,
    marginLeft: spacing.sm,
  },
  selectButtonActive: {
    backgroundColor: colors.electricBlue,
  },
  selectButtonPressed: {
    opacity: 0.7,
  },
  selectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.electricBlue,
  },
  selectButtonTextActive: {
    color: colors.pureWhite,
  },
  // Exercise list
  exerciseList: {
    marginTop: spacing.sm,
  },
  exerciseLoader: {
    marginVertical: spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmGray,
  },
  exerciseIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  exerciseIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.electricBlue,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.deepNavy,
    marginBottom: 2,
  },
  exerciseMeta: {
    fontSize: 12,
    color: colors.mediumGray,
  },
  exerciseNotes: {
    fontSize: 12,
    color: colors.mediumGray,
    fontStyle: 'italic',
    marginTop: 2,
  },
  // CTA
  ctaButton: {
    backgroundColor: colors.pureWhite,
    borderRadius: radius.card,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  ctaButtonPressed: {
    opacity: 0.85,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.deepNavy,
  },
});
