import { useCallback, useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  useGetWorkoutQuery,
  useCompleteWorkoutMutation,
  type WorkoutExerciseDetail,
  type ExerciseSet,
} from '../src/features/workouts/workoutsApi';
import { useLogSetMutation } from '../src/features/workouts/exerciseSetsApi';
import { colors, spacing, typography, radius } from '../src/theme';
import { Screen, Card, Button } from '../src/components/ui';

// Screen-level input state keyed by exerciseSetId — survives FlatList virtualisation
type SetInputState = { weight: string; reps: string };
type InputMap = Record<number, SetInputState>;

// Sets confirmed logged this session (weight/reps stored for display)
type LoggedSetData = { weight: number | null; reps: number };
type LoggedMap = Record<number, LoggedSetData>;

// Per-set error messages
type ErrorMap = Record<number, string>;

type SetRowProps = {
  set: ExerciseSet;
  input: SetInputState;
  isLogged: boolean;
  loggedData: LoggedSetData | undefined;
  isLoading: boolean;
  error: string | undefined;
  isBodyweight: boolean;
  onInputChange: (field: 'weight' | 'reps', value: string) => void;
  onLog: () => void;
  onReEdit: () => void;
};

function SetRow({
  set,
  input,
  isLogged,
  loggedData,
  isLoading,
  error,
  isBodyweight,
  onInputChange,
  onLog,
  onReEdit,
}: SetRowProps) {
  const canLog = isBodyweight
    ? input.reps.trim().length > 0
    : input.weight.trim().length > 0 && input.reps.trim().length > 0;

  if (isLogged && loggedData) {
    return (
      <TouchableOpacity
        onPress={onReEdit}
        style={[styles.setRow, styles.setRowLogged]}
        accessibilityRole="button"
        accessibilityLabel={`Set ${set.set_number} logged. Tap to edit.`}
      >
        <Text style={styles.setNumber}>Set {set.set_number}</Text>
        <Text style={styles.loggedValues}>
          {isBodyweight
            ? loggedData.weight
              ? `+${loggedData.weight} lbs × ${loggedData.reps} reps`
              : `${loggedData.reps} reps`
            : `${loggedData.weight} lbs × ${loggedData.reps} reps`}
        </Text>
        <Text style={styles.loggedBadge}>✓</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.setRow}>
      <Text style={styles.setNumber}>Set {set.set_number}</Text>

      <View style={styles.inputs}>
        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.input, isBodyweight && styles.inputOptional]}
            value={input.weight}
            onChangeText={(v) => onInputChange('weight', v)}
            placeholder={isBodyweight ? 'optional' : '0'}
            keyboardType="numeric"
            editable={!isLoading}
            accessibilityLabel={
              isBodyweight
                ? `Extra weight for set ${set.set_number}`
                : `Weight for set ${set.set_number}`
            }
          />
          <Text style={[styles.inputUnit, isBodyweight && styles.inputUnitOptional]}>
            {isBodyweight ? '+lbs' : 'lbs'}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            value={input.reps}
            onChangeText={(v) => onInputChange('reps', v)}
            placeholder="0"
            keyboardType="numeric"
            editable={!isLoading}
            accessibilityLabel={`Reps for set ${set.set_number}`}
          />
          <Text style={styles.inputUnit}>reps</Text>
        </View>

        <TouchableOpacity
          onPress={onLog}
          disabled={isLoading || !canLog}
          style={[styles.logButton, canLog && !isLoading && styles.logButtonReady]}
          accessibilityRole="button"
          accessibilityLabel={isLoading ? 'Saving...' : 'Log set'}
        >
          <LinearGradient
            colors={[colors.electricBlue, colors.electricBlueLight]}
            style={styles.logButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logButtonText}>{isLoading ? '…' : '+'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.inlineError}>{error}</Text> : null}
    </View>
  );
}

type ExerciseSectionProps = {
  exercise: WorkoutExerciseDetail;
  inputMap: InputMap;
  loggedMap: LoggedMap;
  errorMap: ErrorMap;
  loadingSetId: number | null;
  reEditedIds: ReadonlySet<number>;
  onInputChange: (setId: number, field: 'weight' | 'reps', value: string) => void;
  onLog: (set: ExerciseSet, weight: string, reps: string) => void;
  onReEdit: (setId: number) => void;
};

