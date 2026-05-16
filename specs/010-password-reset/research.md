# Research: 010 — Password Reset

## Decision 1: Use existing custom token system (not Devise `:recoverable`)

**Decision:** Build on the project's existing `password_reset_token` / `password_reset_sent_at` columns and `generate_password_reset_token!` / `password_reset_expired?` model methods.

**Why:** The Rails backend already has a working custom token implementation. Switching to Devise `:recoverable` would require a migration (new columns, unique index), changes to the User model, and reworking the existing model methods — all to end up with equivalent functionality.

**Alternatives considered:**
- **Devise `:recoverable`**: Mature, well-tested, adds `reset_password_token` + `reset_password_sent_at` columns via migration. Key methods: `User.send_reset_password_instructions(email:)`, `User.with_reset_password_token(token)`, `user.reset_password(pw, pw_confirmation)`. Default expiry: 6 hours. Rejected because the project already has equivalent custom infrastructure.
- **OTP/6-digit code**: Simpler UX (no email-app switching), but requires short expiry (10–15 min), brute-force protection, and a separate `otp` field. Also weakens entropy (20-bit code vs 132-bit token). Rejected because the existing `SecureRandom.urlsafe_base64` token is already strong and the deep-link scheme is already registered.

**Existing token details:**
- Token: `SecureRandom.urlsafe_base64` (~22 chars, ~132 bits entropy) — sufficient
- Expiry: 2 hours (hardcoded in `password_reset_expired?`) — reasonable for MVP
- Column indexed: yes (unique index already present)

---

## Decision 2: Deep link via existing `vitalforgemobilev1://` scheme

**Decision:** Use the existing Expo deep-link scheme (`vitalforgemobilev1`) already registered in `app.json`. Email link format: `vitalforgemobilev1://reset-password?token=<token>`.

**Why:** Expo Router 6 handles deep links automatically from the registered scheme — a URL `vitalforgemobilev1://reset-password?token=xxx` routes directly to `app/reset-password.tsx` with the token available via `useLocalSearchParams()`. No additional `expo-linking` configuration needed beyond the already-present `scheme` key.

**Alternatives considered:**
- **Universal links (HTTPS)**: `https://forge-fitness-journal.app/reset-password?token=xxx`. More robust (some email clients strip custom schemes), but requires hosting an `apple-app-site-association` file and `assetlinks.json`, plus a domain verification step. Overkill for MVP; can be added later.
- **Manual `expo-linking` + navigation**: Use `Linking.addEventListener` in `_layout.tsx` and parse URLs manually. Not needed — Expo Router 6 handles this automatically.

**Email client compatibility note:** Some email clients (notably Gmail mobile) sandbox custom URL scheme links. For MVP this is acceptable. If compatibility issues arise post-launch, migrate to universal links.

---

## Decision 3: Custom mobile controller (not Devise controller)

**Decision:** Add `Api::V1::Mobile::PasswordResetsController` with two actions. The controller uses the existing User model methods directly.

**Why:** Devise's built-in `PasswordsController` is designed for web (session auth, CSRF, HTML responses). The mobile namespace already has custom controllers that skip CSRF and return JSON — this fits the same pattern.

**Controller shape:**

```ruby
# POST /api/v1/mobile/auth/forgot_password
# Body: { email: "user@example.com" }
def create
  user = User.find_by(email: params[:email].to_s.downcase.strip)
  user&.generate_password_reset_token!
  UserMailer.password_reset(user).deliver_later if user
  render json: { message: "If that address is registered, a reset link is on its way." }, status: :ok
end

# POST /api/v1/mobile/auth/reset_password
# Body: { token, password, password_confirmation }
def update
  user = User.find_by(password_reset_token: params[:token])
  if user.nil? || user.password_reset_expired?
    render json: { error: "Reset link is invalid or has expired." }, status: :unprocessable_entity
    return
  end
  if user.update(password: params[:password], password_confirmation: params[:password_confirmation])
    user.update_columns(password_reset_token: nil, password_reset_sent_at: nil)
    render json: { message: "Password updated successfully." }, status: :ok
  else
    render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
  end
end
```

---

## Decision 5: SMTP provider — SendGrid, send from own domain

**Decision:** SendGrid for transactional email. Reset emails sent from `noreply@forge-fitness-journal.app` (or `support@forge-fitness-journal.app`).

**Why:** Free trial, then $20/month (Essentials). Simple Rails SMTP integration (`smtp.sendgrid.net:587`, API key as password). Widely documented for Rails.

**Domain authentication (required for deliverability):**
Sending from your own domain instead of a SendGrid-owned address prevents spam folder delivery. Requires one-time DNS setup:
1. Create a SendGrid account → Settings → Sender Authentication → Domain Authentication
2. SendGrid generates CNAME records (for DKIM) and an SPF record
3. Add those records to your domain's DNS (wherever `forge-fitness-journal.app` is registered)
4. SendGrid verifies → emails sent as `noreply@forge-fitness-journal.app` with valid DKIM signature

This is a one-time setup (30–60 min), not code work.

**Rails credential storage:**
```bash
rails credentials:edit
# Add:
# sendgrid:
#   api_key: SG.xxxxxxxxxxxxxxxx
```

**`config/environments/production.rb`:**
```ruby
config.action_mailer.delivery_method = :smtp
config.action_mailer.smtp_settings = {
  address: 'smtp.sendgrid.net',
  port: 587,
  authentication: :plain,
  user_name: 'apikey',
  password: Rails.application.credentials.dig(:sendgrid, :api_key)
}
config.action_mailer.default_url_options = { host: 'forge-fitness-journal.app', protocol: 'https' }
```

**`app/mailers/application_mailer.rb` (add default from):**
```ruby
class ApplicationMailer < ActionMailer::Base
  default from: 'VitalForge <noreply@forge-fitness-journal.app>'
  layout 'mailer'
end
```

**Alternatives considered:**
- **Mailgun**: 5,000 emails/month free, similar setup. Slightly more complex domain auth UI. Good second choice.
- **AWS SES**: Cheapest at scale but requires IAM setup, sandbox approval, more ops overhead. Post-MVP option.

---

## Decision 4: Security posture

- **Forgot password response is always identical** regardless of whether email is found — prevents user enumeration
- **Token cleared immediately** after successful reset — prevents token reuse
- **Expiry enforced server-side** before accepting a reset
- **HTTPS enforced** in staging/production — token in URL is acceptable (short-lived, cleared on use)
- **Rate limiting**: not in scope for MVP; Rack::Attack can be added as a follow-up
