# Research: 004 — View & Start Workout

## Decision 1: Resume Detection Strategy

**Decision**: Use `GET /api/v1/workout_templates/:id` (template detail) for resume detection — NOT a separate `GET /api/v1/workouts` scan.

**Rationale**: The backend `WorkoutTemplatesController#show` already queries `current_user.workouts.where(workout_template_id: ..., completed: false).first` and returns `has_active_workout: true` and `active_workout_id: <id>` in its response. The home screen will fetch the template detail anyway (to get day names). This gives us resume state for free from a single call rather than fetching the full workout history.

**Impact on Q4 clarification**: The clarified approach (fetch all workouts on dashboard load) is superseded by this finding. The template detail endpoint already performs the same detection server-side and returns the result. Using the template detail is simpler, faster, and requires no additional endpoint.

**Alternatives considered**:
- `GET /api/v1/workouts` client-side filter — more network payload, more client logic, achieves same result
- New `GET /api/v1/workouts/active` endpoint — unnecessary given template detail already provides this

---

## Decision 2: Day Count for Next Day Calculation

**Decision**: Fetch `GET /api/v1/workouts` on dashboard load and filter client-side for `completed: true && workout_template_id === selected_workout_template_id`. Count these to compute `next_day = (count % days_per_week) + 1`.

**Rationale**: No backend change required. The existing `getWorkouts` RTK Query hook already exists in `workoutsApi.ts`. Workout history per user will be small for the foreseeable future (tens to low hundreds of records). Client-side filtering is negligible overhead.

**Alternatives considered**:
- Add `completed_workouts_count` to template response — avoids second call but requires backend change
- Backend `GET /api/v1/workouts?template_id=X&completed=true` filter — not currently supported; would require route/controller change

---

## Decision 3: `workout_template_exercises` FK Strategy

**Decision**: Add `workout_template_day_id` as a new FK column to `workout_template_exercises`. Retain the existing `workout_template_id` column for backwards compatibility during the migration window. After all exercises are migrated to reference a day, the direct `workout_template_id` column can be marked redundant but is left in place for this feature.

**Rationale**: Removing `workout_template_id` from exercises in the same migration as adding `workout_template_day_id` is risky — existing associations in `WorkoutTemplate` (`has_many :workout_template_exercises`) would break. Keeping both during this feature keeps changes minimal and safe.

**Migration strategy**:
1. Create `workout_template_days` table
2. Add `workout_template_day_id` (nullable) to `workout_template_exercises`
3. Data migration: for each template, create a Day 1 record, assign all existing exercises to it
4. Add `null: false` constraint after data is migrated (in same migration, after the data step)
5. Re-seed with full day data per template

---

## Decision 4: Mobile Home Screen Queries

**Decision**: Home screen (`app/home.tsx`) will call three RTK Query hooks:
1. `useGetCurrentUserQuery()` — already in place
2. `useGetPreferenceQuery()` — already in place, provides `selected_workout_template_id`
3. `useGetTemplateQuery(selected_workout_template_id)` — **new addition**, provides `has_active_workout`, `active_workout_id`, and `days[]` (after backend update)
4. `useGetWorkoutsQuery()` — **new addition**, filtered client-side for completed count → next day number

The template query is skipped (RTK Query `skip` option) when `selected_workout_template_id` is null.

---

## Decision 5: Workout Preview Screen Navigation

**Decision**: Route is `app/workout-preview.tsx` → `/workout-preview`. Navigation params passed via Expo Router: `templateId`, `dayNumber`, `dayName`. The preview screen fetches no additional data — it receives the day's exercise list from the home screen's already-fetched template response via navigation params (serialised) or re-fetches using the template ID.

**Rationale**: Re-fetching the template on the preview screen is acceptable since RTK Query caches the response. The second call hits the cache, not the network.

---

## Decision 6: `WorkoutTemplateStarter` Day Filtering

**Decision**: Update `WorkoutTemplateStarter` to accept `day_number` and filter exercises via:
```ruby
@template.workout_template_exercises
  .joins(:workout_template_day)
  .where(workout_template_days: { day_number: @day_number })
```

Default `day_number: 1` if not provided (backwards compatible).

---

## Known Endpoint Bugs in Current Mobile Code (fix in this feature)

| Current (wrong) | Correct |
|---|---|
| `POST /api/v1/workouts` | `POST /api/v1/workout_templates/:id/start` |
| `POST /api/v1/workouts/:id/finish` | `PATCH /api/v1/workouts/:id/complete` |

`logSet` (`POST /api/v1/workouts/:id/sets`) has no matching backend route — this is a Feature 005 concern. Do not fix here.
