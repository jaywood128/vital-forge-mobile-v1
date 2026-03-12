# Tasks: View & Start Workout

**Input**: Design documents from `specs/004-start-workout/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/api-backend.md ✅

**Repo tags**: Tasks marked `[BACKEND]` execute in `vital-forge-v1/`. Tasks marked `[MOBILE]` execute in `vital-forge-mobile-v1/`.

---

## Phase 1: Setup

**Purpose**: Confirm both repos are on correct branches before any code changes.

- [X] T001 Confirm `vital-forge-v1` is on `development` branch and `vital-forge-mobile-v1` is on `004-start-workout` branch before starting any task

---

## Phase 2: Foundational — Backend Prerequisites

**Purpose**: All backend schema, model, seed, and API changes that MUST be complete before any mobile user story can be implemented or tested.

**⚠️ LEARNING CHECKPOINT on T002 and T003**: Walk through Rails migration generation, data migration pattern, and constraint strategy before executing. See plan.md "Step 1 & 2" notes.

**⚠️ CRITICAL**: No mobile US work can begin until T002–T013 are complete.

- [X] T002 [BACKEND] Generate and write Rails migration `CreateWorkoutTemplateDays` — table columns: `workout_template_id` (FK, not null), `day_number` (integer, not null), `name` (string, not null), `estimated_duration_minutes` (integer, nullable), `muscle_focus` (string, nullable), timestamps; add unique index on `(workout_template_id, day_number)` in `vital-forge-v1/db/migrate/TIMESTAMP_create_workout_template_days.rb`

- [X] T003 [BACKEND] Generate and write Rails migration `AddDayToWorkoutTemplateExercises` — three-step: (1) add `workout_template_day_id` as nullable FK, (2) data step: for each existing `WorkoutTemplate` create a `WorkoutTemplateDay` with `day_number: 1` and `name: "Day 1"` then update all its exercises to reference that day, (3) change column to `null: false`; in `vital-forge-v1/db/migrate/TIMESTAMP_add_day_to_workout_template_exercises.rb`

- [X] T004 [P] [BACKEND] Create `WorkoutTemplateDay` model with associations (`belongs_to :workout_template`, `has_many :workout_template_exercises, dependent: :destroy`), validations (presence of `workout_template_id`, `day_number`, `name`; numericality of `day_number` ≥ 1; uniqueness of `(workout_template_id, day_number)`); in `vital-forge-v1/app/models/workout_template_day.rb`

- [X] T005 [P] [BACKEND] Update `WorkoutTemplate` model — add `has_many :workout_template_days, -> { order(:day_number) }, dependent: :destroy`; in `vital-forge-v1/app/models/workout_template.rb`

- [X] T006 [P] [BACKEND] Update `WorkoutTemplateExercise` model — add `belongs_to :workout_template_day`; in `vital-forge-v1/app/models/workout_template_exercise.rb`

- [X] T007 [BACKEND] Write RSpec model spec for `WorkoutTemplateDay` — test validations (presence, numericality, uniqueness), association (`has_many :workout_template_exercises`), and that `day_number` must be a positive integer; in `vital-forge-v1/spec/models/workout_template_day_spec.rb`

- [X] T008 [BACKEND] Update `WorkoutTemplateStarter` service — accept `day_number:` keyword arg (default: 1), filter exercises via `template.workout_template_days.find_by!(day_number: @day_number).workout_template_exercises` instead of `template.workout_template_exercises`; in `vital-forge-v1/app/services/workout_template_starter.rb`

- [X] T009 [BACKEND] Update `WorkoutsController#start_from_template` — read `params[:day_number]` (default 1), pass it to `WorkoutTemplateStarter.new(user:, workout_template:, day_number:, scheduled_time:)`; in `vital-forge-v1/app/controllers/api/v1/workouts_controller.rb`

- [X] T010 [BACKEND] Update `WorkoutTemplatesController#show` — replace flat `exercises:` key with nested `days:` array; update `set_workout_template` includes to `includes(workout_template_days: { workout_template_exercises: :exercise })`; serialize as `{ id, day_number, name, estimated_duration_minutes, muscle_focus, exercises: [...] }`; in `vital-forge-v1/app/controllers/api/v1/workout_templates_controller.rb`

- [X] T011 [BACKEND] Re-seed all split templates in `vital-forge-v1/db/seeds.rb` — add any missing exercises to the catalogue (Romanian Deadlift, Leg Curl if absent), create `WorkoutTemplateDay` records for every day of every split template, reassign all `WorkoutTemplateExercise` records to correct days; use `find_or_create_by!` for idempotency; full day breakdown in `data-model.md`

