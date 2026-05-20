# Tasks: 009 — Home Screen Redesign + Rest Timer

**Input**: `specs/009-home-rest-timer/spec.md`
**Branch**: `009-home-rest-timer` off `development`

---

## Phase 1: Setup

**Purpose**: Branch setup and restore stashed changes from previous session

- [ ] T001 Create branch `009-home-rest-timer` off `development`
- [ ] T002 Pop stash to restore `src/components/ui/Screen.tsx` (safe area insets), `src/components/ui/Card.tsx` (borderAccent prop), `src/components/ui/WorkoutHistoryCard.tsx` (green left border)

---

## Phase 2: Foundational

**Purpose**: Shared infrastructure needed by both parts of this feature

**⚠️ CRITICAL**: Complete before any user story work

- [ ] T003 Verify `src/components/ui/Screen.tsx` uses `useSafeAreaInsets` with `paddingTop: insets.top + spacing.md` (from stash)
- [ ] T004 Verify `src/components/ui/Card.tsx` has `borderAccent?: string` prop and applies `borderLeftWidth: 3` when set (from stash)

**Checkpoint**: Stash applied and verified — home and timer work can proceed in parallel

---

## Phase 3: US1 — Workout CTA Front and Centre (Priority: P1) 🎯 MVP

**Goal**: The next workout is the first thing a user sees when they open the app.

**Independent Test**: Open home screen — programme name, day name, and a single CTA button are visible without scrolling. Tapping CTA navigates to workout preview or active workout.

- [ ] T005 [US1] Remove welcome Card wrapper from `app/home.tsx` — replace with inline greeting text rendered directly on the dark background
- [ ] T006 [US1] Switch active programme card to `variant="dark"` with `borderAccent={colors.electricBlueLight}` in `app/home.tsx`
- [ ] T007 [US1] Update CTA button to full-width `variant="primary"` with label `"Start Day {N} — {name}"` or `"Resume Workout"` in `app/home.tsx`
- [ ] T008 [US1] Update chip styles in `app/home.tsx` to use `rgba(74,144,217,0.2)` background and `electricBlueLight` text (dark theme palette)

**Checkpoint**: Home screen shows dark programme card with CTA — no white cards on dark background

---

## Phase 4: US2 — Contextual Greeting with Stats (Priority: P2)

**Goal**: Greeting is time-aware and shows one useful stat below the user's name.

**Independent Test**: Open the app at different times of day — greeting reads "Good morning/afternoon/evening, {firstName}". Stat line shows streak days or weekly workout count.

- [ ] T009 [P] [US2] Add `getGreeting()` helper in `app/home.tsx` — returns "Good morning", "Good afternoon", or "Good evening" based on current hour (before 12 / 12–17 / after 17)
- [ ] T010 [P] [US2] Add `weeklyCount` derived value in `app/home.tsx` — count of workouts where `workout_date` falls within the current ISO week
- [ ] T011 [US2] Render greeting as large display text and stat line (streak if > 0, else "X workouts this week") directly on dark background in `app/home.tsx`

**Checkpoint**: Greeting and stat line visible above programme card with no card wrapper

---

## Phase 5: US3 — Dark Theme Consistency (Priority: P2)

**Goal**: Every element on the home screen is consistent with the dark navy theme.

**Independent Test**: Home screen has no white backgrounds. All text is white or rgba(255,255,255,x). Chips and labels use electricBlueLight.

- [ ] T012 [US3] Remove the raw preferences card (`prefsTitle`, `prefRow` etc.) from `app/home.tsx` — FR-005 specifies this data does not belong on the dashboard
- [ ] T013 [US3] Audit and update all remaining text colour values in `app/home.tsx` styles to use dark theme tokens (`colors.pureWhite`, `rgba(255,255,255,0.5)`, `colors.electricBlueLight`)

**Checkpoint**: Home screen is fully dark navy — no light theme remnants

---

## Phase 6: US4 — Demoted Utility Actions (Priority: P3)

**Goal**: History and Logout are accessible but visually subordinate to the workout CTA.

**Independent Test**: History and Logout are present and functional. Neither competes visually with the CTA button.

- [ ] T014 [US4] Replace History `Button` with a small pressable row (clock icon + "Workout History" label) below the programme card in `app/home.tsx`
- [ ] T015 [US4] Replace Logout `Button` with a plain `Text` pressable styled as a muted caption link at the bottom of the screen in `app/home.tsx`

**Checkpoint**: Home screen layout complete — CTA dominates, utilities are secondary

---