function ExerciseSection({
  exercise,
  inputMap,
  loggedMap,
  errorMap,
  loadingSetId,
  reEditedIds,
  onInputChange,
  onLog,
  onReEdit,
}: ExerciseSectionProps) {
  const isBodyweight = exercise.exercise.equipment === 'Bodyweight';

  return (
    <Card style={styles.exerciseCard}>
      <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
      {exercise.exercise.muscle_group ? (
        <View style={styles.muscleChip}>
          <Text style={styles.muscleChipText}>{exercise.exercise.muscle_group}</Text>
        </View>
      ) : null}

      {exercise.exercise_sets.map((set) => {
        const isLoggedFromApi = set.completed && set.reps != null;
        const isLoggedLocally = !!loggedMap[set.id];
        const isLogged = (isLoggedLocally || isLoggedFromApi) && !reEditedIds.has(set.id);
        const loggedData: LoggedSetData | undefined = isLoggedLocally
          ? loggedMap[set.id]
          : isLoggedFromApi
            ? { weight: set.weight, reps: set.reps! }
            : undefined;

        return (
          <SetRow
            key={set.id}
            set={set}
            input={inputMap[set.id] ?? { weight: '', reps: String(set.reps ?? '') }}
            isLogged={isLogged}
            loggedData={loggedData}
            isLoading={loadingSetId === set.id}
            error={errorMap[set.id]}
            isBodyweight={isBodyweight}
            onInputChange={(field, value) => onInputChange(set.id, field, value)}
            onLog={() => {
              const inp = inputMap[set.id] ?? { weight: '', reps: String(set.reps ?? '') };
              onLog(set, inp.weight, inp.reps);
            }}
            onReEdit={() => onReEdit(set.id)}
          />
        );
      })}
    </Card>
  );
}

