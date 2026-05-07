# Tasks: User Registration

**Input**: Design documents from `specs/001-user-registration/`
**Branch**: `001-user-registration` | **Date**: 2026-02-06
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Implementation Summary

> **Scope note**: The vast majority of this feature is already implemented in `app/signup.tsx`.
> All 6 fields (FR-001), required validation (FR-002), phone stripping (FR-003), phone digit check (FR-004),
> password match check (FR-005), auto-auth on success (FR-006), and home redirect (FR-007) are complete.
>
> **Net code changes required: 2 targeted edits to `app/signup.tsx`**
> - T002: Add `KeyboardAvoidingView` + `ScrollView` (fixes FR-009, Principle VI violation)
> - T004: Fix `router.back()` → `router.push('/login')` (fixes FR-008, Principle III gap)

---

## Phase 1: Setup

**Purpose**: Confirm working state before making changes

- [x] T001 Confirm git is on branch `001-user-registration`; if not, run `git checkout 001-user-registration` from repo root `/Users/johnathonwood/dev/vital-forge-v1-combined-workspace/vital-forge-mobile-v1`

---

## Phase 2: Foundational (Already Complete)

**Purpose**: Core infrastructure blocking all user stories

**⚠️ Status: Complete — no tasks required**

The following are already in place:
- RTK Query `signup` mutation in `src/features/auth/authApi.ts` (POST `/api/v1/mobile/signup`)
- `baseQuery` attaches JWT from SecureStore in `src/lib/api/baseQuery.ts`
- Theme tokens in `src/theme/` (colors, spacing, radius, typography, shadows)
- UI primitives in `src/components/ui/` (Card, Button, TextField)
- All 6 form fields, state variables, and validation handlers in `app/signup.tsx`

**Checkpoint**: Foundation ready — proceed directly to User Story phases.

---

## Phase 3: User Story 1 — Successful Registration (Priority: P1) 🎯 MVP

**Goal**: A new user can fill all 6 fields with valid data, tap Sign Up, and land on the home screen already authenticated — no separate login step.

**Independent Test**: Launch app → navigate to `/signup` → fill valid data → tap Sign Up → verify home screen is shown and user is authenticated. (See `quickstart.md` scenario US1.)

### Implementation for User Story 1

- [x] T002 [US1] Wrap `app/signup.tsx` form content in `KeyboardAvoidingView` + `ScrollView` per research.md R-001 pattern:
  - Import `KeyboardAvoidingView`, `ScrollView`, `Platform` from `react-native`
  - Change `styles.gradient` to remove `justifyContent: 'center'` and `padding: spacing.md`
  - Nest inside `LinearGradient`: `<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: 'height' })}>`
  - Nest inside `KeyboardAvoidingView`: `<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">`
  - Add `styles.scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.md }` to `StyleSheet.create`
  - `Card` and all form content remains inside `ScrollView` unchanged

**Checkpoint**: Launch app on iPhone SE simulator → tap Confirm Password field → keyboard appears → Confirm Password field and Sign Up button are visible by scrolling. Registration completes successfully with valid data. ✅

---

## Phase 4: User Story 2 — Validation Prevents Bad Submissions (Priority: P2)

**Goal**: Inline field-level errors appear for password mismatch and invalid phone number; empty fields are caught before any network call.

**Independent Test**: Attempt 4 invalid submissions per `quickstart.md` scenarios US2a–US2d and confirm correct error behavior for each. (See `quickstart.md`.)

### Implementation for User Story 2

> **All validation logic is already implemented.** This phase verifies that the structural change in T002 (ScrollView wrapper) did not disrupt the error display positions.

- [x] T003 [US2] Verify validation behavior is intact in `app/signup.tsx` after T002:
  - Confirm `{phoneError ? <Text style={styles.phoneError}>{phoneError}</Text> : null}` still renders directly below the phone `TextField` inside the `ScrollView`/`Card`
  - Confirm `{confirmError ? <Text style={styles.phoneError}>{confirmError}</Text> : null}` still renders directly below the Confirm Password `TextField`
  - Confirm `styles.phoneError` margin values (`marginTop: -spacing.sm`, `marginBottom: spacing.sm`) still visually place error text correctly
  - No code change required unless visual inspection reveals layout regression

**Checkpoint**: Submit with password mismatch → error appears below Confirm Password. Submit with `555` as phone → error appears below phone field. Submit with empty Last Name → Alert fires. All per spec FR-004, FR-005, FR-002. ✅

---

## Phase 5: User Story 3 — Navigation to Login (Priority: P3)

**Goal**: A returning user on the registration screen can reach the login screen in one tap, regardless of navigation history.