## Phase 7: US5 — Auto-Start Rest Timer After Logging a Set (Priority: P1) 🎯 MVP

**Goal**: A countdown bar appears above the footer immediately after a set is logged.

**Independent Test**: Log a set — a sticky bar appears above Finish Workout showing a countdown from `rest_between_sets` seconds (or 90s fallback). Bar depletes in real time.

- [ ] T016 [US5] Create `src/components/ui/RestTimer.tsx` — sticky bar component accepting props: `duration: number`, `onComplete: () => void`, `onSkip: () => void`
- [ ] T017 [US5] Implement countdown logic in `RestTimer.tsx` using `useEffect` + `setInterval`, counting down `remaining` seconds, calling `onComplete` at zero
- [ ] T018 [US5] Render depleting progress bar in `RestTimer.tsx` — `View` with `width` calculated as `(remaining / duration) * 100%`, colour `electricBlueLight`
- [ ] T019 [US5] Render `M:SS` formatted countdown and "Skip" pressable in `RestTimer.tsx`
- [ ] T020 [US5] Add `restTimer: { duration: number; isRunning: boolean } | null` state to `app/active-workout.tsx`
- [ ] T021 [US5] Trigger rest timer on successful set log in `app/active-workout.tsx` — read `rest_between_sets` from the parent `WorkoutExerciseDetail`, fallback 90s
- [ ] T022 [US5] Render `<RestTimer>` above the footer in `app/active-workout.tsx` when `restTimer !== null`
- [ ] T023 [US5] Export `RestTimer` from `src/components/ui/index.ts`

**Checkpoint**: Timer auto-starts after logging a set, counts down, disappears at zero

---

## Phase 8: US6 — Timer Controls (Priority: P2)

**Goal**: User can skip the timer; logging a new set while timer is running restarts it.

**Independent Test**: Tap Skip — timer dismisses immediately. Log a second set while timer is running — timer restarts from new duration.

- [ ] T024 [US6] Wire `onSkip` in `app/active-workout.tsx` to set `restTimer` to `null`
- [ ] T025 [US6] Wire `onComplete` in `app/active-workout.tsx` to set `restTimer` to `null`
- [ ] T026 [US6] When a new set is logged while `restTimer !== null`, restart with new exercise's `rest_between_sets` in `app/active-workout.tsx`

**Checkpoint**: Skip and auto-dismiss work correctly; restarting on new set works

---

## Phase 9: US7 — Timer Completion Feedback (Priority: P2)

**Goal**: User is notified when rest is over via haptics and a visual colour change.

**Independent Test**: Let timer reach zero — device vibrates. Progress bar turns red in the last 10 seconds.

- [ ] T027 [P] [US7] Add colour transition to progress bar in `src/components/ui/RestTimer.tsx` — `brightRed` when `remaining <= 10`, `electricBlueLight` otherwise
- [ ] T028 [P] [US7] Call `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` in `onComplete` handler inside `RestTimer.tsx`

**Checkpoint**: Full rest timer feature complete with haptic and visual feedback

---

## Phase 10: Polish & Tests

- [ ] T029 Update `__tests__/screens/home.test.tsx` — remove assertions for welcome Card and white programme card, add assertions for greeting text and dark CTA button
- [ ] T030 Add rest timer tests to `__tests__/screens/active-workout.test.tsx` — verify timer state is set after logSet succeeds, verify restTimer is null after skip
- [ ] T031 Run `npm run lint` and fix any warnings introduced in this feature
- [ ] T032 Run full test suite — `npx jest --no-coverage --forceExit` — all suites green

---

## Dependencies & Execution Order

- **Phase 1–2**: Must complete first — stash pop gates everything
- **Phase 3–6** (Home redesign): Sequential — US1 → US2 → US3 → US4
- **Phase 7–9** (Rest timer): Can run in parallel with home redesign phases after Phase 2
- **Phase 10**: After all phases complete

### Parallel Opportunities

- T009 and T010 (greeting helper + weekly count) can run in parallel — different logic blocks in same file
- T027 and T028 (colour transition + haptics) can run in parallel — independent additions to RestTimer

---

## Implementation Strategy

### MVP Scope

1. Phase 1–2: Setup
2. Phase 3: US1 — dark programme card + CTA (biggest visual win)
3. Phase 7: US5 — auto-start rest timer (most user value)
4. **Validate on device**, then continue with remaining phases

### Full Delivery Order

Phase 1 → 2 → 3 → 7 → 4 → 5 → 6 → 8 → 9 → 10
