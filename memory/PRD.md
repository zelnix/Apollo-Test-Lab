# PRD — Apollo Threat Lab (Android V1)

## Original problem statement
Build a standalone, installable Android app "Apollo Threat Lab" for Harmony
Wellness Group — an internal security testing utility used alongside the
existing Apollo Cyber Security Guard Dog app. It generates safe, controlled,
manually‑initiated network/browser activity so Apollo can independently
investigate it. React Native + Expo + TypeScript. Native Kotlin DNS module.
Local only: no auth, no cloud DB, no backend. One dark‑navy screen with 6 tests,
a live Test Activity panel, a Settings screen (editable, locally stored HTTPS
URLs/hostnames), and local Test History (last 100, Clear + Share). Must be
strictly honest: never fabricate success or an Apollo verdict.

## Architecture
- **Frontend only**, Expo Router (`app/index.tsx`, `app/settings.tsx`,
  `app/history.tsx`, `app/_layout.tsx`). No FastAPI/Mongo backend used.
- **Theme:** dark navy tokens in `src/theme.ts` (forced single scheme).
- **Core logic (pure, unit‑tested):** `src/lib/scenarios.ts` (metadata,
  validation, availability, state transitions, formatting), `src/lib/report.ts`
  (honest outcome/report builders), `src/lib/defaults.ts`.
- **Runtime:** `src/lib/useTestRunner.ts` (single‑test state machine, 15s
  timeout, AbortController cancel), `src/lib/network.ts` (real fetch + DNS),
  `src/lib/config.ts` + `src/lib/history.ts` (local storage via
  `@/src/utils/storage`).
- **Native module:** `modules/apollo-dns/` — local Kotlin Expo module performing
  genuine Android system DNS (`InetAddress.getAllByName`); absent in Expo Go/web
  (reported honestly).
- **Components:** `scenario-card`, `status-pill`, `test-activity-panel`.
- **Icons:** `@react-native-vector-icons/material-design-icons` (dynamic font
  loading via expo-font).

## User personas
- **Security tester / internal QA** at Harmony Wellness Group validating Apollo's
  protection on a physical Android device.

## Core requirements (static)
- 6 tests: Phishing Link, Malicious Domain (native DNS), Suspicious Connection,
  Redirect, Safe Traffic, Stop.
- Truthful statuses only: Ready, Running, Completed, Failed, Cancelled, Setup
  required.
- One test at a time; manual press; 15s timeout; no auto‑retry.
- Unconfigured targets → Setup required (never fake success).
- Never fabricate/inject/impersonate an Apollo event; no Apollo endpoints,
  config changes or elevated permissions.
- Permissions: INTERNET + ACCESS_NETWORK_STATE only.
- Local history (last 100) with Clear + redacted Share; no cloud/analytics.

## Implemented (2026-06)
- [x] Full dark‑navy UI matching the supplied concept (home, settings, history).
- [x] All 6 scenarios with real device networking (fetch) + external browser
      (Linking) + native DNS module bridge with honest fallback.
- [x] Single‑test state machine with timeout + user cancellation (Stop).
- [x] Settings with live validation + local persistence; Setup‑required gating.
- [x] Local history (cap 100), Clear (with confirm modal), Share as text report.
- [x] Honesty contract enforced in all outcome/report text.
- [x] 27 Jest unit tests passing (scenario selection, validation, availability,
      state transitions, timeout/cancel/failure classification, report export).
- [x] Frontend testing agent: 9/9 acceptance criteria passed.
- [x] Deliverable docs: `/app/README_APOLLO_THREAT_LAB.md` (APK build/install +
      which scenarios run immediately vs need setup).

## Known runtime boundaries
- Native DNS, external browser launch, Android Share require the built APK on a
  device (not Expo Go / web). Web preview also blocks cross‑origin HTTPS (CORS),
  so network tests honestly report `Failed` there — expected, not a defect.
- Physical‑device acceptance has NOT been claimed as passed; it must be performed
  by the tester with the installed APK alongside Apollo.

