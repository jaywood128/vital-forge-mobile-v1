# Feature Specification: Pre-Registration Onboarding

**Feature Branch**: `003-goal-selection`
**Created**: 2026-02-24
**Status**: Draft

## Overview

Before creating an account, a user browses real workout programs filtered to their goal and schedule. By the time the registration form appears, they have already chosen their program — making sign-up feel like a natural next step rather than a gate. The flow is six screens:

1. **Landing** — value proposition, single CTA
2. **Goal Type** — Physique & Aesthetics or Strength & Power
3. **Training Days** — how many days per week they can train (3–6)
4. **Template List** — filtered programs matching their selections
5. **Template Preview** — full exercise detail, "Start This Program" CTA
6. **Registration Form** — account creation, which hands off to `002-post-reg-flow`

No account or login is required for screens 1–5.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse Without an Account (Priority: P1)

A visitor opens the app and can browse and preview real workout programs — without creating an account or being prompted to log in.

**Why this priority**: Showing value before asking for commitment is the single highest-leverage step in the onboarding funnel. A user who has seen their program before registering has a reason to create an account.

**Independent Test**: A new visitor opens the app, picks a goal type and training days, sees a filtered program list, opens a program detail, and reads the full exercise breakdown — all without a login prompt.

**Acceptance Scenarios**:

1. **Given** a visitor opens the app, **When** they tap "Find Your Program", **Then** the Goal Type screen appears with no login prompt.
2. **Given** a visitor completes goal and day selection, **When** the Template List loads, **Then** it shows programs filtered to their selections — without requiring an account.
3. **Given** a visitor taps a program, **When** the Template Preview loads, **Then** they see the complete exercise list — including sets, reps, rest time, and notes — without logging in.

---

### User Story 2 — Filter to a Matching Program (Priority: P1)

A visitor selects their goal type, then how many days per week they can train. The app responds immediately by showing only programs that match both selections.

**Why this priority**: The filter steps are the core of the onboarding. If results don't match the user's actual schedule and goal, they'll pick the wrong program or drop off.

**Acceptance Scenarios**:

1. **Given** a visitor selects "Physique & Aesthetics" and "4 days", **When** the Template List renders, **Then** only templates with `goal_type: physique` and `days_per_week: 4` are shown.
2. **Given** a visitor also selects "Intermediate" as an optional difficulty filter, **When** the Template List updates, **Then** only templates matching all three criteria are shown.
3. **Given** no templates match the current filters, **When** the Template List renders, **Then** an empty state with a "Try different filters" prompt is shown — not a blank screen or error.
4. **Given** a visitor wants to change their goal type after reaching the Template List, **When** they navigate back, **Then** they can update their selection and the list re-filters without a full reload.

---

### User Story 3 — Preview Full Program Detail (Priority: P1)

A visitor taps a program in the list and sees everything they need to decide if it is right for them — program overview, number of weeks, session duration estimate, and every exercise with its full detail.

**Why this priority**: A shallow preview that hides exercise detail creates doubt. Users need enough information to feel confident before they create an account.

**Acceptance Scenarios**:

1. **Given** a visitor taps a program, **When** the Template Preview screen loads, **Then** they see: program name, goal type label, difficulty badge, days per week, estimated session duration, and total exercise count.
2. **Given** the Template Preview is showing, **When** the visitor scrolls through the exercise list, **Then** each exercise shows: name, muscle group, equipment needed, recommended sets, recommended reps, rest time, and any coach notes.
3. **Given** the Template Preview is showing, **When** the visitor taps "Start This Program", **Then** they are taken to the Registration Form — and the selected template ID, goal type, training days, and difficulty (if set) are all preserved in app state.

---

### User Story 4 — Registration Carries Selections Forward (Priority: P1)

When a visitor reaches the Registration Form by tapping "Start This Program", all of the selections they made during browsing are held in app state and passed to `002-post-reg-flow` after registration succeeds.

**Why this priority**: If the selections are lost at registration, the user lands on a blank dashboard — undoing every positive moment in the onboarding flow.

