# Data Model: 004 — View & Start Workout

## New Model: `WorkoutTemplateDay`

**Rails model**: `app/models/workout_template_day.rb`
**Table**: `workout_template_days`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | integer | PK | |
| `workout_template_id` | bigint | NOT NULL, FK → workout_templates | |
| `day_number` | integer | NOT NULL | 1 through `workout_template.days_per_week` |
| `name` | string | NOT NULL | e.g. "Push Day", "Pull Day", "Legs Day" |
| `estimated_duration_minutes` | integer | nullable | Planned duration for this day's session |
| `muscle_focus` | string | nullable | e.g. "Chest, Shoulders, Triceps" |
| `created_at` | datetime | NOT NULL | |
| `updated_at` | datetime | NOT NULL | |

**Indexes**:
- `(workout_template_id, day_number)` — unique composite index
- `workout_template_id` — standard FK index

**Validations**:
- `workout_template_id` presence
- `day_number` presence, numericality (integer, ≥ 1)
- `name` presence, max length 100
- `(workout_template_id, day_number)` uniqueness

**Associations**:
```ruby
belongs_to :workout_template
has_many :workout_template_exercises, dependent: :destroy
```

---

## Updated Model: `WorkoutTemplateExercise`

**Change**: Add `workout_template_day_id` FK column. Retain `workout_template_id` for backwards compatibility.

| Column | Change | Notes |
|---|---|---|
| `workout_template_day_id` | **NEW** bigint, NOT NULL, FK → workout_template_days | Links exercise to its day |
| `workout_template_id` | Retained | Kept for existing associations; redundant long-term |

**Updated associations**:
```ruby
belongs_to :workout_template        # retained
belongs_to :workout_template_day    # new
belongs_to :exercise
```

---

## Updated Model: `WorkoutTemplate`

**Change**: Add `has_many :workout_template_days` association.

```ruby
has_many :workout_template_days, -> { order(:day_number) }, dependent: :destroy
has_many :workout_template_exercises, -> { order(:order_position) }, dependent: :destroy
has_many :exercises, through: :workout_template_exercises
```

---

## No Changes to `Workout`, `WorkoutExercise`, `ExerciseSet`

These models record what the user actually did in a session. They are not affected by the template day restructuring.

---

## Full Relationship Map (after this feature)

```
WorkoutTemplate
  ├── has_many :workout_template_days (ordered by day_number)
  │     └── WorkoutTemplateDay
  │           ├── day_number: 1, name: "Push Day"
  │           └── has_many :workout_template_exercises
  │                 └── WorkoutTemplateExercise
  │                       ├── order_position, recommended_sets, recommended_reps
  │                       └── belongs_to :exercise → Exercise
  └── (legacy) has_many :workout_template_exercises (direct, retained)

User
  └── has_many :workouts
        └── Workout (one session instance)
              ├── workout_template_id (which template was used)
              ├── started_at, completed_at, completed
              └── has_many :workout_exercises
                    └── WorkoutExercise
                          └── has_many :exercise_sets → ExerciseSet
```

---

## Seed Data Plan

All split templates require complete per-day exercise sets. New exercises added to the catalogue where needed.

### Push Pull Legs (6 days/week → 3 unique days, repeat)
| Day | Name | Key Exercises |
|---|---|---|
| 1 | Push Day | Bench Press, Incline DB Press, Flyes, OHP, Lateral Raise, Cable Pushdown |
| 2 | Pull Day | Barbell Row, Pull-ups, Bent-Over DB Row, Cable Row, Barbell Curl, Cable Curl |
| 3 | Legs Day | Barbell Squat, Leg Press, Romanian Deadlift*, Leg Curl*, Plank |

### Upper/Lower Split (4 days/week → 2 unique days, repeat)
| Day | Name | Key Exercises |
|---|---|---|
| 1 | Upper Day | Bench Press, Barbell Row, OHP, Pull-ups, Incline DB Press, Cable Row, Barbell Curl, Overhead Triceps Ext |
| 2 | Lower Day | Barbell Squat, Leg Press, Barbell Deadlift, Front Squat, Kettlebell Swing, Plank |

### Arnold Split (6 days/week → 3 unique days, repeat)
| Day | Name | Key Exercises |
|---|---|---|
| 1 | Chest & Back | Bench Press, Barbell Row, Incline DB Press, Pull-ups, Flyes, Bent-Over DB Row, Cable Row, Push-ups |
| 2 | Shoulders & Arms | OHP, Lateral Raise, Barbell Curl, Cable Curl, Overhead Triceps Ext, Cable Pushdown |
| 3 | Legs | Barbell Squat, Leg Press, Front Squat, Kettlebell Deadlift, Plank |

### 5/3/1 Program (4 days/week → 4 unique days)
| Day | Name | Key Exercises |
|---|---|---|
| 1 | Squat Day | Barbell Squat, Leg Press, Front Squat, Kettlebell Swing, Plank |
| 2 | Bench Day | Bench Press, Incline DB Press, Cable Row, Push-ups, Cable Pushdown |
| 3 | Deadlift Day | Barbell Deadlift, Kettlebell Deadlift, Barbell Row, Pull-ups, Plank |
| 4 | Press Day | OHP, Lateral Raise, Barbell Row, Pull-ups, Overhead Triceps Ext |

### Bro Split (5 days/week → 5 unique days)
| Day | Name | Key Exercises |
|---|---|---|
| 1 | Chest | Bench Press, Incline DB Press, Flyes, Push-ups, Cable Pushdown, Overhead Triceps Ext |
| 2 | Back | Barbell Row, Pull-ups, Bent-Over DB Row, Cable Row |
| 3 | Shoulders | OHP, Lateral Raise, Barbell Row* |
| 4 | Arms | Barbell Curl, Cable Curl, Overhead Triceps Ext, Cable Pushdown |
| 5 | Legs | Barbell Squat, Leg Press, Kettlebell Deadlift, Plank |

### Full Body Workout (3 days/week) — No change
All 7 exercises remain on Day 1. Same exercises every session. `day_number = 1` for all.

*Exercises marked with * may need to be added to the Exercise catalogue if not already present.
