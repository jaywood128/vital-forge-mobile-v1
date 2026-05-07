# Feature Specification: View & Start Workout

**Feature Branch**: `004-start-workout`
**Created**: 2026-03-09
**Status**: Draft
**Input**: User description: "004 View & Start Workout Active Programme Card is tapable exercise preview screen with planned sets and CTA Start Workout"

---

## Clarifications

### Session 2026-03-09

- Q: Do programme days have human-readable names (e.g. "Push Day"), and if so where are they stored? → A: Option B — a separate `workout_template_days` table `(id, workout_template_id, day_number, name)`. Exercises in `workout_template_exercises` reference days via a `workout_template_day_id` foreign key instead of a raw `day_number` column.
- Q: What defines a "completed" workout for the purpose of advancing the day counter? → A: The user explicitly tapping "End Workout" (`completed: true` on the Workout record). No percentage threshold is enforced. A 65-70% soft warning prompt is a UX concern for Feature 005, not a gate here. Zero additional backend logic required.
- Q: Should `GET /api/v1/workout_templates/:id` return exercises nested under days or as a flat array with `day_number` per exercise? → A: Option A — nested. Response shape: `{ days: [{ day_number, name, exercises: [...] }] }`. Mirrors the `workout_template_days` data model directly; mobile renders without client-side grouping.
- Q: How should the dashboard detect an in-progress workout? → A: Option A — fetch `GET /api/v1/workouts` on every dashboard load and filter client-side for `completed: false` + `started_at` present. No new endpoint needed for MVP.
- Q: What happens to an in-progress workout when the user switches active programme? → A: Options A + B combined — if no in-progress workout, switch immediately; if one exists, show a warning ("You have an unfinished workout — switch anyway?") and allow the switch. Programme switching is out of scope for Feature 004 (no switching UI exists yet); this behaviour applies when that feature is built.

---

## Backend Prerequisites *(must be completed before mobile work begins)*

The current backend data model does not support day-based exercise grouping within a programme. Every template has a flat, unordered list of exercises — there is no concept of "Day 1 exercises" vs "Day 2 exercises". Additionally, the seed data only contains one day's exercises per split programme (e.g. Push Pull Legs only has Push Day exercises seeded; Pull Day and Legs Day are missing entirely).

This must be resolved before mobile development begins. The following backend changes are required:

### BP-001 — Create `workout_template_days` table and update `workout_template_exercises`

Introduce a new `workout_template_days` table that gives each training day within a programme a `day_number` and a human-readable `name`:

```
workout_template_days
  id                        integer, primary key
  workout_template_id       integer, FK → workout_templates, not null
  day_number                integer, not null (1 through days_per_week)
  name                      string, not null (e.g. "Push Day", "Pull Day", "Legs Day")
```

Update `workout_template_exercises` to reference `workout_template_days` via a `workout_template_day_id` foreign key, replacing any direct `day_number` coupling on the exercises table.

- Existing `workout_template_exercises` records: migrate to `day_number = 1` day records (created automatically during migration)
- Uniqueness: `(workout_template_id, day_number)` must be unique

**What this unlocks**: The API can return day name + exercises grouped cleanly; the mobile dashboard can display "Next Up: Day 2 — Pull Day" without any client-side label logic.

### BP-002 — Re-seed all split templates with correct per-day exercises

The following templates must have their exercises re-seeded with proper day assignments and complete exercise lists for every day:

| Template | Days | What needs seeding |
|---|---|---|
| Push Pull Legs | 6 | Day 1 Push (exists), Day 2 Pull (missing), Day 3 Legs (missing), repeat Days 4-6 |
| Upper/Lower Split | 4 | Day 1 Upper (exists), Day 2 Lower (missing), Days 3-4 repeat |
| Arnold Split | 6 | Day 1 Chest/Back (exists), Day 2 Shoulders/Arms (missing), Day 3 Legs (missing), repeat Days 4-6 |
| 5/3/1 Program | 4 | Day 1 Squat (exists), Day 2 Bench (missing), Day 3 Deadlift (missing), Day 4 Press (missing) |
| Bro Split | 5 | Day 1 Chest (exists), Day 2 Back (missing), Day 3 Shoulders (missing), Day 4 Arms (missing), Day 5 Legs (missing) |
| Full Body Workout | 3 | ✅ No change — same exercises every session is correct for full body |

