import { useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
type LoggedSetData = { weight: number; reps: number };
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
  onInputChange,
  onLog,
  onReEdit,
}: SetRowProps) {
  const canLog = input.weight.trim().length > 0 && input.reps.trim().length > 0;

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
          {loggedData.weight} lbs × {loggedData.reps} reps
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
            style={styles.input}
            value={input.weight}
            onChangeText={(v) => onInputChange('weight', v)}
            placeholder="0"
            keyboardType="numeric"
            editable={!isLoading}
            accessibilityLabel={`Weight for set ${set.set_number}`}
          />
          <Text style={styles.inputUnit}>lbs</Text>
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
          style={[styles.logButton, (isLoading || !canLog) && styles.logButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel={isLoading ? 'Saving...' : 'Log set'}
        >
          <Text style={styles.logButtonText}>{isLoading ? '...' : 'Log'}</Text>
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
  onInputChange,
  onLog,
  onReEdit,
}: ExerciseSectionProps) {
  return (
    <Card style={styles.exerciseCard}>
      <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
      {exercise.exercise.muscle_group ? (
        <View style={styles.muscleChip}>
          <Text style={styles.muscleChipText}>{exercise.exercise.muscle_group}</Text>
        </View>
      ) : null}

      {exercise.exercise_sets.map((set) => {
        const isLoggedFromApi = set.completed && set.weight != null && set.reps != null;
        const isLoggedLocally = !!loggedMap[set.id];
        const isLogged = isLoggedLocally || isLoggedFromApi;
        const loggedData: LoggedSetData | undefined = isLoggedLocally
          ? loggedMap[set.id]
          : isLoggedFromApi
            ? { weight: set.weight!, reps: set.reps! }
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

  const { data: workout, isLoading, isError, refetch } = useGetWorkoutQuery(workoutIdNum, {
    skip: !workoutId,
  });
  const [completeWorkout, { isLoading: isCompleting }] = useCompleteWorkoutMutation();
  const [logSet] = useLogSetMutation();

  // Screen-level state — all keyed by exerciseSetId
  const [inputMap, setInputMap] = useState<InputMap>({});
  const [loggedMap, setLoggedMap] = useState<LoggedMap>({});
  const [errorMap, setErrorMap] = useState<ErrorMap>({});
  const [loadingSetId, setLoadingSetId] = useState<number | null>(null);

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
  }, [workout?.completed]);

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
      weight: Number(weight),
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
        [set.id]: { weight: Number(weight), reps: Number(reps) },
      }));
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
      } catch {
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

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={colors.electricBlue} style={styles.loader} />
      </Screen>
    );
  }

  if (isError || !workout) {
    return (
      <Screen>
        <Text style={styles.errorText}>Failed to load workout. Please try again.</Text>
        <Button title="Retry" onPress={refetch} variant="secondary" style={styles.retryButton} />
      </Screen>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={workout.workout_exercises}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <Card style={styles.headerCard}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            {dayName ? <Text style={styles.dayLabel}>{dayName}</Text> : null}
          </Card>
        }
        renderItem={({ item }) => (
          <ExerciseSection
            exercise={item}
            inputMap={inputMap}
            loggedMap={loggedMap}
            errorMap={errorMap}
            loadingSetId={loadingSetId}
            onInputChange={handleInputChange}
            onLog={handleLog}
            onReEdit={handleReEdit}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* Sticky footer — FR-008 */}
      <View style={styles.footer}>
        <Button
          title={isCompleting ? 'Finishing...' : 'Finish Workout'}
          onPress={handleFinishWorkout}
          variant="primary"
          disabled={isCompleting}
          style={styles.finishButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmGray,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.mediumGray,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  retryButton: {
    alignSelf: 'center',
  },
  headerCard: {
    margin: spacing.md,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.deepNavy,
    marginBottom: spacing.xs,
  },
  dayLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.electricBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  exerciseCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  exerciseName: {
    ...typography.subtitle,
    color: colors.deepNavy,
    marginBottom: spacing.xs,
  },
  muscleChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lightBlue,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  muscleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.electricBlue,
  },
  setRow: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.warmGray2,
  },
  setRowLogged: {
    backgroundColor: colors.lightGreen,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: spacing.touchMin,
  },
  setNumber: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.mediumGray,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.warmGray2,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    width: 64,
    textAlign: 'center',
    ...typography.body,
    color: colors.deepNavy,
    minHeight: spacing.touchMin,
  },
  inputUnit: {
    ...typography.caption,
    color: colors.mediumGray,
  },
  logButton: {
    backgroundColor: colors.electricBlue,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    minHeight: spacing.touchMin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logButtonDisabled: {
    backgroundColor: colors.mediumGray,
  },
  logButtonText: {
    ...typography.button,
    color: colors.pureWhite,
  },
  inlineError: {
    ...typography.caption,
    color: colors.brightRed,
    marginTop: spacing.xs,
  },
  footer: {
    backgroundColor: colors.pureWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.warmGray2,
  },
  finishButton: {
    minHeight: spacing.touchMin,
  },
});
