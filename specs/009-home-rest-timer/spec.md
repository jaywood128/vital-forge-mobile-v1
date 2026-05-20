# Feature Spec: 009 — Home Screen Redesign + Rest Timer

## Overview

Two improvements shipped together. The home screen redesign makes the next workout the first thing a user sees and aligns the screen to the dark navy theme. The rest timer adds a countdown between sets during an active workout — one of the most requested features in fitness tracking apps.

---

## Part A: Home Screen Redesign

### Problem

The current home screen buries the workout CTA below a generic welcome card. The active programme card is white on a dark navy background. The preferences dump (goal, training days, experience) belongs in a settings screen, not the dashboard. Logout is a full-width destructive button despite being rarely tapped.

### User Stories

#### US1 — Workout CTA front and centre (P1)
As a user, when I open the app I want to see my next workout immediately so I know exactly what to do.

**Acceptance criteria:**
- Programme name and next day visible without scrolling
- Single full-width primary CTA — "Start Day X — {name}" or "Resume Workout"
- "In Progress" state visually distinct (orange label) from "Start" state (blue)

#### US2 — Contextual greeting with stats (P2)
As a user, I want a time-aware greeting and one useful stat so the screen feels alive.

**Acceptance criteria:**
- Time-of-day greeting: "Good morning / afternoon / evening, {first name}"
- One stat line: current streak if > 0, otherwise "X workouts this week"
- Greeting rendered directly on the dark background, not inside a card

#### US3 — Dark theme consistency (P2)
As a user, all cards should match the dark navy theme used throughout the app.

**Acceptance criteria:**
- Active programme card uses `variant="dark"` with `electricBlueLight` left border accent
- No white cards on dark background
- Chip styles use `rgba(74,144,217,0.2)` background with `electricBlueLight` text

#### US4 — Demoted utility actions (P3)
As a user, History and Logout should be accessible but not competing with the workout CTA.

**Acceptance criteria:**
- History is a small secondary text link with a clock icon, below the programme card
- Logout is a plain text link at the very bottom of the screen, no border or background
- Both remain fully functional

### Functional Requirements

- FR-001: Greeting uses time of day — before 12pm "Good morning", 12–5pm "Good afternoon", after 5pm "Good evening"
- FR-002: Stat line shows streak days if streak > 0, otherwise count of workouts completed this week
- FR-003: Active programme card is dark glass morphism with `electricBlueLight` left border (3px)
- FR-004: CTA is full-width `variant="primary"` Button — "Start Day X — {name}" or "Resume Workout"
- FR-005: Remove the raw preferences card entirely — goal, training days, experience, onboarding status do not belong on the dashboard
- FR-006: History rendered as a small pressable row with icon and label below the programme card
- FR-007: Logout is a plain `Text` pressable at the bottom, styled as a muted caption link

---

## Part B: Rest Timer

### Problem

After logging a set, users have no in-app way to track their rest period. They either rest too long (losing intensity) or too short (compromising performance). Every major fitness app (Strong, Hevy, FitBod) includes a rest timer for this reason.

### User Stories

#### US5 — Auto-start rest timer after logging a set (P1)
As a user, after I log a set I want a countdown timer to start automatically so I know when to start the next set.

**Acceptance criteria:**
- Timer starts automatically when a set is logged successfully
- Default rest duration comes from `rest_between_sets` on the workout exercise (already in the API response)
- Timer counts down from the configured duration to zero
- Timer is visible without scrolling — appears as an overlay or sticky element

#### US6 — Timer controls (P2)
As a user, I want to be able to skip or dismiss the timer if I'm ready early.

**Acceptance criteria:**
- Skip button dismisses the timer immediately
- Timer auto-dismisses at zero
- Starting a new set input while the timer is running dismisses it silently

#### US7 — Timer completion feedback (P2)
As a user, I want to know when rest is over even if I'm not looking at the screen.

**Acceptance criteria:**
- Haptic feedback fires when the timer reaches zero (`expo-haptics` already installed)
- Visual indicator changes at zero (e.g. flashes or changes colour briefly)

### Visual Design

The timer renders as a sticky bar sitting directly above the Finish Workout footer — it does not cover the set list so users can still see their logged values while resting.

```
┌─────────────────────────────────────┐
│  Rest  ━━━━━━━━━░░░░░░  1:12   Skip │
└─────────────────────────────────────┘
│          Finish Workout              │
└─────────────────────────────────────┘
```

- **Left**: "Rest" label in muted caption text
- **Centre**: Depleting progress bar — `electricBlueLight` transitioning to `brightRed` in the final 10 seconds
- **Right of bar**: Countdown in format `M:SS` (e.g. `1:30`, `0:45`)
- **Far right**: "Skip" tap target in muted caption text, minimum 44pt touch area
- Bar background matches the footer (`colors.pureWhite` with top border) so it feels like an extension of the footer
- Slides in from the bottom when a set is logged, dismisses downward at zero or on skip

### Functional Requirements

- FR-008: Default rest duration = `workout_exercise.rest_between_sets` (seconds); fallback to 90s if null
- FR-009: Timer state is local to the screen — not persisted, resets on screen unmount
- FR-010: Only one timer runs at a time — logging a second set while a timer is running restarts it from the new exercise's rest duration
- FR-011: Timer renders as a sticky bar above the Finish Workout footer, does not obscure the set list
- FR-012: Progress bar colour transitions from `electricBlueLight` to `brightRed` when ≤ 10 seconds remain
- FR-013: Uses `expo-haptics` `notificationAsync(NotificationFeedbackType.Success)` on completion
- FR-014: Skip button is accessible with `accessibilityLabel="Skip rest timer"`
- FR-015: Countdown format is `M:SS` — e.g. `1:30` not `90`

### Out of Scope

- Custom rest duration per set (future)
- Push notification when timer ends (background timer)
- Rest timer history or analytics
