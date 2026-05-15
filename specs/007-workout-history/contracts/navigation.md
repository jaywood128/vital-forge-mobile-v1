# Navigation Contract: 007 Workout History

## New Routes

Both routes must be added to the `Stack` in `app/_layout.tsx`.

### `/history`

| Field | Value |
|---|---|
| File | `app/history.tsx` |
| Stack options | `headerShown: false` (screen owns its own header area) |
| Entry point | "History" button on `app/home.tsx` |
| Auth | Protected — user must be logged in (existing auth guard in `_layout.tsx`) |

**Navigation to this route**:
```ts
router.push('/history');
// or as a link: <Link href="/history" />
```

---

### `/workout-detail`

| Field | Value |
|---|---|
| File | `app/workout-detail.tsx` |
| Stack options | `headerShown: false` (screen owns its own back button + header) |
| Entry point | Tap on a `WorkoutHistoryCard` in `/history` |
| Auth | Protected |

**Navigation to this route**:
```ts
router.push(`/workout-detail?id=${workout.id}`);
```

**Reading the param in the screen**:
```ts
import { useLocalSearchParams } from 'expo-router';

const { id } = useLocalSearchParams<{ id: string }>();
const workoutId = Number(id);
```

**Back navigation** (from detail → list):
- Hardware back button (Android) — handled automatically by Expo Router Stack
- Custom back button in screen header — `router.back()`

---

## Stack Registration (diff to `app/_layout.tsx`)

```tsx
// Add inside <Stack> alongside existing screens:
<Stack.Screen name="history" options={{ headerShown: false }} />
<Stack.Screen name="workout-detail" options={{ headerShown: false }} />
```
