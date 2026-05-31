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

## Pagination + Server-Side Personal Records Table

**Priority:** Low — defer until evidence of need
**Type:** Architecture / Performance
**Depends on:** Real user growth, payload size becoming a problem

### Decision made during 011-personal-records-progress

PR detection and exercise progress charts are currently computed **client-side** from the full `GET /api/v1/workouts` payload. This is intentional — the calculation is trivial (0.17ms for 5 years of data / ~16,600 sets) and avoids premature infrastructure.

**Why NOT to add pagination + PR table now:**
- No evidence of payload size or performance issue at current scale
- Adding pagination forces server-side PR calculation — they are mutually exclusive with client-side detection
- A `personal_records` table adds write complexity (must be maintained on every set log, updated retroactively when sets are edited/deleted)
- Senior engineers would question this as premature optimization without a measured problem

**When TO revisit (trigger conditions):**
- `GET /api/v1/workouts` response exceeds ~2MB (roughly 500+ completed workouts)
- App has real users and `getWorkouts` latency becomes measurable on slow connections
- Pagination is added for any other reason (e.g. home screen history feed)

**Migration path when the time comes:**
1. Add `personal_records` table on Rails backend: `(user_id, exercise_id, set_id, estimated_1rm, recorded_at)`
2. Backfill via a migration that runs `detectPRSetIds` logic in SQL
3. Add `POST /api/v1/personal_records/detect` endpoint (or background job) triggered on set log
4. Switch `detectPRSetIds` client logic to `GET /api/v1/personal_records?exercise_id=X`
5. Add `GET /api/v1/workouts?page=N&per=25` with cursor pagination
6. Add a database index on `exercise_sets(exercise_id, weight, reps, completed)` for the PR query

**ADR reference:** See discussion in session `011-personal-records-progress` — Google AI recommended server-side immediately; decision was to document the path and defer.

---

## Workout Deletion + Personal Records Recalculation

**Priority:** Low — implement when workout deletion is added
**Type:** Feature / Data Integrity
**Depends on:** personal_records table (server-side PR branch)

Deleting a workout means it never happened (industry standard: Strava, Garmin, Strong, Hevy all recalculate records on activity deletion). The `personal_records` table uses `on_delete: :restrict` on the `exercise_set` FK — deletion will fail loudly rather than leave stale PRs.

**Correct implementation when workout deletion is built:**
1. Identify all exercises in the workout being deleted
2. Delete `personal_records` rows where `set_id` is in the workout's exercise_sets
3. For each affected exercise, re-run PR detection across remaining completed sets in chronological order
4. Insert new `personal_records` rows for the new current bests

**Do not use `on_delete: :cascade` or `on_delete: :nullify`** — cascade silently wipes PR history, nullify leaves stale records pointing to deleted data.

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

## Personal Records — Background Job for PR Persistence

**Priority:** Medium — scale concern, not an immediate bug
**Type:** Performance / Architecture
**Depends on:** Sidekiq already configured

### Problem
`persist_prs` runs synchronously inside the `PATCH /api/v1/workouts/:id/complete` request. For a 10-exercise workout this is ~10 DB writes blocking the HTTP response. At low traffic this is unnoticeable, but under load it adds latency to every workout completion.

### Solution
Move `persist_prs` to a Sidekiq background job (`PersonalRecordPersistJob`). The `complete` action completes the workout and enqueues the job, returning immediately. The job runs async and the mobile fetches updated PRs on the next `GET /api/v1/personal_records` call.

**Tradeoff:** The post-workout PR summary modal currently relies on `new_personal_records` in the completion response. Async processing means the modal can't show immediately — you'd need a polling or push notification approach, or defer the modal to a separate screen loaded after a short delay.

---

## Personal Records — Uniqueness Constraint

**Priority:** Low — edge case, not a live bug
**Type:** Data Integrity

### Problem
No database-level uniqueness constraint prevents duplicate `PersonalRecord` rows for the same `(user_id, exercise_id, exercise_set_id)`. Two concurrent requests completing the same workout would each run `persist_prs` and write duplicate rows.

### Solution
Add a unique index:
```ruby
add_index :personal_records, [:user_id, :exercise_id, :exercise_set_id], unique: true
```
And handle `ActiveRecord::RecordNotUnique` in `persist_prs` (rescue or use `insert_or_ignore`).

---

## Personal Records — Paginate GET /api/v1/personal_records

**Priority:** Low — defer until payload size becomes measurable
**Type:** Performance

### Problem
`GET /api/v1/personal_records` returns all records for the user in a single response. PRs accumulate slowly (only written when you beat your best) so this list stays small for years of typical use. However as a principle, unbounded collection endpoints should be paginated before they become a problem.

### Solution
Add cursor pagination: `GET /api/v1/personal_records?after_id=123&limit=50`. The mobile client already handles the full list — update `useGetPersonalRecordsQuery` to paginate and merge results.

**Note:** See existing BACKLOG entry on pagination + server-side PRs for the broader context.

---

## Refactor — Extract persist_prs to Service Object

**Priority:** Medium — code quality, not a bug
**Type:** Refactor
**Branch:** create `refactor/pr-persister-service`

### Problem
`persist_prs` is 40 lines of business logic inside `WorkoutsController`. This makes it harder to unit test in isolation (requires a full controller context) and harder to reuse if PR detection is ever triggered from a background job or rake task.

### Task
1. Create `app/services/personal_record_persister.rb`:
   ```ruby
   class PersonalRecordPersister
     include Epley1Rm

     def initialize(workout)
       @workout = workout
     end

     def call
       # move persist_prs body here, return new_prs array
     end
   end
   ```
2. Replace `persist_prs(workout)` in the controller with `PersonalRecordPersister.new(workout).call`
3. Write unit specs for `PersonalRecordPersister` directly (no controller overhead)
4. Delete the private `persist_prs` method from the controller

---

## Refactor — Consolidate 1RM Calculation

**Priority:** Low — consistency risk, not a live bug
**Type:** Refactor

### Problem
The Epley 1RM formula exists in two places:
- `lib/epley1_rm.rb` — used by `persist_prs` (backend) and `pr_info` in `exercise_sets_controller`
- `src/lib/stats/exerciseHistory.ts` — used by `getExerciseSeries` (frontend chart)
- `app/active-workout.tsx` — `derivedPrSetIds` has the formula inlined

The backend is consistent (one module). The frontend has two copies — `exerciseHistory.ts` and `active-workout.tsx` both implement `weight * (1 + reps / 30)` independently.

### Task
1. Export `epley1RM` from `src/lib/stats/exerciseHistory.ts`
2. Import and use it in `active-workout.tsx` `derivedPrSetIds` instead of the inline formula
3. Ensures a formula change only needs to happen in one place on the frontend

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
