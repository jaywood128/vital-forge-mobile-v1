# Feature Specification: Workout History

**Feature Branch**: `007-workout-history`  
**Created**: 2026-05-14  
**Status**: Draft  
**Input**: User description: "Two screens — History List (/history) and Workout Detail (/workout-detail). Read-only view of completed workouts. Backend already exists."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Completed Workouts (Priority: P1)

A user who has finished one or more workouts opens the History screen from the home screen and sees a chronological list of their past sessions. Each card shows enough at a glance — date, workout name, exercise count, total sets — to orient them without opening the detail.

**Why this priority**: Without this screen users have no record of what they have done. It is the entry point for any feedback loop and the primary reason users return to the app.

**Independent Test**: Navigate home → tap "History" → verify a FlatList renders completed workout cards sorted newest first. Delivers standalone value even without the detail screen.

**Acceptance Scenarios**:

1. **Given** the user has completed workouts, **When** they tap "History" on the home screen, **Then** `/history` renders a FlatList of workout cards sorted by date descending.
2. **Given** the history list is visible, **When** a card renders, **Then** it displays: date formatted as "Thu, May 14", workout name, number of exercises, total sets logged.
3. **Given** the user has no completed workouts, **When** they open History, **Then** an empty-state message is shown ("No workouts yet. Start your first session!").
4. **Given** the API call is in-flight, **When** the screen mounts, **Then** a loading indicator is visible.
5. **Given** the API call fails, **When** the screen mounts, **Then** an error message is shown via `Alert.alert`.

---

### User Story 2 - View Workout Detail (Priority: P2)

A user taps a workout card in the history list and sees the full breakdown: every exercise, every set logged with weight × reps (or reps-only for bodyweight), and a green checkmark on each logged set.

**Why this priority**: The list gives context; the detail gives insight. Users need this to compare sessions and track progression over time.

**Independent Test**: Tap any card in the history list → verify the detail screen renders all exercises and sets for that workout. Delivers value independently of any editing capability.

**Acceptance Scenarios**:

1. **Given** the user taps a workout card, **When** navigation fires, **Then** `/workout-detail` renders with the correct workout's name, date, and total sets in the header.
2. **Given** the detail screen is visible, **When** exercises render, **Then** each exercise shows its name, a muscle-group chip styled with `electricBlueLight`, and all sets below it.
3. **Given** a set row renders for a weighted exercise, **When** displayed, **Then** it shows weight × reps (e.g., "185 × 8") with a success-green checkmark.
4. **Given** a set row renders for a bodyweight exercise (weight = 0 or null), **When** displayed, **Then** it shows reps only (e.g., "12 reps") with a success-green checkmark.
5. **Given** the detail screen is open, **When** the user taps Back, **Then** navigation returns to the History list without re-fetching.

---

### User Story 3 - Navigate Back from Detail (Priority: P3)

A user who has drilled into a workout detail can return to the history list with a single back action, preserving the scroll position of the list.

**Why this priority**: Standard navigation affordance — required for a polished feel but does not block the core data-viewing use case.

**Independent Test**: Open detail → tap back → verify list is still visible and scroll position is maintained (or at minimum the list re-renders without an additional network call).

**Acceptance Scenarios**:

1. **Given** the user is on `/workout-detail`, **When** they press the back button (hardware or header), **Then** they return to `/history`.
2. **Given** the user navigates back, **When** the history list re-appears, **Then** no additional API fetch is triggered (RTK Query cache is valid).

---

### Edge Cases

- What happens when a workout has 0 logged sets? Show the workout card in the list but display "0 sets" — do not hide it.
- What happens when a workout has exercises with no sets logged? Render the exercise header but show an empty sets area.
- How does the system handle very long workout names? Truncate to 1–2 lines with `numberOfLines` prop; never overflow card bounds.
- What happens if the workout-detail API call returns a 404 (workout deleted)? Show an inline error and a "Go back" button — do not crash.
- How does the system handle the list returning 100+ workouts? `FlatList` handles virtualisation natively; no additional work required per Constitution VII.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render a History screen at `/history` accessible via a "History" button on the home screen.
- **FR-002**: History screen MUST display completed workouts in a `FlatList`, sorted by `workout_date` descending.
- **FR-003**: Each history card MUST show: formatted date ("Thu, May 14"), workout name, exercise count, total sets logged.
- **FR-004**: Tapping a history card MUST navigate to `/workout-detail` passing the workout ID.
- **FR-005**: Workout Detail screen MUST display: workout name, date, total sets in the header; exercises with muscle-group chips; set rows with weight × reps or reps-only for bodyweight.
- **FR-006**: Logged set rows MUST display a success-green checkmark indicator.
- **FR-007**: Workout Detail MUST be read-only — no editing, no input fields.
- **FR-008**: Both screens MUST use the deep navy dark theme: `LinearGradient` background (`navyDeep → navyMid`), glass-morphism cards (`rgba(255,255,255,0.06)`), `electricBlueLight` accents, `pureWhite` text.
- **FR-009**: System MUST show a loading state while API calls are in-flight.
- **FR-010**: System MUST show an empty state on the History list when no completed workouts exist.
- **FR-011**: No backend changes are required — use existing `GET /api/v1/workouts` and `GET /api/v1/workouts/:id` via the existing `workoutsApi.ts` RTK Query slice.

### Key Entities

- **Workout (completed)**: A past workout session — `id`, `workout_date`, `name` (from template), `completed: true`, array of `workout_exercises`.
- **WorkoutExercise**: A single exercise within a workout — `id`, `exercise_name`, `muscle_group`, array of `exercise_sets`.
- **ExerciseSet**: A logged set — `id`, `set_number`, `weight` (nullable for bodyweight), `reps`, `completed: true`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with 10+ completed workouts can open History and see the full list rendered in under 1 second on a mid-range device.
- **SC-002**: Navigating from list to detail and back completes without a redundant network call (RTK Query cache hit on the return trip).
- **SC-003**: All set rows correctly distinguish weighted vs bodyweight display — zero false positives in manual testing across real API data.
- **SC-004**: Both screens pass ESLint with zero errors and TypeScript strict with zero `any` outside catch blocks.
- **SC-005**: The History entry point on the home screen is discoverable on first visit without any onboarding — label is self-explanatory.
