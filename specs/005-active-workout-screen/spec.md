# Feature Specification: Active Workout Screen

**Feature Branch**: `005-active-workout-screen`
**Created**: 2026-05-07
**Status**: Draft
**Input**: User description: "Active workout screen where user can log sets in real time — weight, reps, and RPE per set. Reached by tapping Start Workout on the exercise preview screen."

---

## Clarifications

### Session 2026-05-07

- Q: Should the user be able to complete the workout from this screen? → A: Yes — a "Finish Workout" button ends the session. This calls `PATCH /api/v1/workouts/:id/complete` on the backend.
- Q: Should sets be marked complete individually, or just logged? → A: Logging weight/reps/RPE for a set implicitly marks it complete. No separate checkbox required for MVP.
- Q: Is a rest timer in scope? → A: No — out of scope for 005. Can be added in a future feature.
- Q: What happens if the user closes the app mid-workout? → A: The workout remains in-progress (`completed: false`, `started_at` present). The Resume Workout CTA on the dashboard (from 004 spec FR-013) reopens it. Full re-entry flow is covered by 004's resume path.

---

## Backend Prerequisites *(already complete — no new backend work required)*

The following backend capabilities are already built and available:

| Endpoint | Purpose |
|---|---|
| `PATCH /api/v1/exercise_sets/:id` | Log weight, reps, RPE, and mark a set complete |
| `PATCH /api/v1/workouts/:id/start` | Mark the workout as started (sets `started_at`) |
| `PATCH /api/v1/workouts/:id/complete` | Mark the workout as complete (sets `completed_at`, calculates duration) |
| `GET /api/v1/workouts/:id` | Fetch the full workout with exercises and sets |

No new API endpoints are required for this feature.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — See Today's Workout (Priority: P1)

After tapping "Start Workout" on the exercise preview screen, the user lands on the active workout screen showing all exercises for today's session with their planned sets ready to log.

**Why this priority**: This is the first thing the user sees — it must immediately orient them with the correct exercises and a clear path to start logging.

**Independent Test**: Navigate from the preview screen with a valid workout ID and confirm the correct exercises and empty set rows are shown.

**Acceptance Scenarios**:

1. **Given** the user tapped "Start Workout" on the preview screen, **When** the active workout screen loads, **Then** they see the programme name, day label (e.g. "Day 1 — Chest & Back"), and a list of all exercises for that session.
2. **Given** the workout screen has loaded, **When** the user views an exercise, **Then** they see the exercise name, muscle group, and one row per planned set showing set number, and empty fields for weight and reps.
3. **Given** the workout screen is loading, **When** the request is in-flight, **Then** a loading indicator is shown.
4. **Given** the network request fails, **When** the workout cannot be fetched, **Then** an error message is shown with a retry option.
5. **Given** the user arrives via the "Resume Workout" CTA on the home screen, **When** the active workout screen loads with the existing workout ID, **Then** the screen behaves identically to the Start Workout path — showing all exercises, previously logged sets with their saved values, and unlogged sets ready to fill in.

---

### User Story 2 — Log a Set (Priority: P1)

The user taps into a set row, enters their weight and reps, and saves it. The row updates to reflect the logged values.

**Why this priority**: This is the core action of the entire feature. Everything else supports this moment.

**Independent Test**: Tap a set row, enter values, save, and confirm the row displays the saved values and the backend `exercise_set` record is updated.

**Acceptance Scenarios**:

1. **Given** the user taps a set row, **When** the input fields appear, **Then** they can enter weight (numeric) and reps (numeric).
2. **Given** the user enters values and confirms, **When** the request to `PATCH /api/v1/exercise_sets/:id` completes successfully, **Then** the set row displays the saved weight and reps and is visually marked as logged.
3. **Given** the save request is in-flight, **When** the request has not yet resolved, **Then** the input is disabled and a saving indicator is shown.
4. **Given** the save request fails, **When** a server or network error occurs, **Then** an error message is shown and the previously entered values are preserved so the user can retry.
5. **Given** the user enters no weight or reps, **When** they attempt to save, **Then** the save is blocked and inline validation feedback is shown.
6. **Given** a set has already been logged, **When** the user taps the set row again, **Then** the input fields become active with the previously saved values pre-filled so the user can correct and re-save.

