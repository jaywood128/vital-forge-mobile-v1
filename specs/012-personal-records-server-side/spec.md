# Feature Spec: 012 — Personal Records (Server-Side)

**Branch**: `012-personal-records-server-side` | **Date**: 2026-05-31  
**Priority**: High  

## Overview

Move personal record detection from client-side computation to a server-side `personal_records` table. PRs are written to the DB when a workout is completed, exposed via `GET /api/v1/personal_records`, and surfaced in the UI via a post-workout celebration modal and trophy badges in workout history.

The client-side PR detection introduced in 011 (scanning `allWorkouts` to find best 1RM) was always a stopgap — correct at small scale but incompatible with pagination. This branch makes the PR table the authoritative source of truth.

---

## User Stories

### US1 — PR recorded on workout completion (P1)

**As a** user who completes a workout,  
**I want** my personal records to be automatically detected and stored,  
**So that** my progress is tracked accurately over time.

**Acceptance criteria:**
- On `PATCH /api/v1/workouts/:id/complete`, the backend identifies the best completed weighted set per exercise
- A `PersonalRecord` row is created for any exercise where the estimated 1RM beats the user's stored best
- PRs are compared using the Epley formula: `weight × (1 + reps/30)`
- Only completed sets with weight > 0 and reps > 0 qualify
- The response includes a `new_personal_records` array with: `exercise_name`, `weight`, `reps`, `estimated_1rm`, `previous_best`

### US2 — Post-workout PR celebration modal (P1)

**As a** user who just set a personal record,  
**I want** to see a celebration summary after finishing my workout,  
**So that** I feel acknowledged and motivated to return.

**Acceptance criteria:**
- If `new_personal_records` is non-empty, a `PRSummaryModal` appears before navigating home
- Modal shows: "You crushed it." heading, PR count, streak pill, animated confetti dots
- Each PR card shows: exercise name, weight × reps, estimated 1RM (right-aligned), delta from previous best or "First PR"
- "Done — keep it up!" button navigates home
- If no new PRs: navigates straight home with no modal
- Haptic feedback fires on modal appearance

### US3 — PR badges in workout history (P1)

**As a** user reviewing past workouts,  
**I want** to see which sets were personal records,  
**So that** I can see my best performances in context.

**Acceptance criteria:**
- `GET /api/v1/personal_records` returns all PRs for the current user
- Optional `?exercise_id=` filter supported
- `workout-detail` history screen shows 🏆 badge on PR sets using `exercise_set_id` lookup
- Only completed sets shown in workout history (incomplete sets filtered out)

### US4 — Real-time PR badge during workout (P2)

**As a** user logging sets during a workout,  
**I want** to see a badge when I beat my existing PR,  
**So that** I get immediate feedback on exceptional performance.

**Acceptance criteria:**
- Badge appears only on the best set per exercise in the current session that beats a stored PR
- Badge does NOT appear for first-ever sets (no stored PR to beat) — celebration deferred to modal
- Badge moves to a heavier set if logged later in the same session
- Badges survive navigating away from and resuming the workout
- PR toast fires once when a set becomes the session best AND beats stored record

---

## Architecture Decisions

### Server-side PR table vs. client-side detection
Client-side detection (011) works at small scale but breaks with pagination. The `personal_records` table is pagination-safe — queried independently of workout history volume. See BACKLOG.md for full ADR.

### Epley 1RM formula
`weight × (1 + reps/30)`, special-cased at `reps === 1` to return `weight` directly. Used consistently across both backend (`lib/epley1_rm.rb`) and frontend (`src/lib/stats/exerciseHistory.ts`).

### PR badge during workout: stored PRs only
Real-time badges compare against `personal_records` table (past completed workouts only). First-ever sets get no badge — they appear as "First PR" in the post-workout modal. This prevents overwhelming new users with badges on every set.

### Post-workout modal: race condition fix
The RTK Query optimistic update for `getWorkout` was removed from `completeWorkout.onQueryStarted` — it was firing the `workout.completed` redirect `useEffect` before `doComplete` could show the modal. The list cache is still optimistically updated for the home screen.

---

## Open Questions / Known Limitations

- **No historical backfill**: PRs are only recorded going forward from when this feature deployed. Users with prior workout history start with an empty `personal_records` table — their first workout under the new system sets the baseline.
- **High-rep 1RM accuracy**: Epley formula is less accurate above ~10 reps. No rep cap is enforced (intentional — typical strength training is 1–12 reps).