- [X] T012 [BACKEND] Update `WorkoutTemplateStarterSpec` — add test: "creates workout exercises only for the specified day_number"; add test: "defaults to day 1 when day_number not provided"; add `it.todo` stub: "raises when day_number has no matching day record"; in `vital-forge-v1/spec/services/workout_template_starter_spec.rb`

- [X] T013 [P] [MOBILE] Update TypeScript types in `templatesApi.ts` — add `WorkoutTemplateDay` type (`id`, `day_number`, `name`, `estimated_duration_minutes | null`, `muscle_focus | null`, `exercises: TemplateExercise[]`); replace `WorkoutTemplateDetail.exercises` with `WorkoutTemplateDetail.days: WorkoutTemplateDay[]`; add `has_active_workout: boolean` and `active_workout_id: number | null` to both `WorkoutTemplate` and `WorkoutTemplateDetail` types; in `src/features/templates/templatesApi.ts`

- [X] T014 [MOBILE] Update `workoutsApi.ts` — fix `startWorkout` mutation: rename param to `{ templateId: number; day_number: number }`, change URL to `POST /api/v1/workout_templates/${templateId}/start`, body `{ day_number }`; fix `completeWorkout` mutation: change URL to `PATCH /api/v1/workouts/${workoutId}/complete`; add explicit `Workout` response type (`id`, `completed`, `started_at`, `workout_template_id`, `workout_exercises`); in `src/features/workouts/workoutsApi.ts`

**Checkpoint**: Run `rails db:migrate db:seed` and verify nested days appear in `GET /api/v1/workout_templates/:id` response. Run `tsc --noEmit` on mobile to verify types compile.

---

## Phase 3: US1 + US2 — Dashboard Next Day Card & Exercise Preview (Priority: P1) 🎯 MVP

**Goal**: Active Programme card on dashboard shows the next scheduled day label and navigates to an exercise preview screen displaying that day's exercises with planned sets.

**Independent Test**: With a user who has 1 completed workout on a 3-day programme — tap Active Programme card, verify "Day 2" is shown on the card, verify the preview screen lists only Day 2 exercises (not Day 1 or Day 3).

- [X] T015 [US1] [US2] Register `workout-preview` route in `app/_layout.tsx` — add `<Stack.Screen name="workout-preview" options={{ title: "Today's Workout", headerShown: true }} />` to the root Stack

- [X] T016 [US1] Update `app/home.tsx` — add `useGetTemplateQuery(preference?.selected_workout_template_id ?? 0, { skip: !preference?.selected_workout_template_id })` and `useGetWorkoutsQuery()` hooks; compute `completedCount` (filter workouts by `completed: true` and `workout_template_id`), `nextDay = (completedCount % daysPerWeek) + 1`, `nextDayName` from `template?.days?.find(d => d.day_number === nextDay)?.name`

- [X] T017 [US1] Update `app/home.tsx` Active Programme card — wrap in `Pressable` (when no active workout and template loaded); add "Next Up: Day N — DayName" label using `typography.caption` and `colors.electricBlue`; on press navigate `router.push({ pathname: '/workout-preview', params: { templateId, dayNumber: nextDay, dayName: nextDayName } })`; minimum touch target 44pt per Constitution VI

- [X] T018 [US2] Create `app/workout-preview.tsx` — screen shell: `Screen` wrapper, programme header `Card` (programme name, goal chip, experience chip, "Day N — DayName" label using `colors.electricBlue`), loading state (ActivityIndicator while template fetches), error state (error message + retry Button variant `secondary`)

- [X] T019 [US2] Add exercise `FlatList` to `app/workout-preview.tsx` — `data={currentDay?.exercises ?? []}`, `keyExtractor={item => item.id.toString()}`, inline `ExerciseRow` render: exercise name in `typography.subtitle`, muscle group chip (`colors.lightBlue` background, `colors.electricBlue` text, `radius.sm`), sets badge (`{recommended_sets} sets` in `typography.caption`); empty state message when `currentDay?.exercises.length === 0` per Constitution VII

- [X] T020 [P] [US1] Write `__tests__/home.test.tsx` updates — mock `useGetTemplateQuery` and `useGetWorkoutsQuery`; test: "shows 'Next Up: Day 2' when 1 workout completed on 3-day programme"; test: "Active Programme card is pressable when no active workout"; `it.todo`: "navigates to /workout-preview with correct dayNumber on card press"