New exercises will need to be added to the exercise catalogue to support the missing days (e.g. leg exercises for PPL, deadlift-day exercises for 5/3/1).

### BP-003 — Update `start_from_template` endpoint to accept `day_number`

`POST /api/v1/workout_templates/:id/start` must accept an optional `day_number` body parameter.

- If `day_number` is provided: create a workout using only exercises for that day
- If omitted: default to `day_number: 1` (backwards compatible)
- `WorkoutTemplateStarter` service must be updated to filter exercises by `day_number`

### BP-004 — Update template detail API response to nest exercises under days

`GET /api/v1/workout_templates/:id` must return exercises nested under their day, replacing the current flat `exercises` array:

```json
{
  "data": {
    "id": 1,
    "name": "Push Pull Legs",
    "goal_type": "physique",
    "difficulty_level": "Intermediate",
    "days_per_week": 6,
    "days": [
      {
        "day_number": 1,
        "name": "Push Day",
        "exercises": [
          {
            "id": 101,
            "order_position": 1,
            "recommended_sets": 4,
            "recommended_reps": "8-12",
            "rest_seconds": 90,
            "exercise": {
              "id": 5,
              "name": "Barbell Bench Press",
              "muscle_group": "Chest"
            }
          }
        ]
      },
      {
        "day_number": 2,
        "name": "Pull Day",
        "exercises": [ ... ]
      }
    ]
  }
}
```

The previous flat `exercises` key is removed. Any existing mobile code reading `template.exercises` must be updated to read `template.days[n].exercises`.

### BP-005 — Add RSpec tests for day-based behaviour

New tests required:
- `WorkoutTemplateExercise` model: validates `day_number` is present and within range
- `WorkoutTemplateStarter` service: when given a `day_number`, creates workout exercises only for that day
- `WorkoutsController#start_from_template`: passing `day_number` creates the correct exercises; omitting it defaults to day 1

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Dashboard Shows Next Scheduled Day (Priority: P1)

A logged-in user with an active programme sees the "Active Programme" card on their dashboard. The card shows which day is up next (e.g. "Next Up: Day 2 — Pull Day") based on how many sessions they have already completed from this programme. Tapping the card navigates them to the exercise preview screen for that specific day.

**Why this priority**: This is the entry point for the entire feature. It also delivers the day-rotation logic that makes the programme feel structured rather than repetitive.

**Independent Test**: Can be fully tested by varying a user's completed workout count and verifying the correct next day is shown on the dashboard card.

**Acceptance Scenarios**:

1. **Given** a user has completed 0 workouts from their programme, **When** they view the dashboard, **Then** the card shows "Day 1" as the next session.
2. **Given** a user has completed 3 workouts from a 3-day programme, **When** they view the dashboard, **Then** the card cycles back to "Day 1" (modulo rollover).
3. **Given** a user has completed 1 workout from a 3-day programme, **When** they view the dashboard, **Then** the card shows "Day 2" as the next session.
4. **Given** the Active Programme card shows the next day, **When** the user taps it, **Then** they are navigated to the exercise preview screen showing only that day's exercises.

---

### User Story 2 — Preview Today's Exercises (Priority: P1)

The exercise preview screen shows the user exactly what exercises they'll be doing in this session — the correct day's exercises from their programme, with planned sets and target muscle group for each.

**Why this priority**: Without the correct exercise list the feature has no fitness value. This screen is the moment where the user decides whether to start.

**Independent Test**: Can be tested by checking that the exercise list shown matches the template's exercises for the calculated day number — and differs from other days' exercise lists.

**Acceptance Scenarios**:

1. **Given** the exercise preview screen has loaded for Day 2, **When** the user views the list, **Then** they see only Day 2 exercises (not Day 1 or Day 3 exercises).
2. **Given** the exercise preview screen has loaded, **When** the user views each exercise row, **Then** they see: exercise name, target muscle group, and planned number of sets.
3. **Given** the exercise preview screen has loaded, **When** the user views the screen header, **Then** they see the programme name, the day label (e.g. "Day 2"), and the fitness goal.
4. **Given** the exercise list is loading, **When** the network request is in-flight, **Then** a loading indicator is shown.
5. **Given** the network request fails, **When** the exercise list cannot be fetched, **Then** an error message is shown with a retry option.

