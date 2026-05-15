# Quickstart: 007 Workout History

## Running the feature

```bash
# From vital-forge-mobile-v1/
npx expo start --ios

# API must be running on the same network
# From vital-forge-v1/
bin/rails server -b 0.0.0.0 -p 3000
```

Navigate: Home → tap "History" button → History list → tap any workout card → Workout Detail.

---

## Key files

| File | Purpose |
|---|---|
| `app/history.tsx` | History List screen (new) |
| `app/workout-detail.tsx` | Workout Detail screen (new) |
| `src/components/ui/WorkoutHistoryCard.tsx` | Reusable history card (new) |
| `src/features/workouts/workoutsApi.ts` | `getWorkouts` return type updated to `WorkoutDetail[]` |
| `src/theme/colors.ts` | Dark theme tokens added (`navyDeep` etc.) |
| `src/components/ui/Screen.tsx` | Dark gradient variant added |
| `src/components/ui/Card.tsx` | Dark glass-morphism variant added |
| `app/_layout.tsx` | `history` and `workout-detail` routes registered |
| `app/home.tsx` | "History" button added |

---

## Fetching history data

```ts
import { useGetWorkoutsQuery } from '../src/features/workouts/workoutsApi';

// In history.tsx
const { data, isLoading, isError } = useGetWorkoutsQuery();
const completed = (data ?? []).filter(w => w.completed);
```

RTK Query caches the result — navigating back from detail costs zero additional requests.

---

## Navigating to detail

```ts
import { useRouter } from 'expo-router';

const router = useRouter();
router.push(`/workout-detail?id=${workout.id}`);
```

Reading the param in `workout-detail.tsx`:

```ts
import { useLocalSearchParams } from 'expo-router';
import { useGetWorkoutQuery } from '../src/features/workouts/workoutsApi';

const { id } = useLocalSearchParams<{ id: string }>();
const { data: workout, isLoading } = useGetWorkoutQuery(Number(id));
```

---

## After 006 merges into development

```bash
# On 007-workout-history branch:
git fetch origin
git merge origin/development

# Conflicts will be in: colors.ts, Screen.tsx, Card.tsx
# Both sides add identical code — accept either side for each conflict.
git add src/theme/colors.ts src/components/ui/Screen.tsx src/components/ui/Card.tsx
git merge --continue
```
