# Vital Forge Mobile — Backlog

## Technical Debt

- [ ] **refactor(signup): consolidate form useState into single FormState object** (`app/signup.tsx`)
  `signup.tsx` currently has 8 separate `useState` calls (email, password, passwordConfirmation, firstName, lastName, phoneNumber, and 3 error fields). Consolidate into a single `useState<FormState>` object so the form can be reset in one call and the field list is self-documenting.
