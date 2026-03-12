# API Contracts: 004 — View & Start Workout

All endpoints require `Authorization: Bearer <jwt_token>` header.

---

## CHANGED: GET /api/v1/workout_templates/:id

Returns template detail with exercises now nested under days. **Breaking change** — flat `exercises` key is removed.

**Response (after)**:
```json
{
  "data": {
    "id": 1,
    "name": "Push Pull Legs",
    "description": "...",
    "goal_type": "physique",
    "difficulty_level": "Intermediate",
    "days_per_week": 6,
    "estimated_duration_minutes": 45,
    "total_exercises": 18,
    "source": "Bodybuilding.com",
    "has_active_workout": false,
    "active_workout_id": null,
    "days": [
      {
        "id": 1,
        "day_number": 1,
        "name": "Push Day",
        "estimated_duration_minutes": 45,
        "muscle_focus": "Chest, Shoulders, Triceps",
        "exercises": [
          {
            "id": 101,
            "order_position": 1,
            "recommended_sets": 4,
            "recommended_reps": "8-12",
            "rest_seconds": 90,
            "notes": "Focus on chest contraction",
            "exercise": {
              "id": 5,
              "name": "Barbell Bench Press",
              "muscle_group": "Chest",
              "equipment": "Barbell",
              "exercise_type": "Strength"
            }
          }
        ]
      },
      {
        "id": 2,
        "day_number": 2,
        "name": "Pull Day",
        "estimated_duration_minutes": 45,
        "muscle_focus": "Back, Biceps",
        "exercises": [ ... ]
      }
    ],
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**What changed**: `exercises: [...]` (flat) → `days: [{ day_number, name, exercises: [...] }]` (nested).

**Mobile impact**: `WorkoutTemplateDetail` type in `templatesApi.ts` must be updated. Any code reading `template.exercises` must be updated to `template.days[n].exercises`.

---

## CHANGED: POST /api/v1/workout_templates/:id/start

Accepts new `day_number` body parameter. Creates a workout session using only exercises from the specified day.

**URL**: `POST /api/v1/workout_templates/:id/start`

**Body (before)**:
```json
{ "scheduled_time": "07:30" }
```

**Body (after)**:
```json
{
  "day_number": 2,
  "scheduled_time": "07:30"
}
```

- `day_number`: integer, required for day-based programmes. Defaults to `1` if omitted.
- `scheduled_time`: string "HH:MM", optional, unchanged.

**Response (201 Created)**:
```json
{
  "workout": {
    "id": 42,
    "name": "Push Pull Legs",
    "workout_date": "2026-03-09",
    "completed": false,
    "started_at": null,
    "workout_template_id": 1,
    "workout_exercises": [
      {
        "id": 201,
        "order_position": 1,
        "completed": false,
        "exercise": { "id": 5, "name": "Barbell Bench Press", "muscle_group": "Chest" },
        "exercise_sets": [
          { "id": 301, "set_number": 1, "reps": 8, "weight": null, "completed": false },
          { "id": 302, "set_number": 2, "reps": 8, "weight": null, "completed": false },
          { "id": 303, "set_number": 3, "reps": 8, "weight": null, "completed": false },
          { "id": 304, "set_number": 4, "reps": 8, "weight": null, "completed": false }
        ]
      }
    ]
  }
}
```

**Response (409 Conflict)** — unchanged behaviour, active workout already exists:
```json
{
  "error": "You already have an active workout from this template. Complete it first or view your in-progress workouts.",
  "active_workout_id": 38
}
```

---

## UNCHANGED: PATCH /api/v1/workouts/:id/start

Marks workout as started (sets `started_at`). No changes to this endpoint.

**Note for mobile**: Current `workoutsApi.ts` has `completeWorkout` calling `POST /api/v1/workouts/:id/finish`. The correct endpoint is `PATCH /api/v1/workouts/:id/complete`. Fix this in `workoutsApi.ts` as part of this feature (prep for Feature 005).

---

## UNCHANGED: GET /api/v1/workouts

Returns all workouts for the authenticated user. Used by the dashboard to count completed workouts per template for day calculation.

Mobile filter logic:
```typescript
const completedFromTemplate = workouts.filter(
  w => w.workout_template_id === selectedTemplateId && w.completed
);
const nextDay = (completedFromTemplate.length % daysPerWeek) + 1;
```
