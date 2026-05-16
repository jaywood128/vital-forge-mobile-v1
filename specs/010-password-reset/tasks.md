# Tasks: 010 — Password Reset

**Input**: `specs/010-password-reset/` (plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md)
**Branch**: `010-password-reset`
**Repos touched**: `vital-forge-mobile-v1` (mobile) + `vital-forge-v1` (backend)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Wire up shared plumbing both repos need before any screen or endpoint can be built.

- [ ] T001 [P] Update `vital-forge-v1/app/mailers/application_mailer.rb` — set `default from: 'VitalForge <noreply@forge-fitness-journal.app>'`
- [ ] T002 [P] Add two password reset routes to `vital-forge-v1/config/routes.rb` mobile namespace: `post 'forgot_password'` → `password_resets#create` and `post 'reset_password'` → `password_resets#update`
- [ ] T003 [P] Add `useForgotPasswordMutation` and `useResetPasswordMutation` RTK Query mutations to `vital-forge-mobile-v1/src/features/auth/authApi.ts` with explicit TypeScript response types
- [ ] T004 [P] Register `forgot-password` and `reset-password` in the Stack navigator in `vital-forge-mobile-v1/app/_layout.tsx` with `headerShown: false`
- [ ] T005 [P] Fix `password_reset_expired?` nil guard in `vital-forge-v1/app/models/user.rb` — change to `password_reset_sent_at.nil? || password_reset_sent_at < 2.hours.ago`
- [ ] T006 [P] Extend `vital-forge-mobile-v1/src/components/ui/TextField.tsx` with an optional `rightIcon` prop — accepts a `ReactNode`, renders it inside the input row on the right side. Update `src/components/ui/index.ts` export.

**Checkpoint**: Routes exist, RTK mutations typed, screens registered, nil guard patched, TextField extended. No UI yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend controller skeleton and email infrastructure.

- [ ] T007 Create `vital-forge-v1/app/controllers/api/v1/mobile/password_resets_controller.rb` — inherits from `ApplicationController`, skips authentication, placeholder `create` and `update` actions returning `head :ok`
- [ ] T008 [P] Create `vital-forge-v1/app/mailers/user_mailer.rb` — `UserMailer < ApplicationMailer` with `password_reset(user)` action that builds deep-link URL `vitalforgemobilev1://reset-password?token=#{user.password_reset_token}` and sets subject "Reset your VitalForge password"
- [ ] T009 [P] Create `vital-forge-v1/app/views/user_mailer/password_reset.html.erb` — simple branded HTML email: heading, one sentence, one deep-link button, VitalForge footer with physical address (CAN-SPAM)

**Checkpoint**: `rails routes | grep password` shows two routes. `UserMailer.password_reset(user).deliver_now` sends to MailCatcher in dev.

---

## Phase 3: US1 — Request a Password Reset Email (P1) 🎯 MVP

**Goal**: User enters their email on a Forgot Password screen and receives a reset email. Always returns the same response regardless of whether the email exists.

**Independent Test**: Submit a registered email → MailCatcher (localhost:1025) receives email with `vitalforgemobilev1://reset-password?token=...` link. Submit an unregistered email → same success message, no email sent.

### Tests — US1

- [ ] T010 [P] [US1] Create `vital-forge-mobile-v1/__tests__/screens/forgot-password.test.tsx`:
  - renders email input and "Send Reset Link" button
  - button is disabled and shows loading indicator while mutation is in-flight
  - shows success message after submit regardless of whether email exists
  - shows inline error and re-enables button on network failure
  - "Back to login" link navigates to `/login`
  - `it.todo`: `// TODO: test keyboard dismisses on submit — requires KeyboardAvoidingView interaction`

### Implementation — US1

- [ ] T011 [US1] Implement `create` action in `vital-forge-v1/app/controllers/api/v1/mobile/password_resets_controller.rb` — find user by email (case-insensitive), call `generate_password_reset_token!` and `UserMailer.password_reset(user).deliver_now` only if found, always render `{ message: "If that address is registered, a reset link is on its way." }` status 200
- [ ] T012 [US1] Create `vital-forge-mobile-v1/app/forgot-password.tsx` — `Screen` wrapper, `KeyboardAvoidingView` (Platform.select padding/height), `TextField` for email, `Button` primary "Send Reset Link", success state, inline error state, "Back to login" Pressable. Uses `useForgotPasswordMutation`.
- [ ] T013 [P] [US1] Add "Forgot your password?" `Pressable` link to `vital-forge-mobile-v1/app/login.tsx` — below login button, navigates to `/forgot-password`

