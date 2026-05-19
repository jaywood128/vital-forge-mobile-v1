# Feature Specification: Personal Records + Exercise Progress Charts

**Feature Branch**: `011-personal-records-progress`
**Created**: 2026-05-19
**Status**: Draft

## Overview

Lifters log workouts but have no visibility into whether they are actually getting stronger. This feature delivers the complete progressive-overload feedback loop in two halves:

1. **Personal Records (PRs)** — detect and celebrate the moment a user surpasses their previous best on any exercise
2. **Exercise Progress Charts** — show the long-term strength and volume trajectory for any exercise

Both derive entirely from existing workout history. No backend changes, no new endpoints, no schema migrations required.

---

## User Scenarios & Testing

### User Story 1 - PR Celebration at the Moment It Happens (Priority: P1)

A lifter is mid-workout logging sets. They load the bar heavier than they ever have and complete their reps. The app instantly recognises this as a new personal record and celebrates the moment.

**Why this priority**: The PR moment is the single highest-emotional-payoff event in strength training. Without it, lifters get no real-time positive feedback from logging. All leading strength apps treat this as table-stakes.

**Independent Test**: Log a set heavier than any prior recorded set for an exercise → PR celebration fires. Log a lighter set → nothing fires.

**Acceptance Scenarios**:

1. **Given** a user has previously logged Bench Press at 135 lbs × 8 reps, **When** they log 145 lbs × 8 reps, **Then** a 🏆 badge appears on the completed set row, a toast banner slides in reading "New PR! Bench Press 1RM 171 → 184 lbs", and a success haptic fires.
2. **Given** a user logs the very first set ever for a new exercise, **When** the set is saved, **Then** no PR celebration fires (no prior history to beat).
3. **Given** a user logs 135 lbs × 10 reps after a previous best of 145 lbs × 3 reps (lower weight, more reps, higher estimated 1RM), **When** the set is saved, **Then** the PR celebration fires because the estimated strength output exceeds the prior best.
4. **Given** a user logs the same weight and reps as their previous best, **When** the set is saved, **Then** no PR celebration fires (must be strictly better, not equal).
5. **Given** a bodyweight exercise with no weight value, **When** a set is logged, **Then** no PR detection occurs.
6. **Given** a PR toast is already visible, **When** a second PR fires in the same session, **Then** the toast is replaced rather than stacked.

---

### User Story 2 - PR Badges Visible in Workout History (Priority: P1)

A lifter reviewing a past workout wants to see which sets were personal records at the time they were logged.

**Why this priority**: Ships alongside US1 at near-zero additional cost — same detection logic applied to the history view. Lets users browse their milestone moments.

**Independent Test**: Open a past workout that contains a known PR set → 🏆 badge appears on that set row and not on others.

**Acceptance Scenarios**:

1. **Given** a user opens a completed workout in history, **When** a set was an all-time PR for that exercise when it was logged, **Then** a 🏆 badge is displayed on that set row.
2. **Given** a user later logs a heavier set in a newer workout, **When** they revisit the older workout, **Then** the earlier set still shows its 🏆 badge (it was a PR when logged — historically accurate).

---

### User Story 3 - View Strength and Volume Progress for Any Exercise (Priority: P1)

A lifter wants to know if they are getting stronger on a specific exercise over time. They tap the exercise name in a past workout and see a chart of their progress.

**Why this priority**: Completes the feedback loop — PRs show breakthrough moments; the chart shows the trajectory between them. Together they answer "am I progressing?" definitively.

**Independent Test**: Open a past workout, tap an exercise name → progress screen opens with a chart showing data points from multiple previous sessions.

**Acceptance Scenarios**:

