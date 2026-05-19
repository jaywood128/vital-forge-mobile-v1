# Vital Forge Mobile — Backlog

## Legal / Compliance (must resolve before sending any emails to real users)

- [ ] **legal(email): add physical mailing address to email footer (CAN-SPAM requirement)**
  Every commercial email must include a physical mailing address by law. Currently a placeholder `[MAILING ADDRESS]` is in `vital-forge-v1/app/views/user_mailer/password_reset.html.erb`. Must be replaced before launch. Do NOT use your home address in a public GitHub repo. Get a virtual mailbox service instead — Anytime Mailbox (~$10-15/month) or iPostal1 (~$10/month) give you a real street address, handle mail scanning, and are widely used by indie developers. Once you have the address, update the email template and remove the placeholder.

## Phase 1 — Lifter Features (HIGHEST PRIORITY)

- [ ] **feat(stats): Personal Records + Exercise Progress Charts** ← NEXT UP
  Two-part feature giving lifters the complete progressive-overload feedback loop.

  **Part 1: PR Detection (1RM-based)**
  - After every logged set, compute Epley 1RM: `weight × (1 + reps/30)`
  - If today's 1RM > all-time best for that exercise → PR
  - Skip on first-ever logging (no prior history to beat)
  - Skip bodyweight exercises (weight is null)
  - Live UX: inline 🏆 badge on set row + slide-down toast ("New PR! Bench 1RM 184 → 187 lbs", 3s) + success haptic
  - History UX: 🏆 badge persists on any past set row that was a PR at time of logging (recomputed from full history)

  **Part 2: Exercise Progress Charts**
  - From `workout-detail.tsx`, tap an exercise name → `app/exercise-progress.tsx?exerciseId=N`
  - Header card: current best weight × reps + estimated 1RM
  - Segmented control: `[Max Weight | 1RM | Volume]`
  - One line chart, metric per completed workout date
  - All client-side from `useGetWorkoutsQuery` data — no backend changes

  **Implementation notes:**
  - Pure functions in `src/lib/stats/` (prDetection, exerciseHistory) — easy to unit test
  - New components: `PRBadge`, `PRToast`, `ExerciseChart`
  - Chart library: `react-native-gifted-charts` (TBD — confirm during planning)

  **Replaces:** existing "PR detection" (Should Have) and "1RM calculator" (Nice to Have) items below — those are now merged into this.

## MVP Blockers (must ship before launch)

- [ ] **feat(auth): password reset flow** ← IN PROGRESS (branch: 010-password-reset)
  Forgot password screen → reset password screen via deep link. See `specs/010-password-reset/`.

- [ ] **feat(active-workout): add / remove sets during a workout**
  Users need to add a bonus set or drop one from the template mid-workout. Each exercise card gets an "+ Add Set" button and a trash icon on each set row. Rails API endpoint needed: `DELETE /api/v1/mobile/exercise_sets/:id`.

- [ ] **feat(active-workout): previous performance hint**
  While logging a set, show the user's last logged value for that exercise above the weight input (e.g. "Last time · 135 lbs × 8 reps"). Derive from `useGetWorkoutsQuery` data. No new backend endpoints needed.

## Should Have (v1.1 post-launch)

- [ ] **feat(history): month/year filtering**
  Workout history list gets a filter strip (scrollable month chips or year/month picker). Filter client-side or add `?month=YYYY-MM` query param to the Rails workouts index endpoint.

- [ ] **feat(home): workout streak display**
  Show a streak badge on the home screen. Calculate client-side from `useGetWorkoutsQuery`: consecutive calendar days (or weeks) with at least one completed workout.

- [ ] **feat(home): weekly volume widget**
  Small banner on home screen: "This week: 12,450 lbs total · +8% vs last week". Total volume = `sum(weight × reps)` across all completed sets in the current calendar week. Pure client-side calculation from `useGetWorkoutsQuery`. Split out from the Personal Records + Exercise Progress Charts feature to keep that scope tight.

## Architecture Decision Record

- [ ] **arch: migrate PR detection to server-side when pagination is added**
  Current PR detection scans the full `WorkoutDetail[]` array client-side using `useMemo`. This works correctly because `GET /api/v1/workouts` returns the complete workout history with no pagination. **This assumption breaks the moment pagination is introduced** — a paginated response only covers recent workouts, so historical PRs from older sessions would be missed.

  **Future design:** Add a `personal_records` table to Rails (`user_id`, `exercise_id`, `best_1rm`, `best_weight`, `achieved_at`). Update it server-side via an `after_create` callback or background job whenever a new set is saved. Mobile fetches PRs from a dedicated `GET /api/v1/mobile/personal_records` endpoint instead of computing client-side. The existing stats functions (`calculateEpley1RM`, `getCurrentBests`) remain useful — only the data source changes.

  **Interview talking point:** "I chose client-side derivation for the MVP because we load full history and the user base is small. I documented the migration path to server-side storage because the decision is load-bearing — it breaks under pagination and becomes a correctness bug, not just a performance issue."

  Revisit when: pagination is added to `GET /api/v1/workouts` OR the app has enough users that full-history loads become slow.

