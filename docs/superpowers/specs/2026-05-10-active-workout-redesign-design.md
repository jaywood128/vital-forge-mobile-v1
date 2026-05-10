# Design: Active Workout Screen — Deep Navy Redesign

**Date:** 2026-05-10
**Branch:** 005-active-workout-screen
**Scope:** Active workout screen only. Full app redesign is a separate future branch.

---

## Goal

Replace the current generic light-grey active workout screen with a Dark Navy + Electric Blue design that feels premium and purpose-built for a gym context. No logic, state, or API changes — visual layer only.

---

## Decisions Made

| Question | Decision |
|---|---|
| Visual direction | Deep Navy + Electric (dark background, electric blue + orange accents) |
| Background treatment | Full dark gradient — entire screen is immersive dark, not just cards |
| Scope | Active workout screen only — full app redesign is its own future branch |
| Log button | Replaced with circular `+` icon button |

---

## Color Tokens

Five new tokens added to `src/theme/colors.ts`. Namespaced for reuse in the full-app redesign later.

| Token | Value | Use |
|---|---|---|
| `navyDeep` | `#0a1628` | Screen background top (gradient start) |
| `navyMid` | `#0f1e3c` | Screen background bottom (gradient end) |
| `navyCard` | `#152035` | Exercise card and header card surface |
| `navyInput` | `#0d1827` | Weight and reps input field backgrounds |
| `electricBlueLight` | `#6eb3f5` | Lighter blue for `+` button gradient and header day label |

No existing tokens are renamed or removed.

---

## Screen Background

- Replace flat `backgroundColor: colors.warmGray` container `View` with `LinearGradient` from `expo-linear-gradient`
- Gradient: top `navyDeep` → bottom `navyMid`, angle `175deg`
- `LinearGradient` wraps the entire screen including the sticky footer

---

## Header Card

- Background: `rgba(255,255,255,0.06)` (semi-transparent glass)
- Border: `1px solid rgba(255,255,255,0.10)`
- Workout name: white, `fontWeight: '800'`
- Day label: `electricBlueLight`, uppercase, letter-spaced — same layout as current

---

## Exercise Cards

- Background: `navyCard`
- Border-radius and shadow unchanged
- Muscle group chip: `rgba(74,144,217,0.2)` background, `electricBlueLight` text
- Exercise name: white, `fontWeight: '700'`
- Separator between sets: `rgba(255,255,255,0.08)` instead of current `warmGray2`

---

## Set Rows

### Unlogged state

- Row background: transparent (sits on `navyCard`)
- Two input boxes side by side, each on a `navyInput` background with `border-radius: radius.sm`
- Each input box shows a small `WEIGHT / lbs` or `REPS` label above a large bold white number
- `+` button: 40×40px circle, `linear-gradient(135deg, electricBlue, electricBlueLight)`, `box-shadow: 0 4px 14px rgba(74,144,217,0.55)` glow

### Logged state

- Background: `rgba(16,185,129,0.12)` (replaces current `lightGreen` — more intentional on dark)
- Left border accent: `3px solid colors.success`
- Text: `{weight} lbs × {reps} ✓` in `colors.success` green
- Removes the current `borderTopWidth` (same as existing fix) and retains `marginBottom: spacing.sm`
- Tappable to re-edit — same behaviour as current

### Validation error

- Inline error text: `rgba(255,100,100,1)` (bright red remains readable on dark)

---

## `+` Button Details

- Shape: `40×40` circle (`borderRadius: 20`)
- Background: `LinearGradient` — `electricBlue` → `electricBlueLight`
- Icon: `+` character, `fontSize: 24`, `fontWeight: '800'`, white
- Glow: `box-shadow: 0 4px 14px rgba(74,144,217,0.55)` (iOS shadow / Android elevation)
- Disabled state (validation not met or save in-flight): opacity `0.4`, glow removed
- Replaces the current rectangular "Log" `TouchableOpacity`

---

## Sticky Footer

- Background: `rgba(255,255,255,0.04)` strip
- Top border: `1px solid rgba(255,255,255,0.08)`
- Finish Workout button: `linear-gradient(90deg, energeticOrange, #f07c0a)`, white bold text, `box-shadow: 0 4px 16px rgba(245,166,35,0.35)` warm glow
- Disabled / in-flight state: opacity `0.6`

---

## Loading and Error States

- Loading: `ActivityIndicator` white on dark background (`color: colors.pureWhite`)
- Full-screen error: white error text, retry `Button` with white outline (`variant="secondary"` styled for dark — or inline style override)

---

## What Does Not Change

- All business logic, state management (`inputMap`, `loggedMap`, `errorMap`, `loadingSetId`)
- RTK Query hooks (`useGetWorkoutQuery`, `useLogSetMutation`, `useCompleteWorkoutMutation`)
- `keyboardShouldPersistTaps="handled"` on FlatList
- Screen-level input state keyed by `exerciseSetId` (survives scroll)
- 10-second abort timeout on set saves
- All 16 existing tests — tests do not assert on visual styling

---

## Files Changed

| File | Change |
|---|---|
| `src/theme/colors.ts` | Add 5 navy/blue tokens |
| `app/active-workout.tsx` | Full visual restyle — logic unchanged |

No new files. No other screens touched.
