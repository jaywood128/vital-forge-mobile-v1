# Mobile Backlog

Items that need investigation, design, or planning before implementation.

---

## CI/CD Pipeline Quality Gates

**Priority:** Medium
**Type:** Research / Infrastructure

Research and document what should be added to the GitHub Actions pipeline for PRs on this repo. At minimum cover:

- **Test runner** — run `npx jest --no-coverage` on every PR; fail the build if any test fails
- **TypeScript type-check** — `npx tsc --noEmit` to catch type errors not caught by the test suite
- **Linter** — `npm run lint` (ESLint with Expo flat config) as a required check
- **Code coverage threshold** — decide a minimum coverage % and enforce it (Jest `--coverage --coverageThreshold`)
- **EAS Build smoke test** — investigate whether a development build can be triggered on PR to catch native/bundler issues before merge
- **Dependency audit** — `npm audit` or a tool like `socket.dev` to flag new vulnerable dependencies introduced in a PR
- **Bundle size tracking** — Expo/Metro bundle size diff to catch accidental large imports
- **E2E / Detox** — evaluate whether Detox (or Maestro) automated UI tests are worth adding given the Expo Go constraint; document trade-offs
- **PR size check** — optional: warn when a PR diff exceeds a threshold to encourage smaller PRs

For each item, document: what it catches, estimated setup effort, and whether it should be a required check or advisory only.

---

## App Distribution — Personal Device & App Store

**Priority:** High (personal device), Low (App Store)
**Type:** Research / Infrastructure

### Phase 1 — Get the app on your gym phone without Expo Go or the App Store

Research and pick the right option for solo/personal use:

- **EAS Build + Internal Distribution** — build a signed `.ipa` (iOS) or `.apk` (Android) via Expo's cloud build service (`eas build --profile preview`), download directly to device via a QR code link; no TestFlight or Play Store needed; free tier available, paid for faster builds
- **TestFlight (iOS)** — Apple's official beta channel; requires Apple Developer account ($99/yr); distribute to up to 10,000 testers; app stays on device without Expo Go; likely the right long-term "personal + friends" path
- **Internal App Sharing (Android)** — Google Play Console lets you upload an APK/AAB and share a direct install link with specific accounts; no review, near-instant
- **Ad-hoc distribution (iOS)** — register device UDIDs in the Apple Developer portal, build an ad-hoc profile; works without TestFlight but is device-count limited and fiddly

Document: Apple Developer account cost, EAS Build free tier limits, and which option requires the least ongoing maintenance for a solo developer.

### Phase 2 — App Store / Play Store release

- **EAS Submit** — automates upload to App Store Connect and Google Play after an EAS Build; research what metadata, screenshots, and review prep is needed
- **App Store Connect setup** — app ID, bundle ID, provisioning profiles, privacy policy requirement
- **Google Play Console setup** — app signing, release tracks (internal → closed → open → production)
- **Review guidelines** — flag any features (auth, health data, payments) that need extra review justification

---