- [X] T021 [P] [US2] Write `__tests__/workout-preview.test.tsx` — mock `useGetTemplateQuery`; test: "renders exercise list for the requested day"; test: "shows loading indicator while fetching"; test: "shows error state with retry button on fetch failure"; `it.todo`: "shows empty state when day has no exercises"

**Checkpoint**: Tap Active Programme card on dashboard — exercise preview screen loads showing Day N exercises with planned sets. Loading and error states render correctly.

---

## Phase 4: US3 — Start a Workout Session (Priority: P2)

**Goal**: "Start Workout" button on the preview screen creates a workout session for the correct day and navigates the user onward.

**Independent Test**: Tap "Start Workout" on Day 2 preview — verify a `POST /api/v1/workout_templates/:id/start` request is made with `day_number: 2`, button shows loading state during request, success navigates to home with confirmation.

- [X] T022 [US3] Add "Start Workout" `Button` (variant `primary`) to `app/workout-preview.tsx` — positioned at bottom of screen; disabled when `templateIsLoading` or `currentDay` is null

- [X] T023 [US3] Wire `useStartWorkoutMutation` in `app/workout-preview.tsx` — on press call `startWorkout({ templateId: Number(templateId), day_number: Number(dayNumber) })`; disable button and show `ActivityIndicator` in place of button text while in-flight (per FR-010)

- [X] T024 [US3] Handle `startWorkout` success in `app/workout-preview.tsx` — on success navigate to `/home` (Feature 005 placeholder); pass workout session id via params for future use; invalidate `Workouts` and `ActiveWorkout` RTK Query tags

- [X] T025 [US3] Handle `startWorkout` 409 conflict in `app/workout-preview.tsx` — detect `error?.status === 409`, show `Alert.alert` with title "Workout Already In Progress", message "You have an unfinished workout. Would you like to resume it?", buttons: "Resume" (navigates to `/home` with `active_workout_id`) and "Cancel"

- [X] T026 [US3] Handle `startWorkout` other errors in `app/workout-preview.tsx` — show `Alert.alert` with friendly message, single "Try Again" button; do not navigate away

- [X] T027 [US3] Update `__tests__/workout-preview.test.tsx` — mock `useStartWorkoutMutation`; test: "calls startWorkout with correct templateId and day_number on button press"; test: "button is disabled and shows loading during mutation"; `it.todo`: "navigates on success"; `it.todo`: "shows 409 alert with resume option"

**Checkpoint**: Tap "Start Workout" — network request fires with `day_number`, button disables during load, success navigates to home.

---

## Phase 5: US4 — Resume an In-Progress Workout (Priority: P2)

**Goal**: Dashboard detects an active (started, not completed) workout from the active template and shows a "Resume Workout" CTA instead of the start flow.

**Independent Test**: With an in-progress workout on the active template (`has_active_workout: true` from template response) — verify "Resume Workout" button appears on dashboard, Active Programme card is not tappable, tapping Resume navigates with the active workout ID.

- [X] T028 [US4] Update `app/home.tsx` — when `template?.has_active_workout` is true, render a "Resume Workout" `Button` (variant `primary`) below the Active Programme card; button title: "Resume Workout"

- [X] T029 [US4] Update `app/home.tsx` Resume CTA press handler — on press navigate to `/home` (Feature 005 placeholder) passing `template?.active_workout_id`; show as `router.push('/home')` until Feature 005 route exists

- [X] T030 [US4] Update `app/home.tsx` — when `template?.has_active_workout` is true, Active Programme card must NOT be wrapped in `Pressable` (remove navigation on press); resume flow takes full priority over start flow

- [X] T031 [US4] Update `__tests__/home.test.tsx` — mock `useGetTemplateQuery` returning `has_active_workout: true`; test: "shows Resume Workout button when active workout exists"; test: "Active Programme card is not pressable when active workout exists"; `it.todo`: "Resume button navigates with active_workout_id"

**Checkpoint**: With an in-progress workout — dashboard shows Resume CTA, card is not tappable.

---

## Phase 6: US5 — No Active Programme State (Priority: P3)

**Goal**: Users without a selected programme see the dashboard without a tappable card and cannot navigate to the exercise preview screen.

**Independent Test**: Load dashboard with a user whose `selected_workout_template_id` is null — verify the Active Programme card is absent or non-tappable, no navigation to workout-preview is possible.