---

### User Story 3 — Start a Workout Session (Priority: P2)

From the exercise preview screen the user taps "Start Workout". The system creates a new workout session for the correct day's exercises and navigates the user to the active workout logging screen (Feature 005).

**Why this priority**: This is the transactional action — it turns the preview into a live session. Without it the preview is read-only.

**Independent Test**: Can be tested by tapping "Start Workout" and confirming the created workout contains only that day's exercises, then verifying navigation to the logging screen.

**Acceptance Scenarios**:

1. **Given** the user is on the exercise preview screen for Day 2, **When** they tap "Start Workout", **Then** a new workout session is created containing only Day 2 exercises.
2. **Given** the workout session is being created, **When** the request is in-flight, **Then** the "Start Workout" button is disabled and shows a loading indicator.
3. **Given** the workout session is created successfully, **When** the response is received, **Then** the user is navigated to the active workout logging screen (Feature 005) with the new session ID.
4. **Given** the session creation fails, **When** a server or network error occurs, **Then** an error message is shown and the user can retry without leaving the preview screen.

---

### User Story 4 — Resume an In-Progress Workout (Priority: P2)

A user who started a workout but did not complete it returns to the dashboard. The dashboard shows a "Resume Workout" CTA instead of the normal "start" flow, taking the user back into their active session.

**Why this priority**: The backend refuses to create a duplicate session (returns 409 with the existing session ID). The mobile app must handle this gracefully — showing a resume path rather than an error.

**Independent Test**: Can be tested by starting a workout, returning to dashboard, and confirming a "Resume Workout" CTA appears and navigates to the correct in-progress session.

**Acceptance Scenarios**:

1. **Given** a user has an in-progress workout (started, not completed), **When** they view the dashboard, **Then** a "Resume Workout" CTA is shown with the programme name.
2. **Given** the "Resume Workout" CTA is shown, **When** the user taps it, **Then** they are navigated to the active workout logging screen with the existing session ID.
3. **Given** a user has an in-progress workout, **When** they view the dashboard, **Then** the "Next Up: Day X" card does not offer the "start new session" flow — resuming takes priority.

---

### User Story 5 — No Active Programme (Priority: P3)

A user with no selected programme sees the dashboard without a tappable Active Programme card, with a prompt to complete onboarding.

**Why this priority**: Edge-case guard. Onboarding routes all new users to select a programme, so this state is uncommon in practice.

**Independent Test**: Can be tested by loading the dashboard for a user with no `selected_workout_template_id` in their preference record.

**Acceptance Scenarios**:

1. **Given** a user has no active programme, **When** they view the dashboard, **Then** the Active Programme card is either absent or non-tappable, with a prompt to complete setup.
2. **Given** the user has no active programme, **When** there is no exercise preview to show, **Then** the user cannot navigate to the exercise preview screen.

---

### Edge Cases

- **In-progress workout exists**: Dashboard shows "Resume Workout" CTA; starting a new session is blocked until the in-progress session is completed or abandoned (Feature 005 concern).
- **Day rollover**: After completing all days in the cycle the day counter rolls back to Day 1 automatically.
- **Template has zero exercises for a given day**: Show an empty state message rather than a blank list; do not allow "Start Workout" to be tapped.
- **Network drops mid-load**: Exercise list shows error state with retry; no partial data is shown.
- **Template no longer exists on server**: Show an error state on the exercise preview screen with guidance to contact support or re-select a programme.
- **Programme switching (future)**: Out of scope for Feature 004. When a programme-switching UI is built, if no in-progress workout exists switch immediately; if one exists warn the user first ("You have an unfinished workout — switch anyway?") and allow the switch regardless of their choice.

---

## Requirements *(mandatory)*

### Functional Requirements

**Backend (Prerequisites)**

- **FR-001**: The `workout_template_exercises` table MUST have a `day_number` column that assigns each exercise to a specific training day within the programme.
- **FR-002**: All split programme templates MUST have exercises seeded for every day of the programme (not just Day 1).
- **FR-003**: The `POST /api/v1/workout_templates/:id/start` endpoint MUST accept a `day_number` parameter and create a workout using only that day's exercises.
- **FR-004**: The `GET /api/v1/workout_templates/:id` endpoint MUST include `day_number` in each exercise entry in its response.