**Independent Test**: Launch app directly to `/signup` (no prior navigation) → tap "Already have an account? Log in" → verify login screen is shown. (See `quickstart.md` scenario US3.)

### Implementation for User Story 3

- [x] T004 [US3] In `app/signup.tsx` line ~133, change `router.back()` to `router.push('/login')` on the "Already have an account? Log in" `Pressable`:
  - Before: `<Pressable onPress={() => router.back()} style={styles.linkTouch}>`
  - After: `<Pressable onPress={() => router.push('/login')} style={styles.linkTouch}>`
  - Rationale: `router.back()` fails if there is no navigation history (e.g. deep link directly to `/signup`); see research.md R-002

**Checkpoint**: Tap "Log in" link → reliably lands on login screen. ✅

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ensure code quality, constitution compliance, and readiness to merge.

- [x] T005 Run Expo lint on the modified file `app/signup.tsx` and fix any introduced errors: `npx expo lint app/signup.tsx` from repo root
- [ ] T006 Manual QA: Run all test scenarios in `specs/001-user-registration/quickstart.md` (US1, US2a–US2d, US3, AC-009 keyboard test, duplicate email edge case)
- [x] T007 Verify Constitution compliance post-implementation:
  - Principle I: No hardcoded hex values introduced ✅
  - Principle VI: `KeyboardAvoidingView` uses `Platform.select` (not raw `Platform.OS`) ✅
  - Principle III: `router.push('/login')` (not `router.back()`) ✅
- [ ] T008 Commit all changes on branch `001-user-registration` with a descriptive message, then open PR targeting `development`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Already complete — no blocking work
- **US1 (Phase 3)**: Depends only on Phase 1 — start after T001
- **US2 (Phase 4)**: Depends on T002 — verify after KeyboardAvoidingView is added
- **US3 (Phase 5)**: Depends on Phase 1; independent of T002 — can be done before or after T002
- **Polish (Phase 6)**: Depends on T002, T003, T004 all complete

### Task Dependency Graph

```
T001 (branch check)
  └── T002 [US1] Add KAV + ScrollView
        └── T003 [US2] Verify validation layout
              └── T005 Lint
  └── T004 [US3] Fix router.back()       ← independent of T002/T003
        └── T005 Lint
T005 ──────────────────────────────────── T006 QA → T007 Verify Constitution → T008 Commit + PR
```

### User Story Dependencies

- **US1 (P1)**: T002 only — independent of US2, US3
- **US2 (P2)**: T003 (verify after T002) — independent of US3
- **US3 (P3)**: T004 only — fully independent of US1, US2 (different line in same file)

### Parallel Opportunities

T002 and T004 both modify `app/signup.tsx`. They target different locations (structural wrapper vs. single `onPress` prop), so a single developer can batch them in one edit session — but they MUST NOT be sent to two different agents simultaneously (same file conflict).

---

## Parallel Example: US1 + US3

```
Single developer - do in one session:
  Edit 1: Add KAV + ScrollView wrapper in app/signup.tsx   [T002]
  Edit 2: Fix router.back() → router.push('/login')        [T004]
  
  Then sequentially:
  T003 (visual verify) → T005 (lint) → T006 (QA) → T007 (constitution check) → T008 (commit + PR)
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: T001 — confirm branch
2. Complete T002 — add `KeyboardAvoidingView` + `ScrollView`
3. **STOP and VALIDATE**: Launch app on iPhone SE simulator, complete a registration end-to-end
4. If passing: continue to Phase 4+

### Incremental Delivery (Full Feature)

1. T001 → T002 → T003: US1 + US2 complete and verified
2. T004: US3 complete and verified
3. T005 → T006 → T007 → T008: Polish, QA, PR open

---

## Task Count Summary

| Phase | Tasks | Story |
|---|---|---|
| Phase 1: Setup | 1 | — |
| Phase 2: Foundational | 0 | Already done |
| Phase 3: US1 (P1) | 1 | T002 |
| Phase 4: US2 (P2) | 1 | T003 |
| Phase 5: US3 (P3) | 1 | T004 |
| Phase 6: Polish | 4 | T005–T008 |
| **Total** | **8** | |

**Parallel opportunities**: T002 and T004 can be batched in one edit session (same file, different locations). All other tasks are sequential.

**Suggested MVP scope**: Complete T001 + T002 only → validate US1 → proceed.

---

## Notes

- No new files need to be created for this feature
- No new dependencies need to be installed
- The only source file modified is `app/signup.tsx`
- `src/features/auth/authApi.ts`, `src/lib/api/baseQuery.ts`, and all `src/theme/` and `src/components/ui/` files are untouched
- Commit after T002+T004 together; do not commit partial changes
