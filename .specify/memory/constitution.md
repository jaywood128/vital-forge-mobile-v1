<!--
Sync Impact Report
- Version change: (none) → 1.0.0 (initial ratification)
- Modified principles: N/A (initial fill from template)
- Added sections: Technology Stack, Development Workflow (replacing generic SECTION_2/SECTION_3)
- Removed sections: None
- Templates: ✅ .specify/templates/plan-template.md (Constitution Check already references constitution file); ✅ spec-template.md (no changes); ✅ tasks-template.md (no changes)
- Follow-up TODOs: None
-->

# Vital Forge Mobile Constitution

## Core Principles

### I. Design System (NON-NEGOTIABLE)

All colors MUST come from `src/theme/colors.ts`. No hardcoded hex values in screens or components. Use spacing, radius, typography, and shadow tokens from `src/theme/` for all layout values. Static styles in `StyleSheet.create`; inline styles only for truly dynamic (runtime-computed) values. There is no Tailwind and no CSS in this repo.

### II. Component Architecture

All reusable UI MUST live in `src/components/ui/` (Screen, Card, Button, TextField). New screens in `app/` MUST use these primitives before reaching for raw React Native components. Screens are layout/orchestration only — no business logic embedded in JSX. The `Button` component MUST use one of three variants: `primary` (orange), `secondary` (blue outline), `destructive` (red outline).

### III. Navigation — Expo Router Only

All routes are file-based in the `app/` directory. No manual navigator setup. Use `useRouter` from `expo-router` for programmatic navigation. Do not import React Navigation directly. The auth guard lives in `app/_layout.tsx`.

### IV. State Management — RTK Query + Redux

All server data MUST be fetched and cached via RTK Query slices in `src/features/<domain>/`. API slices MUST use the shared `src/lib/api/baseQuery.ts`, which attaches the JWT from SecureStore. Global client state (non-server) may use Redux slices in `src/store/`. Do not use local `useState` for server data — always RTK Query.

### V. Auth — JWT in SecureStore, No CSRF

The JWT MUST be stored in and read from `expo-secure-store` under the `authToken` key. Never store the auth token in AsyncStorage. `expo-secure-store` uses iOS Keychain and Android Keystore (hardware-backed encryption on supported devices). The mobile API base is `/api/v1/mobile/*`; do not call `/api/v1/` (web) endpoints. No CSRF header is needed; this is a JWT-authenticated client. On logout: call the logout endpoint, then call `SecureStore.deleteItemAsync('authToken')` regardless of API result.

### VI. Platform Behavior — Touch, Keyboard, iOS/Android

All interactive elements MUST have a minimum touch target of 44×44 pt (`spacing.touchMin = 44`). There are no `:hover` styles; use `Pressable`'s `pressed` state for visual feedback. Form screens MUST wrap content in `KeyboardAvoidingView` with `behavior="padding"` (iOS) or `"height"` (Android) via `Platform.select`. Use `Platform.select` for any iOS vs Android style or behavior divergence; do not use raw `Platform.OS` string checks outside of a `Platform.select` call.

### VII. Long Lists — FlatList Only

Never use `.map()` inside a `ScrollView` for variable-length data. Use `FlatList` (or `SectionList` for grouped data) for all lists that may exceed approximately 20 items.

### VIII. TypeScript — Strict

`strict: true` is enabled. No implicit `any`. The type `any` is permitted only in `catch (error: any)` error-handling blocks. API response types MUST be explicitly defined (see `authApi.ts` as the reference pattern).

**Type Primitives** — Never use the boxed object types `Number`, `String`, `Boolean`, `Symbol`, or `Object` as type annotations. Always use the lowercase primitives `number`, `string`, `boolean`, `symbol`. Use `object` (lowercase) or a specific interface instead of `Object`.

**`any`** — Do not use `any` as a type. Use `unknown` when the type is genuinely unknown and will not be interacted with directly. The only exception is `catch (e: any)` blocks.

**Callback return types** — Use `void` (not `any`) as the return type for callbacks whose return value is ignored. `void` prevents accidental use of the return value.

**Callback parameters** — Do not mark callback parameters as optional unless the callback truly may be called with fewer arguments. A callback that ignores a parameter is always valid; making the parameter optional changes the contract.

**Function overloads** — Order overloads from most specific to most general (specific first, general last) so TypeScript resolves the correct type. Prefer optional parameters over multiple overloads that differ only in trailing params. Prefer union types (`number | string`) over separate overloads that differ only in one argument's type.

**Generics** — Do not write a generic type that never uses its type parameter — it adds noise with no benefit.

## Technology Stack

- **Runtime**: React Native 0.81 via Expo SDK 54
- **Navigation**: Expo Router 6 (file-based)
- **State / data**: Redux Toolkit + RTK Query
- **Styling**: `StyleSheet.create` + `src/theme/` tokens
- **Gradients**: `expo-linear-gradient`
- **Token storage**: `expo-secure-store` (iOS Keychain / Android Keystore)
- **Language**: TypeScript 5.9 strict

## Development Workflow

Branch from `development`; merge to `development` via PR; `staging` is promoted from `development`; `main` is production-only. No hardcoded secrets or API URLs in source — use `EXPO_PUBLIC_*` env vars via `.env`. Run `npx expo start --clear` when changing native dependencies or after installing new packages. New native packages MUST be installed with `npx expo install <pkg>` (not bare `npm install`) to ensure SDK version compatibility.

## Testing Policy

Approximately 80% of tests for each feature MUST be fully implemented. The remaining ~20% MUST be left as scaffolded test stubs — a `it.todo` or `it` block with a descriptive English comment explaining exactly what the test should assert and why. Scaffolded stubs MUST:

- Be left on the most instructive cases: edge cases, async flows, error states, and any test that requires understanding a non-obvious pattern
- Include a comment written in plain English describing: (1) what scenario is being tested, (2) what the expected outcome is, and (3) any hint about the key assertion or mock needed

This is intentional — the incomplete tests are for the developer to learn by completing them. Never skip writing the stub entirely; a labelled, commented stub is required for every incomplete test.

## Governance

This constitution supersedes all other practices. When in conflict, the constitution wins. All PRs MUST verify compliance with Principles I–VIII. Amendments require: (1) documented rationale, (2) update to this constitution, (3) migration of existing code where applicable. The single source of truth for design tokens is `src/theme/`; any palette change starts there and propagates.

**Version**: 1.2.0 | **Ratified**: 2026-02-06 | **Last Amended**: 2026-05-15