1. **Given** a user has logged Bench Press across multiple workouts, **When** they tap "Bench Press" in a workout detail view, **Then** a progress screen opens showing: a header card with current best weight × reps and estimated 1RM, a segmented control (Max Weight / 1RM / Volume), and a line chart for the selected metric over time.
2. **Given** the user selects "1RM" in the segmented control, **When** the chart updates, **Then** each data point represents the highest estimated 1RM produced in that session for this exercise.
3. **Given** the user selects "Max Weight", **When** the chart updates, **Then** each data point is the heaviest single-set weight lifted in that session.
4. **Given** the user selects "Volume", **When** the chart updates, **Then** each data point is the total weight moved in that session (sum of weight × reps across all completed sets for this exercise).
5. **Given** a user has only one completed session for this exercise, **When** the progress screen loads, **Then** a single data point is shown with a note encouraging them to log more sessions to see a trend.
6. **Given** a user taps a bodyweight exercise name, **When** the progress screen opens, **Then** an appropriate empty state is shown explaining that bodyweight exercise progress charts are coming in a future update.

---

### User Story 4 - Screen Visually Matches the Rest of the App (Priority: P2)

The new exercise progress screen must be visually consistent with all other screens.

**Why this priority**: Required quality bar per the project constitution — listed explicitly to ensure verification before merge.

**Acceptance Scenarios**:

1. **Given** the exercise progress screen is open, **When** compared to other screens, **Then** it uses the same Deep Navy gradient background, card surfaces, typography, spacing, and minimum touch target sizes as the rest of the app.

---

### Edge Cases

- What if the user edits a past set after the fact? PR status recomputes from current history — badge may shift to a different set.
- What if two sets in the same workout both produce new all-time estimated 1RMs? Each is evaluated independently against history up to and including itself — both may display the 🏆 badge.
- What if weight = 0 or reps = 0? Skip PR detection — estimated 1RM is meaningless at zero.
- What if the network fails during set logging? PR detection is gated on a successful save — no celebration fires on failure.

---

## Requirements

### Functional Requirements

- **FR-001**: The app MUST detect when a logged set represents the user's highest estimated strength output ever recorded for that exercise, using the Epley single-rep-max estimation formula (`weight × (1 + reps / 30)`).
- **FR-002**: The app MUST display a visual record indicator on any set row — in both the active workout screen and the workout history detail — that was a personal record when it was logged.
- **FR-003**: The app MUST show an in-session notification (banner + haptic) the moment a new personal record is detected during an active workout.
- **FR-004**: The in-session notification MUST auto-dismiss after 3 seconds and MUST NOT stack if multiple PRs fire in quick succession — the latest replaces any visible notification.
- **FR-005**: PR detection MUST be skipped for the first-ever logged set of an exercise (no prior data to compare against).
- **FR-006**: PR detection MUST be skipped for exercises where no weight value is recorded.
- **FR-007**: The app MUST allow a user to navigate from any exercise name in the workout history detail view to a per-exercise progress screen.
- **FR-008**: The exercise progress screen MUST display the user's current best weight, the reps achieved at that weight, and their all-time estimated maximum strength for that exercise.
- **FR-009**: The exercise progress screen MUST display a line chart of the user's selected metric over time, with one data point per completed session for that exercise.
- **FR-010**: The user MUST be able to switch between three chart metrics — estimated strength, heaviest weight, and total session volume — without leaving the screen.
- **FR-011**: All computations MUST be derived client-side from existing stored workout data — no new server endpoints or database tables are required.

### Key Entities

- **Personal Record (PR)**: A completed set whose estimated 1RM is strictly greater than all prior estimated 1RM values for the same exercise in the user's history. Derived, not stored.
- **Exercise Progress Series**: A time-ordered list of metric values (estimated 1RM, max weight, or session volume) per completed session for a given exercise. Derived from stored workout history.
- **Current Bests**: The user's all-time best weight (with reps at that weight) and all-time estimated 1RM for a specific exercise. Derived from stored workout history.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A user who logs a PR set sees the celebration within one second of the save completing.
- **SC-002**: The exercise progress screen is fully interactive within two seconds of tapping an exercise name, for a user with up to 50 completed workouts.
- **SC-003**: No new server endpoints are added and no database migrations are required to ship this feature.
- **SC-004**: All four user stories are verifiable on a physical iOS device prior to merge.
- **SC-005**: The core detection and charting calculations have at least 80% automated test coverage, with the remaining cases documented as labelled stubs per the project testing policy.
