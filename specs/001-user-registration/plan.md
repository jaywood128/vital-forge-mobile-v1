# Implementation Plan: User Registration

**Branch**: `001-user-registration` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-user-registration/spec.md`

## Summary

Implement a 6-field registration screen (first name, last name, email, phone number, password, confirm password) with inline field-level validation, auto-login on success, and keyboard-accessible layout. The screen already exists in `app/signup.tsx` with most functionality in place. The two remaining gaps are: (1) missing `KeyboardAvoidingView` + `ScrollView` for keyboard accessibility (constitution violation, AC-009), and (2) the "Log in" link uses `router.back()` instead of reliably navigating to the login screen (AC-008).

## Technical Context

**Language/Version**: TypeScript 5.9 strict, React Native 0.81
**Primary Dependencies**: Expo SDK 54, Expo Router 6, Redux Toolkit + RTK Query, expo-secure-store, expo-linear-gradient, `src/components/ui/` primitives (Card, Button, TextField), `src/theme/` tokens
**Storage**: JWT in expo-secure-store (authToken key); user data persisted on Rails API backend
**Testing**: Manual QA on iOS Simulator and Android Emulator; Expo lint
**Target Platform**: iOS 15+, Android API 21+ (Expo managed workflow)
**Project Type**: mobile-app (Expo managed)
**Performance Goals**: Validation feedback immediate (no network call); registration round-trip under 2 seconds on standard device
**Constraints**: All 6 fields reachable with keyboard open on 4-inch screens; `KeyboardAvoidingView` required per Principle VI

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Design System | ✅ Pass | `app/signup.tsx` uses `src/theme/` tokens only; no hardcoded hex |
| II. Component Architecture | ✅ Pass | Uses Card, Button, TextField from `src/components/ui/` |
| III. Navigation | ⚠️ Gap | `router.back()` on login link — must be `router.push('/login')` (AC-008); to be fixed in T002 |
| IV. State Management | ✅ Pass | `useSignupMutation` via RTK Query; JWT stored, not in Redux |
| V. Auth | ✅ Pass | JWT in `expo-secure-store`; calls `/api/v1/mobile/signup` |
| VI. Platform Behavior | ❌ **Violation** | No `KeyboardAvoidingView` or `ScrollView` on 6-field form; fix required (AC-009, T001) |
| VII. Long Lists | ✅ N/A | No lists on this screen |
| VIII. TypeScript | ✅ Pass | Strict; `any` only in `catch (error: any)` |

**Gate decision**: Proceeding. Both gaps are addressed in implementation tasks T001 and T002. No unjustified violations remain.

## Project Structure

### Documentation (this feature)

```text
specs/001-user-registration/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── signup-api.md    # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (repository root)

```text
app/
└── signup.tsx           # Registration screen (primary file to modify)

src/
├── components/ui/
│   ├── TextField.tsx    # Input primitive (used by signup)
│   ├── Button.tsx       # Button primitive (used by signup)
│   ├── Card.tsx         # Card primitive (used by signup)
│   └── Screen.tsx       # Screen wrapper (available but not yet used on signup)
├── features/
│   └── auth/
│       └── authApi.ts   # signup RTK Query mutation
├── lib/
│   └── api/
│       └── baseQuery.ts # JWT attachment via SecureStore
└── theme/
    ├── colors.ts
    ├── spacing.ts
    ├── radius.ts
    ├── typography.ts
    └── shadows.ts
```

**Structure Decision**: Single mobile app. The registration feature is entirely within `app/signup.tsx`, backed by `src/features/auth/authApi.ts`. No new files need to be created; only `app/signup.tsx` requires modification.

## Complexity Tracking

> Principle VI violation (no KeyboardAvoidingView) is not a justified exception. It is a correctness gap in the existing screen that this feature must fix.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Principle VI: no `KeyboardAvoidingView` | Existing code was written before constitution | Must fix — no simpler alternative; this is the required approach |