## Phase 2 — Expanding to Weight-Tracking Users

These features broaden the app beyond pure strength training to general fitness, body composition, and weight-loss users.

- [ ] **feat(body): body weight log + trend chart**
  Daily/weekly weigh-ins with a line chart trend. Requires new Rails endpoint and DB table (`body_weights`: user_id, weight, weight_unit, logged_at). Mobile: new screen accessible from home or settings.

- [ ] **feat(body): body measurements**
  Track chest, waist, hips, arms, thighs over time. Same table pattern as body weight. Per-measurement line chart.

- [ ] **feat(body): progress photos**
  Front/side/back photos tied to dates. Side-by-side compare two dates. Requires file upload (S3 / Railway storage) and a new endpoint.

## Nice to Have / Later

- [ ] **feat(ai): post-workout AI feedback**
  Backend already exists (`weekly_feedbacks_controller`, `GenerateWeeklyFeedbackJob`, gated by `ENABLE_AI_FEATURES` env var). Mobile screen is missing. Show AI-generated weekly summary on home screen or as a dedicated tab.

- [ ] **feat(settings): Settings screen with user preference toggles**
  Rest timer on/off, rest duration override, units (lbs/kg). Rails backend may need expansion of `user_preferences`.

## Infrastructure

- [ ] **infra(backend): decide and consolidate job queue adapter (Solid Queue vs Sidekiq)**
  The codebase currently has a split: dev/test use Sidekiq (`application.rb`), production/staging use Solid Queue (`production.rb`, `staging.rb`). This means you're testing with a different adapter than you run in production — a real gap. Pick one and make it consistent across all environments.

  **Solid Queue** (Rails 8 default, currently in production):
  - ✅ No Redis required — one less service to run and pay for
  - ✅ Jobs stored in PostgreSQL — same DB you already have, simple mental model
  - ✅ First-class Rails 8 support, maintained by the Rails team
  - ✅ Built-in recurring jobs via `config/recurring.yml`
  - ❌ Slower than Redis for high-throughput workloads (DB polling vs in-memory)
  - ❌ At very high volume, job polling can add load to your primary DB
  - **Best for**: MVPs, low-to-moderate job volume, teams that want fewer moving parts

  **Sidekiq** (currently in dev/test):
  - ✅ Very fast — Redis is in-memory, purpose-built for queues
  - ✅ Excellent Web UI for monitoring and retrying jobs (`/sidekiq`)
  - ✅ Battle-tested at scale (used by major apps)
  - ✅ Rich ecosystem: batches, unique jobs, rate limiting via plugins
  - ❌ Requires Redis — extra cost on Railway (~$5–15/month), extra operational surface
  - ❌ Redis is ephemeral by default; jobs can be lost if Redis restarts without persistence configured
  - **Best for**: High job volume, teams that need monitoring/observability, apps already using Redis (e.g. for caching or Action Cable)

  **Recommendation for VitalForge MVP**: Consolidate on **Solid Queue** — remove `sidekiq` and `sidekiq-cron` gems, update `application.rb` to use `:solid_queue`, configure the queue database properly. You get simpler infrastructure and production parity in dev. Revisit if job volume grows to thousands/day or you need advanced monitoring.

  When consolidating: also switch email delivery from `deliver_now` → `deliver_later` so password reset emails don't block the request thread.

- [ ] **infra(backend): configure Solid Queue queue database on Railway**
  `production.rb` sets `config.solid_queue.connects_to = { database: { writing: :queue } }` but the `queue` database entry in `database.yml` likely points to the same primary DB (or is misconfigured). For production scale, Solid Queue should write to a separate PostgreSQL instance. For MVP it can share the primary DB — just remove the `connects_to` override and let it use the default connection. ~1-2 hours of setup.

## Technical Debt

- [ ] **refactor(signup): consolidate form useState into single FormState object** (`app/signup.tsx`)
  8 separate `useState` calls. Consolidate into a single `useState<FormState>` object.

## Out of Scope

- **Calorie tracking** — no heart rate data; any number shown would be misleading.
