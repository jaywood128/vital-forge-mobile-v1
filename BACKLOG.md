# Mobile Backlog

Items that need investigation, design, or planning before implementation.

---

## 006 — Full App UI Redesign (Deep Navy Theme)

**Priority:** High — next up
**Type:** Feature / Visual

Apply the Deep Navy + Electric Blue design system across all screens. Option A chosen: full dark gradient as the entire screen background (not just cards). Active workout screen spec already exists at `specs/005-active-workout-screen/redesign-design.md` — this branch extends that language globally.

**Screens:** index, login, signup, home, goal-selection, experience-level, training-days, template-preview, workout-preview, active-workout.

**Design tokens to add (`src/theme/colors.ts`):**

| Token | Value | Use |
|---|---|---|
| `navyDeep` | `#0a1628` | Gradient top / screen background start |
| `navyMid` | `#0f1e3c` | Gradient bottom / screen background end |
| `navyCard` | `#152035` | Exercise card and header card surface |
| `navyInput` | `#0d1827` | Text input field backgrounds |
| `electricBlueLight` | `#6eb3f5` | + button gradient, day label, chip text |

**Design rules (apply to every screen):**
- Background: `LinearGradient` top `navyDeep` → bottom `navyMid`, angle 175deg
- Cards: `rgba(255,255,255,0.06)` background, `1px solid rgba(255,255,255,0.10)` border
- Text: primary white, secondary `rgba(255,255,255,0.4)`, captions `mediumGray`
- Inputs: `navyInput` background, white text, electric blue focus border
- Primary button: orange gradient `#F5A623 → #f07c0a`, warm glow `rgba(245,166,35,0.35)`
- Secondary button: white outline, white text
- Destructive button: red outline, white text
- Chips/tags: `rgba(74,144,217,0.2)` background, `electricBlueLight` text
- Logged set row: `rgba(16,185,129,0.12)` background, `3px solid colors.success` left border
- No logic or API changes — visual layer only

---

## 007 — Workout History Screen

**Priority:** High — MVP blocker
**Type:** Feature

List of past workouts: date, name, total sets logged, duration. Tap to expand and see exercises + sets. Without this users have no feedback loop after finishing a workout.

**API:** `GET /api/v1/mobile/workouts` already returns completed workouts — filter `completed: true`, sort by `workout_date` desc.

---

## 008 — Rest Timer

**Priority:** High — MVP blocker
**Type:** Feature

After logging a set, auto-start a configurable countdown (default 90s). Show remaining time on the set row with a visual progress ring. Fire a local notification when time's up.

**Notes:**
- `setTimeout` + `setInterval` for the countdown, held at screen level
- `expo-notifications` for the alert (requires permission prompt)
- Rest duration configurable per exercise — backend already has `rest_between_sets` on `workout_exercise`

---

## 009 — Previous Performance on Set Row

**Priority:** High — MVP blocker
**Type:** Feature

Show last session's logged weight/reps in grey below each set input: "Last: 185 × 8". Users rely on this every session to know where to start.

**Notes:**
- Fetch the most recent completed workout for the same template day
- Pass `previousSets` down to `ExerciseSection` / `SetRow` — display only
- No state or API changes beyond an extra query

---

## 010 — Volume & Progress Tracking

**Priority:** Medium
**Type:** Feature

Total volume per session (sets × reps × weight) with a simple week-over-week trend on the home screen. Feeds directly into the AI feedback feature.

---

## 011 — Plate Calculator

**Priority:** Medium
**Type:** Feature

Given a target barbell weight, show which plates to load each side. Pure client-side calculation, no backend needed.

---

## 012 — Notes Per Exercise

**Priority:** Medium
**Type:** Feature

One-line text field per exercise card. Backend already has a `notes` column on `workout_exercise` — display and PATCH only.

---

## CI/CD Pipeline Quality Gates

**Priority:** Medium
**Type:** Research / Infrastructure

Research and document what should be added to the GitHub Actions pipeline for PRs on this repo. At minimum cover:

- **Test runner** — run `npx jest --no-coverage` on every PR; fail the build if any test fails
- **TypeScript type-check** — `npx tsc --noEmit` to catch type errors not caught by the test suite
- **Linter** — `npm run lint` (ESLint with Expo flat config) as a required check
- **Code coverage threshold** — decide a minimum coverage % and enforce it (Jest `--coverage --coverageThreshold`)
- **EAS Build smoke test** — investigate whether a development build can be triggered on PR to catch native/bundler issues before merge
- **Dependency audit** — `npm audit` or a tool like `socket.dev` to flag new vulnerable dependencies introduced in a PR
- **Bundle size tracking** — Expo/Metro bundle size diff to catch accidental large imports
- **E2E / Detox** — evaluate whether Detox (or Maestro) automated UI tests are worth adding given the Expo Go constraint; document trade-offs
- **PR size check** — optional: warn when a PR diff exceeds a threshold to encourage smaller PRs

---

## App Distribution — Personal Device & App Store

**Priority:** High (personal device), Low (App Store)
**Type:** Research / Infrastructure

### Phase 1 — Get the app on your gym phone without Expo Go or the App Store

- **EAS Build + Internal Distribution** — build a signed `.ipa` (iOS) or `.apk` (Android) via Expo's cloud build service (`eas build --profile preview`), download directly to device via a QR code link; no TestFlight or Play Store needed; free tier available, paid for faster builds
- **TestFlight (iOS)** — Apple's official beta channel; requires Apple Developer account ($99/yr); likely the right long-term path
- **Internal App Sharing (Android)** — Google Play Console direct install link; no review, near-instant
- **Ad-hoc distribution (iOS)** — register device UDIDs in Apple Developer portal; device-count limited

### Phase 2 — App Store / Play Store release

- **EAS Submit** — automates upload to App Store Connect and Google Play after an EAS Build
- **App Store Connect setup** — app ID, bundle ID, provisioning profiles, privacy policy
- **Google Play Console setup** — app signing, release tracks (internal → closed → open → production)
- **Review guidelines** — flag features (auth, health data) that need extra review justification

---
