# Research: User Registration

**Phase**: 0 | **Plan**: [plan.md](./plan.md) | **Date**: 2026-02-06

## Findings

---

### R-001: KeyboardAvoidingView Pattern for Multi-Field Forms

**Question**: What is the correct pattern for making a 6-field form fully accessible when the on-screen keyboard is open, on both iOS and Android (AC-009 / Constitution Principle VI)?

**Decision**: Wrap form content inside `LinearGradient` using `KeyboardAvoidingView` (flex: 1) → `ScrollView` (flexGrow: 1, `keyboardShouldPersistTaps="handled"`) → `Card`.

**Rationale**:
- `KeyboardAvoidingView` with `Platform.select({ ios: 'padding', android: 'height' })` adjusts the view's bottom when the keyboard appears, preventing fields from being hidden. Using `Platform.select` (not raw `Platform.OS` string check) is required by Principle VI.
- `ScrollView` with `flexGrow: 1` ensures the card remains centered on tall screens but becomes scrollable on short screens (4-inch requirement in SC-004).
- `keyboardShouldPersistTaps="handled"` ensures tapping outside a text input dismisses the keyboard without accidentally triggering a button press.
- `LinearGradient` retains `flex: 1` but `justifyContent: 'center'` and `padding` move to the `ScrollView`'s `contentContainerStyle` so the gradient fills the screen correctly.

**Alternatives considered**:
- `KeyboardAvoidingView` alone without `ScrollView`: rejected — on small screens (4 inches) the bottom fields still fall behind the keyboard even after adjustment.
- `ScrollView` alone without `KeyboardAvoidingView`: rejected — on iOS the keyboard overlays the form without any offset adjustment.

**Implementation pattern**:
```tsx
<LinearGradient colors={[...]} style={styles.gradient}>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.select({ ios: 'padding', android: 'height' })}
  >
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.card}>
        {/* form fields */}
      </Card>
    </ScrollView>
  </KeyboardAvoidingView>
</LinearGradient>

// styles:
gradient: { flex: 1 },                               // remove justifyContent/padding from here
scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.md },
```

---

### R-002: Login Navigation from Registration Screen

**Question**: `router.back()` is used on the "Already have an account? Log in" link. Is this reliable (AC-008)?

**Decision**: Replace `router.back()` with `router.push('/login')`.

**Rationale**:
- `router.back()` only works if there is a previous route in the navigation stack. If a user deep-links directly to `/signup` (or the stack is otherwise empty), `router.back()` does nothing, leaving the user stranded on the registration screen.
- `router.push('/login')` explicitly navigates to the login screen regardless of stack history, satisfying AC-008 unconditionally.
- `router.replace('/login')` would also work but `push` preserves the back gesture for users who want to return to signup, which is better UX.

**Alternatives considered**:
- `router.replace('/login')`: would prevent back navigation to signup; rejected in favor of `push` for better UX.
- Keep `router.back()`: rejected — fails the "Independent Test" for US3 when launched without navigation history.

---

### R-003: Email Format Validation (Edge Case)

**Question**: The spec edge case asks "What happens when the user submits with an email that has no @ symbol?" The functional requirements (FR-001–FR-009) do not include a client-side email format requirement. How should this be handled?

**Decision**: Rely on server-side validation; surface the error via the existing `Alert` in the `catch` block.

**Rationale**:
- No functional requirement mandates client-side email format validation — the spec lists it only as an edge case to consider.
- The Rails API will reject a malformed email with a validation error, which propagates through RTK Query as `error.data.error` and is shown via `Alert.alert('Signup Failed', ...)`.
- Adding client-side email regex introduces maintenance overhead (edge cases in RFC 5322 are notoriously complex) without a corresponding FR.
- This behavior satisfies the edge case acceptably — the user sees a clear error message and can correct their input.

**Alternatives considered**:
- Add `keyboardType="email-address"` heuristic check: already in place; doesn't validate format.
- Add `/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)` guard: not required by any FR; deferred to a future iteration if user research shows drop-off from this edge case.

---

### R-004: Empty Phone Number — Alert vs. Inline Error Consistency

**Question**: Current code shows an `Alert` for empty phone (FR-002 path) and an inline error for invalid-format phone (FR-004 path). Is this consistent with the spec?

**Decision**: Keep current behavior. Alert for empty (FR-002) is acceptable; inline for format error (FR-004) is required.

**Rationale**:
- FR-002 says "user is prompted to fill all fields" — an `Alert` satisfies this.
- FR-004 explicitly requires an inline error message "directly below the phone field."
- The current code shows a consolidated Alert for all empty-field violations (first name, last name, email, password, confirm password, phone), which is consistent with FR-002.
- Changing empty-phone to an inline error would add inconsistency with the other empty-field handling (which use Alert). No FR requires inline empty-field errors.

**Alternatives considered**:
- Inline errors for all empty fields: better UX in general but not required by this spec; deferred.

---

### R-005: Current Implementation Coverage vs. Spec

**Summary of what is already implemented in `app/signup.tsx`**:

| Requirement | Status | Notes |
|---|---|---|
| FR-001: 6 fields in order | ✅ Done | First Name, Last Name, Email, Phone, Password, Confirm Password |
| FR-002: All fields required | ✅ Done | Alert for empty; phone has additional inline path |
| FR-003: Phone strips non-allowed chars | ✅ Done | `handlePhoneChange` strips `/[^\d\s\-\(\)\+]/g` |
| FR-004: Phone 10–15 digit inline error | ✅ Done | `validatePhone` + `phoneError` state |
| FR-005: Password match inline error | ✅ Done | `confirmError` state below confirm field |
| FR-006: Auto-auth on success | ✅ Done | JWT stored in SecureStore after `result.token` |
| FR-007: Redirect to home | ✅ Done | `router.replace('/home')` |
| FR-008: Log in link → login screen | ❌ Gap | `router.back()` — must be `router.push('/login')` |
| FR-009: Keyboard accessible | ❌ Gap | No `KeyboardAvoidingView` or `ScrollView` |

**Net work required**: 2 targeted changes to `app/signup.tsx` (T001, T002).
