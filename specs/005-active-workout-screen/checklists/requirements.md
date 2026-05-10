# Requirements Checklist: Active Workout Screen

**Purpose**: Validate specification completeness and quality before proceeding to task generation
**Created**: 2026-05-08
**Feature**: [spec.md](./spec.md)

---

## Requirement Completeness

- [x] CHK001 Is the source of the "day label" (e.g. "Day 1 — Chest & Back") specified — derived from workout name, passed as a navigation param, or fetched from the API? [Gap, Spec §FR-001] — Resolved: `GET /api/v1/workouts/:id` does not return a day label. FR-001 updated to require a `dayName` navigation param passed from the workout preview screen.
- [x] CHK002 Is the display order of exercises defined (e.g. by `order_position`)? [Gap, Spec §FR-002] — Resolved: `Workout` model orders `workout_exercises` by `order_position` and `WorkoutExercise` orders `exercise_sets` by `set_number` at association level. No spec change needed.
- [x] CHK003 Are the initial field states for weight and reps defined — empty, zero, or placeholder text? [Gap, Spec §FR-003] — Resolved: `WorkoutTemplateStarter` creates sets with `weight: nil` (empty) and `reps` pre-filled from `recommended_reps`. Spec updated in FR-003.
- [x] CHK004 Are accessibility requirements specified for the numeric inputs and set row touch targets? [Gap] — Resolved: FR-004 updated to require numeric keyboard type on weight, reps, and RPE inputs. Screen reader labels deferred.
- [x] CHK005 Is the `kg` unit label required as a visible element on the set row, or only implied by the default? [Gap, Spec §FR-013] — Resolved: backend DB default is `lbs` (not `kg`). FR-013 corrected to `lbs` default; label MUST be displayed adjacent to the weight input. Plan mockups updated to match.
- [x] CHK006 Are requirements defined for the Resume Workout entry path — are navigation params and screen behaviour identical to the Start Workout path? [Gap, Spec §FR-011] — Resolved: behaviour confirmed identical (same workoutId nav param, same screen). US1 scenario 5 added covering the resume entry path.
- [x] CHK007 Is the behaviour defined when an exercise has zero planned sets, or when the workout has no exercises at all? [Gap, Edge Cases] — Accepted: gap acknowledged. Backend template data guarantees exercises and sets exist. No spec change required.

## Requirement Clarity

- [x] CHK008 Is the visual distinction between a logged and unlogged set row defined beyond "e.g."? The spec lists examples (background, checkmark) but does not commit to a testable requirement. [Clarity, Spec §FR-006] — Resolved: FR-006 updated to require `colors.success` green-tinted background and static text display in place of input fields.
- [x] CHK009 Is "always visible" for the Finish Workout button defined measurably — sticky footer position, z-index, or scroll behaviour? [Clarity, Spec §FR-008] — Resolved: FR-008 updated to require a sticky footer fixed at the bottom, visible at all scroll positions.
- [x] CHK010 Is the RPE range boundary behaviour specified — is 0 a valid input? Is 11 blocked? Are decimals permitted? [Clarity, Spec §FR-003] — Moot: RPE deferred to backlog. Removed from spec and plan entirely.
- [x] CHK011 Is "user-friendly" error messaging defined with specific copy or format guidelines, or left to implementation discretion? [Clarity, Spec §FR-012] — Resolved: FR-012 updated to require plain-English messages (no raw error codes) and a visible retry affordance. Exact copy left to implementer.
- [x] CHK012 Is "standard mobile data connection" quantified for the set save and finish workout performance targets? [Clarity, Spec §SC-002, §SC-003] — Resolved: qualifier removed. SC-002 and SC-003 targets stand on their own without network condition qualification.

## Requirement Consistency

- [x] CHK013 Does FR-004 ("enter or edit weight, reps, and RPE") conflict with the US2 acceptance scenario that marks logged set rows as read-only? Is re-editing a logged set intentionally allowed or intentionally blocked? [Consistency, Spec §FR-004 vs §US2] — Resolved: backend `ExerciseSetsController#update` has no guard on `completed: true`; re-editing is fully supported. Spec US2 updated with scenario 6; plan read-only references removed.
- [x] CHK014 Is the retry mechanism for a set save failure consistent with FR-007? If the Log button is disabled in-flight, does retry require the in-flight state to clear first, or is there a separate retry affordance? [Consistency, Spec §FR-007, §FR-012] — Resolved: FR-007 updated to clarify the Log button re-enables on both success and failure, serving as the retry. No separate retry element needed for set saves.
- [x] CHK015 Is the navigation target for "Finish Workout" success consistently referred to — "dashboard" and "home screen" are both used; are these the same destination? [Consistency, Spec §US3, §FR-010] — Resolved: same destination. Plan uses `router.replace('/home')`. Spec terminology normalised to "home screen".

## Acceptance Criteria Quality