**Acceptance Scenarios**:

1. **Given** a visitor selected "Strength", "5 days", "Advanced", and the "5/3/1 Program", **When** registration completes, **Then** the post-registration flow receives all four values to save automatically.
2. **Given** a visitor is on the Registration Form, **When** they background the app and return, **Then** their goal, days, difficulty, and selected template are still held in app state.
3. **Given** a visitor navigates back from the Registration Form to change their program, **When** they select a different template and tap "Start This Program" again, **Then** the newly selected template replaces the previous one in app state.

---

### Edge Cases

- If the `GET /api/v1/workout_templates` call fails, the Template List shows an error message with a "Try Again" button — not a blank screen.
- If the `GET /api/v1/workout_templates/:id` call fails, the Template Preview shows an error with a back button — not a crash.
- If a visitor selects filters with no matching templates, the empty state is clear and actionable.
- If a visitor navigates back through the filter steps, their previous selections are pre-filled.

## Assumptions

- All template endpoints are public — no authentication required for screens 1–5.
- Templates are fetched in a single `GET /api/v1/workout_templates` call. All filtering is done client-side using `goal_type`, `days_per_week`, and `difficulty_level`.
- Goal type (required) and training days (required) must both be set before showing the Template List. Difficulty is optional.
- Currently two goal types exist: Physique & Aesthetics (`physique`) and Strength & Power (`strength`). More will be added in future.
- Training days options are 3, 4, 5, and 6. Values outside this range are not supported by the API.
- Onboarding state (selections + chosen template) lives in a Redux slice and is cleared after registration completes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Visitors MUST be able to reach the Template List and Template Preview without an account or any login prompt.
- **FR-002**: The Goal Type screen MUST present exactly two options: Physique & Aesthetics and Strength & Power.
- **FR-003**: The Training Days screen MUST present exactly four options: 3, 4, 5, and 6 days per week.
- **FR-004**: The difficulty filter MUST be optional. Visitors who skip it MUST see all difficulty levels matching their goal and day selection.
- **FR-005**: All workout templates MUST be fetched in a single API call (`GET /api/v1/workout_templates`). Filtering MUST be applied client-side.
- **FR-006**: The Template List MUST show only programs matching all active filters.
- **FR-007**: If no templates match the active filters, an empty state with guidance to adjust filters MUST be shown.
- **FR-008**: The Template Preview MUST show: program name, goal type, difficulty, days per week, estimated session duration, total exercises, and the full exercise list with sets, reps, rest time, and notes per exercise.
- **FR-009**: The Template Preview MUST include a "Start This Program" button.
- **FR-010**: Tapping "Start This Program" MUST navigate to the Registration Form and preserve `goal_type`, `training_days_per_week`, `experience_level` (if set), and `selected_template_id` in app state.
- **FR-011**: Navigating back through filter steps MUST preserve previously selected values.
- **FR-012**: Onboarding state MUST persist if the user backgrounds the app mid-flow and returns.

### Key Entities

- **Workout Template** (from API): `id`, `name`, `description`, `goal_type`, `difficulty_level`, `days_per_week`, `estimated_duration_minutes`, `total_exercises`, `source`
- **Template Exercise** (from API): `order_position`, `recommended_sets`, `recommended_reps`, `rest_seconds`, `notes`, nested `exercise` with `name`, `muscle_group`, `equipment`, `exercise_type`, `instructions`
- **Onboarding State** (Redux slice): `goal_type`, `training_days_per_week`, `experience_level` (nullable), `selected_template_id` (nullable). Cleared after registration succeeds.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can reach the Template List in exactly 3 taps from the landing screen (Goal Type → Training Days → List).
- **SC-002**: The Template List renders filtered results within 2 seconds of the visitor completing filter selection.
- **SC-003**: 100% of "Start This Program" taps carry all active filter selections and the selected template ID into the Registration Form screen.
- **SC-004**: 0% of filter combinations result in a blank or broken screen — an empty state is always shown when no results match.
- **SC-005**: A visitor can read the full exercise detail for any program without an account.
