# Vital Forge Mobile — Backlog

## Legal / Compliance (must resolve before sending any emails to real users)

- [ ] **legal(email): add physical mailing address to email footer (CAN-SPAM requirement)**
  Every commercial email must include a physical mailing address by law. Currently a placeholder `[MAILING ADDRESS]` is in `vital-forge-v1/app/views/user_mailer/password_reset.html.erb`. Must be replaced before launch. Do NOT use your home address in a public GitHub repo. Get a virtual mailbox service instead — Anytime Mailbox (~$10-15/month) or iPostal1 (~$10/month) give you a real street address, handle mail scanning, and are widely used by indie developers. Once you have the address, update the email template and remove the placeholder.

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

- [ ] **feat(active-workout): personal record (PR) detection**
  After logging a set, compare weight × reps against all previous sets for that exercise. If it's a new max, flash a "New PR 🏆" banner and fire a success haptic.

## Nice to Have / Later

- [ ] **feat(ai): post-workout AI feedback**
  After completing a workout, show an AI-generated summary via OpenAI API (GPT-4o) called from Rails backend. Requires solid workout history dataset first.

- [ ] **feat(settings): Settings screen with user preference toggles**
  Rest timer on/off, rest duration override, units (lbs/kg). Rails backend may need expansion of `user_preferences`.

- [ ] **feat(workout): 1RM calculator**
  Epley formula from any logged set. Show on exercise history detail view.

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