**Checkpoint**: Tap "Forgot your password?" → enter email → MailCatcher shows email with deep link. Wrong email → same success message.

---

## Phase 4: US2 — Set a New Password via Deep Link (P1)

**Goal**: User taps deep link, lands on Reset Password screen, sets a new password with client-side validation, navigated to login with success banner.

**Independent Test**: Open `vitalforgemobilev1://reset-password?token=<valid_token>` → enter matching passwords ≥8 chars → tap Reset Password → login screen shows "Password updated — please log in" → log in with new password → success.

### Tests — US2

- [ ] T014 [P] [US2] Create `vital-forge-mobile-v1/__tests__/screens/reset-password.test.tsx`:
  - renders two password fields with secureTextEntry and show/hide toggle each
  - submit button disabled when fields are empty
  - shows inline error "Password must be at least 8 characters" when password < 8 chars
  - shows inline error "Passwords do not match" when confirmation differs
  - does NOT call the mutation when client-side validation fails
  - calls `resetPassword` mutation with `{ token, password, password_confirmation }` on valid submit
  - navigates to `/login` with `resetSuccess: '1'` param on success
  - shows inline expired/invalid error and "Request a new link" button on 422
  - button re-enables and fields preserve values on network error
  - `it.todo`: `// TODO: test show/hide toggle changes secureTextEntry prop`
  - `it.todo`: `// TODO: test missing token param redirects to /forgot-password on mount`

### Implementation — US2

- [ ] T015 [US2] Implement `update` action in `vital-forge-v1/app/controllers/api/v1/mobile/password_resets_controller.rb` — find user by `password_reset_token`, guard nil/expired (clear token on expiry), call `user.update(password:, password_confirmation:)`, clear token columns on success, return 200 or 422
- [ ] T016 [US2] Create `vital-forge-mobile-v1/app/reset-password.tsx` — reads `token` from `useLocalSearchParams<{ token: string }>()`, `KeyboardAvoidingView`, two `TextField` components using the new `rightIcon` prop with `Ionicons` `eye`/`eye-off` show/hide toggle, client-side validation (min 8 chars + match) with inline errors under each field, `Button` primary "Reset Password", loading/expired states. Uses `useResetPasswordMutation`.
- [ ] T017 [P] [US2] Update `vital-forge-mobile-v1/app/login.tsx` — read `resetSuccess` from `useLocalSearchParams()`, render a one-time success banner ("Password updated — please log in") in `colors.success` when param is present

**Checkpoint**: Full happy path end-to-end. Expired token shows error. Client-side validation blocks short/mismatched passwords.

---

## Phase 5: US3 — Guard Against Missing Token (P1)

**Goal**: Navigating to `/reset-password` with no token param redirects cleanly — no broken screen.

**Independent Test**: Navigate to `/reset-password` with no params → immediately redirects to `/forgot-password`. No UI flash.

### Implementation — US3

- [ ] T018 [US3] Add mount guard to `vital-forge-mobile-v1/app/reset-password.tsx` — `useEffect` with `[token]` dep: if `!token` call `router.replace('/forgot-password')` immediately. Render `null` until token confirmed present.

**Checkpoint**: All three user stories independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T019 [P] Add `SENDGRID_API_KEY` environment variable to Railway dashboard for the backend service
- [ ] T020 [P] Verify SendGrid domain authentication shows green badge — send a test reset email end-to-end in staging
- [x] T021 Run full test suite `npx jest --no-coverage --forceExit` in `vital-forge-mobile-v1` — all tests green
- [x] T022 Run `npm run lint` in `vital-forge-mobile-v1` — zero errors

---

## Dependencies & Execution Order

- **Phase 1**: No dependencies — all [P], run in parallel
- **Phase 2**: Depends on T001+T002 — T008 and T009 can run in parallel after T007
- **Phase 3**: Depends on Phase 2 — T010 and T013 can run in parallel; T011 sequential
- **Phase 4**: Depends on Phase 3 — T014 and T017 can run in parallel; T015 sequential
- **Phase 5**: Depends on T016 (reset-password.tsx must exist)
- **Phase 6**: Depends on all stories complete

---

## Total Task Count: 22 tasks

| Phase | Tasks |
|-------|-------|
| Phase 1 Setup | 6 (all parallel) |
| Phase 2 Foundational | 3 |
| Phase 3 US1 | 4 (1 test + 3 impl) |
| Phase 4 US2 | 4 (1 test + 3 impl) |
| Phase 5 US3 | 1 |
| Phase 6 Polish | 4 |
