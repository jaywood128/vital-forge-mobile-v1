# Feature Specification: Optional Goal Selection

**Feature Branch**: `003-goal-selection`
**Created**: 2026-02-06
**Status**: Draft
**Input**: User description: "REQ-GOAL-001: Optional Goal Selection During Onboarding — goal selection screen after registration with four options (Build Muscle, Lose Fat, Get Stronger, General Fitness), Skip for now button with equal visual weight, no features locked by goal, goal changeable from profile settings."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New User Selects a Goal (Priority: P1)

A new user who just registered is presented with a goal selection screen. They choose a goal that matches their intent, the selection is saved, and they move on to the template list.

**Why this priority**: This is the primary purpose of the screen. Capturing the user's goal at the start enables personalised recommendations in future and ensures the feature delivers its core value on day one.

**Independent Test**: A new user can arrive at the goal selection screen, tap one of the four goal cards, and be taken to the template list with their goal recorded — this alone demonstrates the feature works end to end.

**Acceptance Scenarios**:

1. **Given** a user has just registered, **When** they arrive on the goal selection screen, **Then** exactly four goal options are displayed as tappable cards: "Build Muscle", "Lose Fat", "Get Stronger", and "General Fitness" — each with a title and a brief description.
2. **Given** a user is on the goal selection screen, **When** they tap a goal card, **Then** their selected goal is saved to their profile and they are advanced to the template list.
3. **Given** a user has selected a goal, **When** they are redirected to the template list, **Then** they have full access to all features with no restrictions regardless of which goal was selected.

---

### User Story 2 - New User Skips Goal Selection (Priority: P2)

A new user who is unsure of their goal, or who just wants to explore first, taps "Skip for now" and goes directly to the template list with no restrictions.

**Why this priority**: Forcing goal selection — even optionally — creates abandonment risk if the skip path is hard to find. The skip option must be as easy to use as selecting a goal, making the choice genuinely optional.

**Independent Test**: A new user can arrive at the goal selection screen, tap "Skip for now," and arrive at the template list with full feature access and no goal saved — this is a complete, independently testable path.

**Acceptance Scenarios**:

1. **Given** a user is on the goal selection screen, **When** they look at the screen, **Then** a "Skip for now" option is clearly visible with equal visual prominence to the four goal cards — it is not hidden, greyed out, or in small text.
2. **Given** a user is on the goal selection screen, **When** they tap "Skip for now", **Then** they are taken to the template list without a goal being saved to their profile.
3. **Given** a user skipped goal selection, **When** they browse the template list or start a workout, **Then** they have full access to all features — nothing is locked or restricted due to the absence of a goal.

---

### User Story 3 - User Changes Goal From Profile (Priority: P3)

A user who set (or skipped) a goal during onboarding can change it at any time from their profile settings.

**Why this priority**: Goals change over time. Locking a user to their initial choice (or non-choice) would frustrate long-term users. This is lower priority than initial onboarding because it can be deferred until profile settings are built.

**Independent Test**: A user can navigate to their profile settings, select a different goal (or set one for the first time if they skipped), and have the change take effect immediately with no disruption to existing data.

**Acceptance Scenarios**:

1. **Given** a user has already set a goal, **When** they navigate to profile settings and select a different goal, **Then** their goal is updated and the change takes effect immediately.
2. **Given** a user skipped goal selection during onboarding, **When** they navigate to profile settings, **Then** they can set a goal for the first time.
3. **Given** a user changes their goal, **When** the change is saved, **Then** no previously saved workouts, templates, or other data are altered or removed.

---

### Edge Cases

- What happens if a user taps a goal card, then uses the back button before the selection is confirmed — is the goal saved or discarded?
- What happens if a user taps "Skip for now" and later comes back to the goal selection screen via the back button — can they still select a goal?
- What happens if the goal selection screen fails to load — is the user stuck or automatically forwarded to the template list?
- What happens if a user selects a goal, then immediately changes it in profile settings — does the most recent selection win?

## Assumptions

- The goal selection screen is shown once during onboarding after registration; it is not shown again automatically.
- Goal selection is a standalone step, not part of a multi-step wizard that requires completion.
- There are exactly four goal options; no custom goal entry is required in this version.
- Goal data is stored on the user's profile and does not affect what content is visible or accessible in the MVP; it is retained for future personalisation.
- The template list is the destination screen after goal selection or skipping; that screen is implemented separately.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The goal selection screen MUST display exactly four goal options: "Build Muscle", "Lose Fat", "Get Stronger", and "General Fitness".
- **FR-002**: Each goal option MUST be presented as a tappable card displaying the goal name and a brief description of that goal.
- **FR-003**: A "Skip for now" option MUST be displayed on the screen with equal visual prominence to the four goal cards.
- **FR-004**: Tapping a goal card MUST save the selected goal to the user's profile and advance the user to the template list.
- **FR-005**: Tapping "Skip for now" MUST advance the user to the template list without saving a goal to their profile.
- **FR-006**: No features, content, or screens MUST be locked, restricted, or hidden based on whether the user has a goal set.
- **FR-007**: The user MUST be able to set or change their goal at any time from their profile settings.
- **FR-008**: Changing a goal MUST NOT alter, remove, or affect any other data in the user's account (workouts, templates, history).
- **FR-009**: The screen MUST include a back navigation option that returns the user to the previous screen.

### Key Entities

- **Fitness Goal**: Represents the user's self-reported primary fitness objective. One of four options: Build Muscle, Lose Fat, Get Stronger, General Fitness. Optional — a user's profile may have no goal set. Can be changed at any time. Stored on the user's profile.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can select a goal and reach the template list in under 30 seconds from arriving on the goal selection screen.
- **SC-002**: A user can skip goal selection and reach the template list in a single tap.
- **SC-003**: 100% of users who skip goal selection have full access to all features with no restrictions.
- **SC-004**: 100% of users who select a goal can change it from profile settings without any side effects on their existing data.
- **SC-005**: The "Skip for now" option is immediately visible to users on first view of the screen, without scrolling or searching.