---

### User Story 3 — Finish the Workout (Priority: P2)

After logging their sets the user taps "Finish Workout". The session is marked complete on the backend and the user is returned to the home screen.

**Why this priority**: Without a finish action the workout remains permanently in-progress, blocking the user from ever starting a new session.

**Independent Test**: Tap "Finish Workout" and confirm the backend workout record has `completed: true` and `completed_at` set, and the user lands on the home screen.

**Acceptance Scenarios**:

1. **Given** the user taps "Finish Workout", **When** the confirmation is accepted, **Then** `PATCH /api/v1/workouts/:id/complete` is called and the user is navigated to the home screen.
2. **Given** the user taps "Finish Workout", **When** the request succeeds, **Then** the dashboard no longer shows a "Resume Workout" CTA.
3. **Given** the user taps "Finish Workout" before logging all sets, **When** they tap the button, **Then** a confirmation prompt asks "End workout early?" with Cancel and Finish options.
4. **Given** the complete request fails, **When** a server or network error occurs, **Then** an error message is shown and the user remains on the active workout screen.

---

### Edge Cases

- **User closes app mid-workout**: Session remains in-progress. Dashboard shows "Resume Workout" CTA (004 FR-013). Reopening navigates back to this screen with the same workout ID.
- **Workout already completed on load**: If `GET /api/v1/workouts/:id` returns a workout with `completed: true`, the screen MUST immediately redirect to the home screen without displaying the workout.
- **All sets already logged**: "Finish Workout" button is prominent; no confirmation prompt is shown (all sets done — no ambiguity).
- **Partial sets logged**: "Finish Workout" shows "End workout early?" confirmation before completing.
- **Network drops while logging**: Show error inline on the set row; values are preserved. No global error state — only the affected set row shows the failure.
- **Scroll away from a set row**: Entered weight and reps values MUST be preserved when the user scrolls a set row off screen and back. Input state MUST be held at the screen level, not within the set row component.
- **Weight unit**: Default to `lbs` (backend DB default). No unit switching in scope for MVP.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The active workout screen MUST display the programme name and day label (e.g. "Day 1 — Chest & Back") in the header. The day label is not returned by `GET /api/v1/workouts/:id` and MUST be passed as a navigation param (`dayName`) from the workout preview screen.
- **FR-002**: The screen MUST display all exercises for the session, each with its planned sets as individual loggable rows.
- **FR-003**: Each set row MUST display: set number, weight field (numeric, initially empty), and reps field (numeric, pre-filled with the template's recommended reps).
- **FR-004**: Tapping a set row MUST allow the user to enter weight and reps. Tapping a previously logged set row MUST pre-fill the inputs with the saved values so the user can correct and re-save. Weight and reps inputs MUST use a numeric keyboard type.
- **FR-005**: Saving a set MUST call `PATCH /api/v1/exercise_sets/:id` with `{ exercise_set: { weight, reps, completed: true } }`. RPE is deferred to a future feature.
- **FR-006**: A successfully saved set row MUST display a green-tinted background using `colors.success` and show the logged values as static text in place of the input fields.
- **FR-007**: The Log button MUST be disabled while a save request is in-flight for that set, and MUST re-enable on both success and failure. The re-enabled Log button serves as the retry mechanism — no separate retry element is required for set saves.
- **FR-008**: A "Finish Workout" button MUST be fixed in a sticky footer at the bottom of the screen, visible at all scroll positions.
- **FR-009**: Tapping "Finish Workout" when not all sets are logged MUST show a confirmation prompt before proceeding.
- **FR-010**: Confirming "Finish Workout" MUST call `PATCH /api/v1/workouts/:id/complete` and navigate the user to the dashboard on success.
- **FR-011**: The workout screen MUST be reachable both from "Start Workout" (new session) and "Resume Workout" (existing session ID).
- **FR-012**: Error states MUST display plain-English messages with no raw error codes or technical strings, and MUST always include a visible retry affordance. Error scope by type:
  - **Load failure**: Full-screen error with a retry button (nothing else to show).
  - **Set save failure**: Inline error on the affected set row only — other rows are unaffected. Multiple rows may show independent errors simultaneously if multiple saves fail.
  - **Complete failure**: `Alert.alert` dialog with a retry option — user remains on the active workout screen.
- **FR-013**: Weight MUST default to `lbs` unit (the backend database default). The `lbs` label MUST be displayed adjacent to the weight input field. No unit switching is required for MVP; the backend supports changing `weight_unit` per set via PATCH if a toggle is added in future.

### Key Entities

- **Active Workout**: The workout session record created in Feature 004. Identified by its `id`. Contains `workout_exercises`, each of which has `exercise_sets`.
- **Exercise Set**: A single set within an exercise. Updated via `PATCH /api/v1/exercise_sets/:id`. Fields: `weight`, `reps`, `completed`.
- **Workout Exercise**: Groups one exercise's sets within the session. Carries `order_position`, `exercise.name`, and `exercise.muscle_group`.

---

## Success Criteria *(mandatory)*

- **SC-001**: A user can log weight and reps for every set in a session without leaving the active workout screen.
- **SC-002**: Each set save round-trip completes in under 2 seconds. If no response is received within 10 seconds the request MUST be treated as a failure and the inline row error shown.
- **SC-003**: The "Finish Workout" action completes (backend confirmed, user on home screen) in under 3 seconds.
- **SC-004**: A user who closes and reopens the app mid-workout can resume and see their previously logged sets without re-entering them.
- **SC-005**: 100% of set save failures surface an inline error on the affected row without disrupting the rest of the screen.

---

## Backlog

Features explicitly out of scope for 005 but tracked for future prioritisation.

| Priority | Feature | Rationale |
|---|---|---|
| **P1** | Rest timer | Auto-starts between sets using `rest_seconds` from the template. Highly expected by gym-goers — rest timing is a core part of structured training and directly impacts workout quality. Most competing apps (Strong, Hevy) include this. High user value, low implementation complexity. |
| P2 | RPE logging | Rate of Perceived Exertion (1–10) per set. Backend already supports it (`rpe` field, `allow_nil`). Useful for intermediate-to-advanced athletes tracking effort. Deferred as most users won't need it for MVP. |
| P2 | Weight unit toggle (lbs / kg) | Relevant for international users. Backend supports `weight_unit` per set via PATCH. Straightforward to add once lbs baseline is established. |
| P2 | Add / remove sets | Lets users deviate from the template plan mid-session. Common request but adds UI complexity. |
| P3 | Exercise notes per set | Free-text notes on individual sets (e.g. "felt easy", "paused reps"). Useful for advanced users tracking technique. |
| P3 | Previous performance display | Show last session's logged weight/reps for the same exercise as a reference. High value for progressive overload but requires historical data querying. |

---

## Assumptions

- **Backend is complete**: All required endpoints (`PATCH /api/v1/exercise_sets/:id`, `PATCH /api/v1/workouts/:id/complete`, `GET /api/v1/workouts/:id`) are built and working. No backend work is needed for this feature.
- **Workout ID passed via navigation**: The workout preview screen passes the new session's `id` as a navigation param after calling `start_from_template`. The active workout screen fetches the full workout using `GET /api/v1/workouts/:id`.
- **Sets pre-created by backend**: When `start_from_template` creates a workout, it also creates the `workout_exercises` and `exercise_sets` records. The mobile screen only reads and updates — it does not create sets.
- **Weight unit is lbs for MVP**: The backend defaults to `lbs`. No unit toggle in scope for MVP. The backend supports `weight_unit` per set via PATCH, enabling a future toggle feature.
- **No rest timer in scope**: Timer between sets is a future enhancement. See Backlog.
- **No set deletion in scope**: Users cannot add or remove sets from the planned count. Editing planned sets is a future feature.
