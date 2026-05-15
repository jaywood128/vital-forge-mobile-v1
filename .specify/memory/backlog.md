# Vital Forge Mobile — Backlog

## Technical Debt

- [ ] **refactor(signup): consolidate form useState into single FormState object** (`app/signup.tsx`)
  `signup.tsx` currently has 8 separate `useState` calls (email, password, passwordConfirmation, firstName, lastName, phoneNumber, and 3 error fields). Consolidate into a single `useState<FormState>` object so the form can be reset in one call and the field list is self-documenting.

## Features

- [ ] **feat(templates): add HIIT, cardio and core exercises to workout template library**
  Current templates are weighted/strength focused. Expand the Rails seed data and template library to include HIIT circuits, core strength exercises (planks, hollow holds, dead bugs), and cardio movements (burpees, jump rope, box jumps). Goal is to make the default programmes more balanced and help users raise their heart rate and build core strength, not just lift weights.

- [ ] **feat(settings): Settings screen with user preference toggles**
  Add a Settings screen accessible from the home screen. Initial toggles: rest timer on/off (disables auto-start after logging a set), rest duration override (custom seconds instead of per-exercise value). Future candidates: notification preferences, units (lbs/kg), dark/light theme. Rails backend may need a `user_settings` table or expansion of `user_preferences` to persist these values.