export default function ActiveWorkoutScreen() {
  const { workoutId, dayName } = useLocalSearchParams<{
    workoutId: string;
    dayName?: string;
  }>();
  const router = useRouter();
  const workoutIdNum = Number(workoutId);

  const { data: workout, isLoading, isFetching, isError, refetch } = useGetWorkoutQuery(workoutIdNum, {
    skip: !workoutId,
  });

  // Force-refetch on focus so stale cached data (completed: false) never blocks the redirect
  useFocusEffect(useCallback(() => { if (workoutId) refetch(); }, [workoutId, refetch]));

  const [completeWorkout, { isLoading: isCompleting }] = useCompleteWorkoutMutation();
  const [logSet] = useLogSetMutation();

  // Screen-level state — all keyed by exerciseSetId
  const [inputMap, setInputMap] = useState<InputMap>({});
  const [loggedMap, setLoggedMap] = useState<LoggedMap>({});
  const [errorMap, setErrorMap] = useState<ErrorMap>({});
  const [loadingSetId, setLoadingSetId] = useState<number | null>(null);
  // Tracks sets the user has chosen to re-edit so API-logged sets (set.completed=true) can exit locked state
  const [reEditedIds, setReEditedIds] = useState<ReadonlySet<number>>(new Set());

  // Seed inputMap with template reps once workout data arrives (weight stays empty per FR-003)
  useEffect(() => {
    if (!workout) return;
    setInputMap((prev) => {
      const seeded: InputMap = {};
      workout.workout_exercises.forEach((we) => {
        we.exercise_sets.forEach((set) => {
          seeded[set.id] = prev[set.id] ?? { weight: '', reps: String(set.reps ?? '') };
        });
      });
      return seeded;
    });
  }, [workout?.id]);

  // Redirect if workout is already completed
  useEffect(() => {
    if (workout?.completed) {
      router.replace('/home');
    }
  }, [workout?.completed, router]);

  const handleInputChange = (setId: number, field: 'weight' | 'reps', value: string) => {
    setInputMap((prev) => ({
      ...prev,
      [setId]: { ...(prev[setId] ?? { weight: '', reps: '' }), [field]: value },
    }));
  };

  const handleLog = async (set: ExerciseSet, weight: string, reps: string) => {
    // Clear any previous error
    setErrorMap((prev) => ({ ...prev, [set.id]: '' }));
    setLoadingSetId(set.id);

    const promise = logSet({
      id: set.id,
      weight: weight.trim() ? Number(weight) : null,
      reps: Number(reps),
      completed: true,
    });

    // 10-second timeout — abort and treat as failure
    const timeoutId = setTimeout(() => promise.abort(), 10000);

    try {
      await promise.unwrap();
      clearTimeout(timeoutId);
      setLoggedMap((prev) => ({
        ...prev,
        [set.id]: { weight: weight.trim() ? Number(weight) : null, reps: Number(reps) },
      }));
      setReEditedIds((prev) => { const next = new Set(prev); next.delete(set.id); return next; });
    } catch (err: any) {
      clearTimeout(timeoutId);
      setErrorMap((prev) => ({
        ...prev,
        [set.id]: 'Failed to save set. Tap Log to retry.',
      }));
    } finally {
      setLoadingSetId(null);
    }
  };

  const handleReEdit = (setId: number) => {
    setLoggedMap((prev) => {
      const next = { ...prev };
      delete next[setId];
      return next;
    });
    setReEditedIds((prev) => { const next = new Set(prev); next.add(setId); return next; });
    setErrorMap((prev) => ({ ...prev, [setId]: '' }));
  };

  const handleFinishWorkout = async () => {
    const allSetsLogged =
      workout?.workout_exercises.every((we) =>
        we.exercise_sets.every((s) => s.completed || !!loggedMap[s.id])
      ) ?? false;

    const doComplete = async () => {
      try {
        await completeWorkout(workoutIdNum).unwrap();
        router.replace('/home');
      } catch (err: any) {
        // 422 = already completed (Workout::InvalidTransition). Treat as success.
        if (err?.status === 422) {
          router.replace('/home');
          return;
        }
        Alert.alert('Could not finish workout', 'Please try again.', [{ text: 'OK' }]);
      }
    };

    if (!allSetsLogged) {
      Alert.alert('End workout early?', 'You have unlogged sets. Finish anyway?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Finish', onPress: doComplete },
      ]);
    } else {
      await doComplete();
    }
  };

  if (isLoading || isFetching || workout?.completed) {
    return (
      <Screen variant="dark">
        <ActivityIndicator size="large" color={colors.pureWhite} style={styles.loader} />
      </Screen>
    );
  }

  if (isError || !workout) {
    return (
      <Screen variant="dark">
        <Text style={styles.errorText}>Failed to load workout. Please try again.</Text>
        <Button title="Retry" onPress={refetch} variant="secondary" style={styles.retryButton} />
      </Screen>
    );
  }

  return (
    <LinearGradient
      colors={[colors.navyDeep, colors.navyMid]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <FlatList
        data={workout.workout_exercises}
        keyExtractor={(item) => item.id.toString()}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <Card style={styles.headerCard}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.workoutName}>{workout.name}</Text>
                {dayName ? <Text style={styles.dayLabel}>{dayName}</Text> : null}
              </View>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Exit workout"
              >
                <Text style={styles.closeButtonText}>←</Text>
              </TouchableOpacity>
            </View>
          </Card>
        }
        renderItem={({ item }) => (
          <ExerciseSection
            exercise={item}
            inputMap={inputMap}
            loggedMap={loggedMap}
            errorMap={errorMap}
            loadingSetId={loadingSetId}
            reEditedIds={reEditedIds}
            onInputChange={handleInputChange}
            onLog={handleLog}
            onReEdit={handleReEdit}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* Sticky footer */}
      <View style={styles.footer}>
        <Button
          title={isCompleting ? 'Finishing...' : 'Finish Workout'}
          onPress={handleFinishWorkout}
          variant="primary"
          disabled={isCompleting}
          style={styles.finishButton}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  retryButton: {
    alignSelf: 'center',
  },
  headerCard: {
    margin: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.pureWhite,
    marginBottom: spacing.xs,
  },
  dayLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.electricBlueLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    minHeight: spacing.touchMin,
    minWidth: spacing.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.4)',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  exerciseCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.navyCard,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  exerciseName: {
    ...typography.subtitle,
    color: colors.pureWhite,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  muscleChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(74,144,217,0.2)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  muscleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.electricBlueLight,
  },
  setRow: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  setRowLogged: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: radius.sm,
    borderTopWidth: 0,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: spacing.touchMin,
    marginBottom: spacing.sm,
  },
  setNumber: {
    ...typography.caption,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: spacing.xs,
  },
  loggedValues: {
    ...typography.body,
    fontWeight: '600',
    color: colors.success,
    flex: 1,
    marginLeft: spacing.sm,
  },
  loggedBadge: {
    fontSize: 16,
    color: colors.success,
  },
  inputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.navyInput,
    borderRadius: radius.sm,
    width: '100%',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.pureWhite,
    minHeight: spacing.touchMin,
    paddingVertical: spacing.xs,
  },
  inputUnit: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.25)',
    marginTop: 2,
  },
  logButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.electricBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.55,
        shadowRadius: 7,
      },
      android: { elevation: 8 },
    }),
  },
  logButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonDisabled: {
    opacity: 0.4,
  },
  inputOptional: {
    opacity: 0.5,
  },
  inputUnitOptional: {
    opacity: 0.5,
  },
  logButtonText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.pureWhite,
    lineHeight: 28,
  },
  inlineError: {
    ...typography.caption,
    color: 'rgba(255,100,100,1)',
    marginTop: spacing.xs,
  },
  footer: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  finishButton: {
    minHeight: spacing.touchMin,
  },
});