- [X] T032 [US5] Update `app/home.tsx` — confirm `useGetTemplateQuery` is called with `skip: !preference?.selected_workout_template_id`; when preference has no `selected_workout_template_id`, Active Programme card renders in its existing static (non-Pressable) form with no "Next Up" label

- [X] T033 [US5] Update `__tests__/home.test.tsx` — mock `useGetPreferenceQuery` returning null `selected_workout_template_id`; test: "Active Programme card is not pressable when no programme selected"; `it.todo`: "shows onboarding prompt when no programme"

**Checkpoint**: No programme user sees static dashboard card, cannot navigate to workout preview.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T034 [P] Run `tsc --noEmit` in `vital-forge-mobile-v1/` — resolve any TypeScript errors from new types and refactored hooks; no implicit `any` per Constitution VIII

- [X] T035 [P] Run `npm run lint` in `vital-forge-mobile-v1/` — resolve any ESLint violations introduced by new files and changes

- [X] T036 Manual end-to-end verification: (1) fresh user with 0 completed workouts → Day 1 shown; (2) user with 3 completed workouts on 3-day programme → Day 1 shown (rollover); (3) in-progress workout → Resume CTA; (4) Start Workout on Day 2 → workout has only Day 2 exercises; (5) no programme → static card

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all mobile user stories**
  - T002 → T003 must be sequential (T003 data migration needs the days table from T002)
  - T004, T005, T006 can run in parallel after T002
  - T008 depends on T004, T005, T006
  - T010 depends on T008, T009
  - T013, T014 can run in parallel (different files, no interdependency)
- **Phase 3 (US1+US2)**: Depends on Phase 2 complete — especially T013 and T014
  - T015 (route registration) can run in parallel with T016 and T018
  - T018 (screen shell) must precede T019 (FlatList content)
  - T020, T021 (tests) can run in parallel with implementation
- **Phase 4 (US3)**: Depends on Phase 3 (preview screen must exist)
- **Phase 5 (US4)**: Depends on Phase 2 (template type must include `has_active_workout`); can run in parallel with Phase 4
- **Phase 6 (US5)**: Depends on Phase 3 (home.tsx must have the skip logic from T016)
- **Phase 7 (Polish)**: Depends on all phases complete

### User Story Dependencies

- **US1+US2 (Phase 3)**: Requires foundational backend + mobile types complete
- **US3 (Phase 4)**: Requires preview screen (US2) complete
- **US4 (Phase 5)**: Requires `has_active_workout` type from T013; independent of US3
- **US5 (Phase 6)**: Requires home.tsx template query from T016; independent of US3/US4

---

## Parallel Opportunities

```
# After T002 completes (days table exists):
T004 (WorkoutTemplateDay model)
T005 (update WorkoutTemplate model)
T006 (update WorkoutTemplateExercise model)

# After Phase 2 completes:
T015 (register route) — parallel with —
T016 (home.tsx hooks + day calculation) — parallel with —
T018 (workout-preview screen shell)

# Tests always parallel with implementation (different files):
T020 (home tests) || T021 (preview tests)
T034 (tsc) || T035 (lint)
```

---

## Implementation Strategy

### MVP Scope (US1 + US2 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Backend Prerequisites (T001–T014) — **do not skip, mobile cannot work without these**
3. Complete Phase 3: US1+US2 (T015–T021)
4. **STOP and VALIDATE**: Tapping the Active Programme card navigates to a working exercise preview screen showing the correct day's exercises
5. Demo / PR to development

### Incremental Delivery

1. Phase 2 complete → backend API works end-to-end (verifiable with Bruno/Postman)
2. Phase 3 complete → card + preview screen working (US1+US2 MVP)
3. Phase 4 complete → Start Workout functional (US3)
4. Phase 5 complete → Resume Workout functional (US4) — can run parallel with Phase 4
5. Phase 6 complete → No-programme guard (US5)
6. Phase 7 complete → lint/types clean, manual E2E verified

---

## Notes

- `[P]` = different files, no in-flight dependencies — safe to run in parallel
- `[BACKEND]` = changes in `vital-forge-v1/` repo
- `[MOBILE]` = changes in `vital-forge-mobile-v1/` repo
- Migration tasks (T002, T003) have explicit learning checkpoints — review Rails migration generation before executing
- Feature 005 placeholder: wherever plan says "navigate to active workout screen", use `router.push('/home')` until Feature 005 is built
- `it.todo` stubs follow constitution policy (~20% stubs with English hints)
- Total tasks: 36 | Backend: 11 | Mobile: 25
