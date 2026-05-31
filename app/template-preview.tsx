import { Text, Pressable, StyleSheet, ScrollView, View, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useGetTemplatesQuery, useGetTemplateQuery, type WorkoutTemplate, type TemplateExercise } from '../src/features/templates/templatesApi';
import { useUpdatePreferenceMutation, type PrimaryGoal } from '../src/features/userPreference/userPreferenceApi';
import { colors, spacing, typography, radius } from '../src/theme';

const GOAL_LABEL: Record<PrimaryGoal, string> = {
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

  const exercises: TemplateExercise[] = detail?.days?.flatMap((d) => d.exercises) ?? [];

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
            <ActivityIndicator color={colors.electricBlueLight} size="small" style={styles.exerciseLoader} />
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
  const insets = useSafeAreaInsets();

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
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={styles.title}>Your programmes</Text>
        <Text style={styles.subtitle}>
          Based on your goal ({GOAL_LABEL[goal as PrimaryGoal] ?? goal}), {days} days/week, {level} level.
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
          <LinearGradient
            colors={[colors.energeticOrange, '#f07c0a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Go to Dashboard</Text>
          </LinearGradient>
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
    ...typography.body,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  loader: {
    marginTop: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  cardSelected: {
    borderColor: colors.electricBlueLight,
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
    fontWeight: '700',
    color: colors.pureWhite,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    backgroundColor: 'rgba(74,144,217,0.2)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.electricBlueLight,
  },
  cardDescription: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
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
    color: 'rgba(255,255,255,0.4)',
  },
  metaDot: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    marginTop: spacing.xs,
  },
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
    color: colors.electricBlueLight,
  },
  selectButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.electricBlueLight,
    marginLeft: spacing.sm,
  },
  selectButtonActive: {
    backgroundColor: colors.electricBlue,
    borderColor: colors.electricBlue,
  },
  selectButtonPressed: {
    opacity: 0.7,
  },
  selectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.electricBlueLight,
  },
  selectButtonTextActive: {
    color: colors.pureWhite,
  },
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
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  exerciseIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(74,144,217,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  exerciseIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.electricBlueLight,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.pureWhite,
    marginBottom: 2,
  },
  exerciseMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  exerciseNotes: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    fontStyle: 'italic',
    marginTop: 2,
  },
  ctaButton: {
    borderRadius: radius.sm,
    marginTop: spacing.lg,
    overflow: 'hidden',
    shadowColor: colors.energeticOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonPressed: {
    opacity: 0.85,
  },
  ctaGradient: {
    padding: spacing.md,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.pureWhite,
  },
});