## Phase 2 — iOS (June 2026)

### Implemented
- [x] `modules/apollo-dns/ios/ApolloDnsModule.swift` — Swift DNS module using
      POSIX `getaddrinfo(3)` with AF_UNSPEC (IPv4+IPv6), background queue via
      expo-modules-core AsyncFunction, honest failure propagation.
- [x] `expo-module.config.json` updated — `"platforms": ["android", "ios"]`;
      `ios.modules: ["ApolloDnsModule"]` registered.
- [x] Platform-neutral text across the codebase.
- [x] `apollo-protection-paths.md` — per-scenario Apollo Gate analysis.
- [x] `windows-macos-recommendation.md` — Tauri 2.x recommendation.
- [x] `README_APOLLO_THREAT_LAB.md` — Phase 2 update.
- [x] **Phase 2 Additional Scenarios** — 4 new test buttons added for missing gates:
  - `malware-url` (browser, detection): Opens `testsafebrowsing.appspot.com/s/malware.html` — exercises URL/Browser malware gate, distinct from phishing.
  - `malware-download` / EICAR (eicar kind, detection): HTTPS GET to `secure.eicar.org/eicar.com.txt` — exercises content-inspection gate; detects whether EICAR signature was blocked.
  - `unencrypted-http` (http kind, connectivity): Plain HTTP GET to `neverssl.com` — exercises cleartext/protocol gate. Requires `usesCleartextTraffic:true` (Android) / `NSAllowsArbitraryLoads:true` (iOS).
  - `bad-certificate` (bad-cert kind, detection): HTTPS GET to `expired.badssl.com` — exercises TLS/certificate gate; expected failure is a TLS error reported honestly with gate-specific context.
- [x] New `isValidAnyUrl` validator (accepts both http:// and https://) for HTTP test field.
- [x] `buildFailureOutcome` enhanced with TLS error keyword detection for contextual bad-cert messages.
- [x] `executeScenario` refactored: all cases now use `getDestination` generically.
- [x] Settings: 9 configurable fields (was 5); `anyurl` FieldKind added.
- [x] `app.json`: `usesCleartextTraffic:true` + `NSAllowsArbitraryLoads:true`.
- [x] Unit tests updated: scenario count assertion 6→10; availability + category tests cover all 10.
- [x] All 41 unit tests pass.

### Physical-device acceptance status
- Android V1: **Implementation complete; physical-device testing pending** (must
  be conducted by Harmony Wellness Group with both Apollo and Threat Lab APK).
- iOS Phase 2: **Code complete; EAS iOS build required; physical-device testing
  pending** (requires Apple Developer account and iOS device with Apollo).

### Known runtime boundaries (updated)
- Native DNS (Android + iOS), external browser launch and device Share require
  the built APK / IPA respectively. Expo Go and web preview: `NATIVE_DNS_UNAVAILABLE`
  reported honestly.
- iOS Safari Content Blocker does NOT intercept native `fetch()` or `getaddrinfo`
  from Threat Lab. Full Apollo protection path coverage on iOS requires a Network
  Extension (Packet Tunnel Provider or DNS Proxy Extension).
- Physical-device Biting verification must be confirmed in Apollo's own UI with
  a matching timestamp and destination; Threat Lab `Failed` alone is not evidence.

## Backlog / Phase 3+
- **P1:** Per‑scenario configurable timeout; copy‑to‑clipboard for a single
  history entry.
- **P2:** Export history as a file (not just share text); light theme variant.
- **P3:** Windows and macOS via Tauri 2.x (recommendation complete in
  `windows-macos-recommendation.md`).

## Next tasks
- Trigger EAS iOS build via Emergent Publish (requires Apple Developer credentials).
- Confirm iOS native DNS module loads on a physical iOS device.
- Conduct Android V1 physical-device acceptance alongside Apollo.
- Conduct iOS Phase 2 physical-device acceptance alongside Apollo.