**Mobile**

- **FR-005**: The dashboard MUST calculate the user's next workout day by counting workouts where `completed: true` and `workout_template_id` matches the active template, modulo `days_per_week`. A workout is considered complete when the user explicitly taps "End Workout" — no minimum exercise completion percentage is enforced at this layer.
- **FR-006**: The Active Programme card MUST display the next day label (e.g. "Day 2") and be tappable to navigate to the exercise preview screen.
- **FR-007**: The exercise preview screen MUST display only the exercises assigned to the next calculated day — not all template exercises.
- **FR-008**: Each exercise row MUST display: exercise name, target muscle group, and planned number of sets.
- **FR-009**: The exercise preview screen MUST display a "Start Workout" button that sends the calculated `day_number` when creating the session.
- **FR-010**: The "Start Workout" button MUST be disabled and show a loading indicator while the session creation request is in-flight.
- **FR-011**: After successful session creation, the app MUST navigate to the active workout logging screen (Feature 005) passing the new session ID.
- **FR-012**: If the session creation returns a 409 (duplicate active session), the app MUST offer a "Resume Workout" path using the `active_workout_id` from the response.
- **FR-013**: On every dashboard load, the app MUST fetch the user's workout list and scan for a workout where `completed: false` and `started_at` is present and `workout_template_id` matches the active template. If found, show "Resume Workout" CTA in place of the normal start flow.
- **FR-014**: Error states (load failure, session creation failure) MUST display a user-friendly message with a retry option.

### Key Entities

- **Active Programme**: A structured fitness plan assigned to the user during onboarding. Has a name, fitness goal, experience level, and `days_per_week`. Exercises are now grouped by `day_number`.
- **Programme Day**: A logical grouping of exercises within a programme for a single training session. Identified by `day_number` (1 through `days_per_week`).
- **Programme Exercise**: A single exercise within a programme day. Includes exercise name, target muscle group, planned sets, recommended reps, and `day_number`.
- **Workout Session**: A time-bounded instance of performing one day's exercises. Created when the user taps "Start Workout" for a specific `day_number`. Carries a unique session ID used in Feature 005.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can navigate from the dashboard to the correct day's exercise preview in a single tap.
- **SC-002**: The exercise preview screen shows only the correct day's exercises — never exercises from other days.
- **SC-003**: The exercise preview screen loads within 2 seconds on a standard mobile data connection.
- **SC-004**: A user can initiate a workout session in 2 taps from the dashboard (tap card → tap "Start Workout").
- **SC-005**: The "Start Workout" flow completes (session created, user navigated) in under 3 seconds on a standard mobile data connection.
- **SC-006**: After completing all days in a cycle, the next suggested day correctly rolls back to Day 1 with no manual user action required.
- **SC-007**: 100% of users with an active programme can reach the exercise preview screen without encountering an unhandled error.

---

## Assumptions

- **Day calculation is client-side for MVP**: The mobile app counts completed workouts from the active template (`completed: true`) and computes `next_day = (count % days_per_week) + 1`. A dedicated backend endpoint for "next day" is not required for MVP.
- **Single active programme**: A user has at most one active programme at a time via their preference record.
- **Full Body templates unchanged**: Templates where the same exercises repeat every session (e.g. Full Body Workout) receive `day_number: 1` on all exercises — no behavioural change.
- **Session ID handoff**: Feature 005 (active workout logging) is assumed to accept a workout session ID as a navigation parameter. If not yet built, "Start Workout" navigates to a confirmation screen on the dashboard.
- **No abandon/delete session in this feature**: The ability to discard an in-progress session is out of scope here. Users can only resume or complete an in-progress session (Feature 005 concern).
- **Reps shown informatively**: Recommended reps (e.g. "8–12") are displayed on the preview screen but not editable until the logging screen (Feature 005).
- **Implementation note for migration**: When adding `day_number` to `workout_template_exercises`, slow down and review Rails migration generation, data migration strategy, and new RSpec tests before proceeding. This is a learning checkpoint.