- [x] CHK016 Is SC-001 testable as written — "can log weight and reps for every set without leaving the screen" does not specify how to verify "without leaving"? [Measurability, Spec §SC-001] — Accepted: intent is clear and covered by FR-002, FR-005, and user stories. No spec change required.
- [x] CHK017 Does SC-004 (resume mid-workout, previously logged sets visible) explicitly assign responsibility — is this guaranteed by the backend, the RTK Query cache, or both? [Completeness, Spec §SC-004] — Resolved: backend guarantees this. Sets are persisted server-side; `GET /api/v1/workouts/:id` always returns current set state. RTK Query is just the transport. SC-004 updated to reflect this.
- [x] CHK018 Are success criteria defined for the error recovery path — is there a measurable outcome for what "correct retry behaviour" looks like? [Gap] — Accepted: retry behaviour covered by US2 scenario 4, FR-007, and FR-012. A dedicated SC would be redundant.

## Scenario Coverage

- [x] CHK019 Is there an acceptance scenario covering the Resume Workout entry path (arriving from the dashboard "Resume" CTA rather than from the Start Workout flow)? [Gap, Spec §FR-011] — Resolved: covered by US1 scenario 5 added for CHK006.
- [x] CHK020 Is there an acceptance scenario for editing a set that was previously logged — or is re-editing explicitly out of scope? [Gap, Spec §FR-004] — Resolved: covered by US2 scenario 6 added when resolving CHK013.
- [x] CHK021 Are scenarios defined for the Finish Workout complete-failure case when all sets are logged (as opposed to the partial-sets failure case, which is covered)? [Gap, Spec §US3] — Accepted: the complete request either succeeds or fails regardless of set state. US3 scenario 4 covers failure in both cases — no branching behaviour to specify.

## Edge Case Coverage

- [x] CHK022 Is the behaviour defined when the workout fetch returns a workout already marked `completed: true`? [Gap] — Resolved: edge case added to spec — screen MUST redirect to home screen immediately if the fetched workout is already completed.
- [x] CHK023 Are concurrent logging attempts addressed — can a user rapidly tap Log on two different set rows simultaneously, and is the outcome specified? [Gap] — Accepted: RTK Query runs each mutation independently per set. FR-007 prevents double-tap on the same set. Two different sets saving simultaneously is correct behaviour, not a spec concern.
- [x] CHK024 Is the minimum valid weight value defined — is 0 kg a valid logged set, or should it be blocked like empty reps? [Gap, Spec §US2] — Resolved: backend model validates `weight >= 0, allow_nil` (0 kg valid) and `reps > 0` (0 reps blocked). Bodyweight exercises use nil weight.

## Inline Error Handling (Mandatory Focus)

- [x] CHK025 Is the distinction between a transient network error and a permanent server error (e.g. 422 vs 500) specified for set save failures — does the retry requirement apply equally to both? [Gap, Spec §FR-012] — Resolved: 422 risk eliminated by removing RPE (the only field with a range the user could violate). Mobile validates weight/reps presence before sending (FR-005). No spec change needed.
- [x] CHK026 Is the scope of "no global error state" defined — if two set rows fail simultaneously, are both inline errors independent and non-interfering? [Clarity, Spec §SC-005, Edge Cases] — Accepted: RTK Query mutation hooks are independent per set row. SC-005 covers this. Implementation guarantee, not a spec concern.
- [x] CHK027 Is the error state for load failure (full screen) specified as distinct from save failure (inline per-row) — is there a requirement that each error type is scoped correctly and never bleeds into the other? [Clarity, Spec §FR-012] — Resolved: FR-012 updated to explicitly scope each error type: load = full screen, save = inline per row (multiple independent errors allowed), complete = Alert.alert.
- [x] CHK028 Are preserved input values on save failure required to survive a screen scroll, or only for the immediate retry? [Gap, Spec §US2, Edge Cases] — Resolved: values MUST survive scroll. Edge case added to spec requiring input state held at screen level, not within the set row component.

## Non-Functional Requirements

- [x] CHK029 Are accessibility requirements defined for the set row inputs — keyboard type (numeric), minimum touch target size, and screen reader labels? [Gap] — Accepted: numeric keyboard covered by FR-004, touch targets by constitution (44pt). Screen reader labels deferred.
- [x] CHK030 Is the authentication failure scenario specified — if the JWT expires mid-workout, what does the user see and is the in-progress data preserved? [Gap] — Accepted: handled globally by baseQuery (401 response). Out of scope for this feature.
- [x] CHK031 Are there requirements for what happens on a slow network beyond the 2-second save target — is a timeout defined, and what is the user-facing behaviour when exceeded? [Gap, Spec §SC-002] — Resolved: SC-002 updated to require a 10s timeout after which the request is treated as a failure and the inline row error is shown.

## Dependencies & Assumptions

- [x] CHK032 Is the assumption "backend creates all exercise_sets when start_from_template is called" validated — is there a risk the set count could be zero or partial? [Assumption, Spec §Assumptions] — Accepted: trust backend data per CHK007 decision. WorkoutTemplateStarter wraps creation in a transaction so sets are all-or-nothing.
- [x] CHK033 Is the assumption "workout ID is always passed as a navigation param" resilient — what happens if the screen is deep-linked or the navigation param is missing? [Assumption, Spec §Assumptions] — Accepted: defensive nav guard is an implementation concern, not a spec requirement.
