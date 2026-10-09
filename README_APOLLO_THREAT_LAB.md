# Apollo Threat Lab — V1 (Android) + Phase 2 (iOS)

Internal security testing utility for **Harmony Wellness Group**, designed to run
alongside the existing **Apollo Cyber Security Guard Dog** app. Threat Lab
generates *safe, controlled, manually‑initiated* network and browser activity so
Apollo can independently investigate it with its own protection mechanisms.

> **Honesty contract:** Threat Lab only reports its own network activity. It
> **never** fabricates an Apollo alert, threat classification, successful test or
> enforcement evidence. A completed request means traffic was sent — it is **not**
> an Apollo verdict. Apollo enforcement must be verified separately inside Apollo.

This is a **standalone** app. It does not touch, call, configure or impersonate
Apollo. No authentication, cloud database or backend is used — everything runs
locally on the device.

---

## Platform Support

| Platform | Status | Native DNS module | Build target |
|---|---|---|---|
| **Android** | ✅ V1 Complete | Kotlin — `InetAddress.getAllByName` | APK via EAS |
| **iOS** | ✅ Phase 2 — code complete | Swift — POSIX `getaddrinfo(3)` | IPA via EAS |
| Windows | 🔵 Planned — Phase 3 | Rust / `ToSocketAddrs` (Tauri) | Tauri desktop |
| macOS | 🔵 Planned — Phase 3 | Rust / `getaddrinfo` (Tauri) | Tauri desktop |

---

## The Six Tests

| # | Test | What it really does | Category | Runs immediately? |
|---|------|---------------------|----------|-------------------|
| 1 | **Phishing Link** | Opens a configurable, harmless demo phishing URL in the device's system browser. Records only that the link was *launched*. | Detection test (known test threat) | ✅ Yes (default: Google Safe Browsing test page) |
| 2 | **Malicious Domain** | Genuine native system **DNS lookup** of a configured hostname via native module (`InetAddress.getAllByName` on Android; POSIX `getaddrinfo` on iOS). Uses the device's normal network path. | Connectivity test (benign by default) | ✅ Yes (default: `example.com` — requires built APK/IPA for the native module) |
| 3 | **Suspicious Connection** | Bounded HTTPS GET to a configured endpoint on the normal network path. | Connectivity test (benign by default) | ✅ Yes (default: `https://httpbin.org/get`) |
| 4 | **Redirect** | HTTPS GET that follows redirects and records the final URL. | Connectivity test | ✅ Yes (default: `https://httpbin.org/redirect/1`) |
| 5 | **Safe Traffic** | Normal HTTPS GET to `https://example.com` (negative control). | Negative control | ✅ Yes |
| 6 | **Stop Test** | Cancels the in‑app request in flight and prevents new ones. Clearly notes that an already‑launched browser action cannot be cancelled. | Control | ✅ Yes |

> **Ready out of the box:** all six tests ship with safe, working defaults — no
> manual configuration is required. Settings remains available to point any test
> at your own authorised destination.
>
> **Traffic ≠ threat:** the DNS/HTTPS defaults generate *benign connectivity*
> traffic and will not by themselves trigger Apollo's enforcement. Only the
> Phishing default is a known test threat. To reliably exercise Apollo's
> Growling/Barking/Biting you will set approved controlled threat‑test
> destinations in Settings once established.

**Truthful statuses only:** `Ready`, `Running`, `Completed`, `Failed`,
`Cancelled`, `Setup required`.

### Execution rules enforced
- Only **one** test runs at a time.
- Every test requires a **direct button press**.
- A hard **15s timeout** bounds every network request; no automatic retries or
  repeated traffic.
- Tests with no valid configured target report **Setup required** — never a fake
  success.
- A failed request, DNS NXDOMAIN, timeout or browser warning is **never** labelled
  "Apollo blocked the threat".

---

## iOS-Specific Verification Notes

### Native DNS
The iOS Swift module performs genuine `getaddrinfo(3)` resolution through the
device's OS resolver. This is the same resolver path that an Apollo DNS Proxy
Extension or Network Extension (Packet Tunnel Provider) intercepts.

**A Safari Content Blocker does NOT intercept native DNS calls from apps.**
If Apollo on iOS only provides a Safari Content Blocker, the Malicious Domain,
Suspicious Connection, Redirect and Safe Traffic tests are invisible to Apollo.

### Phishing Link on iOS
`Linking.openURL` hands the URL to the OS. If the device's default browser is
Safari, Apollo's Safari Content Blocker can potentially block the navigation. If
any other browser is the default (Chrome, Firefox, Brave), the Content Blocker
does not apply. A Network Extension provides full-device coverage regardless of
which browser is used.

### Native HTTPS requests on iOS
React Native's `fetch()` on iOS uses `URLSession` — not Safari, not WKWebView.
`URLSession` requests are only visible to Apollo if Apollo has an active Network
Extension (Packet Tunnel or Content Filter Provider). They are NOT seen by a
Safari Content Blocker.

Full analysis: see `/app/memory/apollo-protection-paths.md`

---

## iOS Signing and Build Prerequisites

To generate an iOS IPA:

1. **Apple Developer account** — a paid membership ($99/year) with the
   `com.harmonywellnessgroup.apollothreatlab` bundle ID registered.
2. **Distribution certificate** — managed by Emergent's EAS build pipeline; no
   manual certificate export is required.
3. **Provisioning profile** — Ad Hoc or App Store distribution, managed by EAS.
4. **Build trigger** — press **Publish** (top‑right) in Emergent, then select an
   iOS build. Emergent's EAS pipeline handles signing.

The iOS IPA cannot be validated in Expo Go or the web preview. Only a built IPA
installed on a physical iOS device with Apollo active can confirm the native DNS
module loads and executes correctly.

---

## Configuration (Settings)
Editable, locally‑stored targets (same on Android and iOS):
- Phishing Link URL (HTTPS)
- Malicious Domain hostname (bare hostname, authorised lab domain only)
- Suspicious Connection URL (HTTPS)
- Redirect URL (HTTPS)
- Safe Traffic URL (HTTPS)

Entries are validated. Blank Malicious Domain / Suspicious Connection → the test
shows **Setup required** until a valid target is saved.

## Local History
- Last **100** attempts stored on‑device (scenario, run ID, timestamp, target,
  outcome, duration, errors).
- **Clear History** and **Share as Text** (redacted report via system Share sheet).
- No cloud upload, analytics or background monitoring.

## Device Permissions
Only `INTERNET` and `ACCESS_NETWORK_STATE` on Android. No equivalent permissions
required on iOS for DNS lookups, HTTPS requests or browser launch. No Accessibility
Service, Device Admin, SMS, contacts, root, VPN or device‑monitoring permissions.
No certificate bypasses, alternate tunnels or proxy.

---

## Building and Installing

### Android APK (V1 — complete)
The native Kotlin DNS module requires a real Android build — it is **not**
available in Expo Go or the web preview.

1. Press **Publish** (top‑right) in Emergent to deploy.
2. In the deployment panel, generate the **Android build**. Emergent manages
   the EAS build pipeline — no local EAS CLI is needed.
3. Download the generated **APK** and install it on the physical Android device
   that already has Apollo installed (enable "Install unknown apps" if prompted).

**App identifiers**
- Name: `Apollo Threat Lab`
- Android package: `com.harmonywellnessgroup.apollothreatlab`

### iOS IPA (Phase 2 — code complete, requires EAS build)
The native Swift DNS module requires a real iOS build.

1. Press **Publish** in Emergent, then select an **iOS build**.
2. Provide Apple Developer credentials when prompted.
3. Download the generated **IPA** and install via TestFlight or direct Ad Hoc
   provisioning.
4. Install alongside Apollo on the same physical iOS device.

**App identifiers**
- iOS bundle ID: `com.harmonywellnessgroup.apollothreatlab`

---

## Testing Alongside Apollo

1. Install both Apollo and Apollo Threat Lab on the same physical device.
2. In Threat Lab → **Settings**, set the authorised lab hostname (Malicious
   Domain) and approved endpoint (Suspicious Connection). Save.
3. Run each test one at a time and read the honest status/outcome in **Test
   Activity**.
4. **Separately** open Apollo and use its own UI/diagnostics to confirm whether
   Apollo observed, growled at, or enforced (bit) the activity.

**A test is only verified as a Biting event when:**
- Threat Lab records a `Failed` or `Completed` outcome AND
- Apollo's own UI shows a matching enforcement event for the same destination at
  the same time AND
- The block was performed by Apollo's native extension (not by the browser's own
  Safe Browsing or the OS reporting a DNS lookup failure from the authoritative
  server).

---

## Android Physical-Device Acceptance Checklist

This checklist must be performed on a physical Android device with both Apollo
and Apollo Threat Lab (built APK) installed. Cloud/Expo Go testing cannot
substitute for physical-device acceptance.

- [ ] Apollo installed and its supported native protection is operational (VPN
      active, safe browsing enabled, or equivalent).
- [ ] Threat Lab APK installed alongside Apollo; both apps visible in the app drawer.
- [ ] **Safe Traffic Test:** runs, returns `Completed`, HTTP 200 from `example.com`.
      Apollo does not block `example.com`.
- [ ] **Phishing Link Test:** link launches in browser. Observe Apollo for Growling
      or Barking; Apollo's own UI must confirm any enforcement separately.
- [ ] **Malicious Domain Test:** native DNS lookup runs. If a controlled blocked
      domain is configured, confirm Apollo's DNS proxy returns NXDOMAIN
      (Threat Lab shows `Failed: DNS resolution failed`) AND Apollo's UI shows
      the event.
- [ ] **Suspicious Connection Test:** HTTPS request runs; `Completed` or `Failed`
      recorded honestly.
- [ ] **Stop Test:** with a test running, press Stop — outcome records `Cancelled`,
      no `Completed` is stored. Confirm browser-launched links cannot be recalled.
- [ ] **Timeout:** configure an unreachable endpoint, run a test, confirm
      `Failed` with "timed out" after 15s, no fabricated Apollo verdict.
- [ ] No fabricated Sniffing, Growling, Barking or Biting states appear in
      Threat Lab's outcomes.

---

## iOS Physical-Device Acceptance Checklist

Must be performed on a physical iOS device with the built IPA installed.

- [ ] IPA signed and installed via TestFlight or Ad Hoc profile.
- [ ] App launches successfully; dark navy theme renders correctly.
- [ ] **Safe Traffic Test:** `Completed`, HTTP 200.
- [ ] **Phishing Link Test:** Linking.openURL opens in the device's default
      browser; observe Apollo's response independently.
- [ ] **Malicious Domain Test (native DNS):** Swift module loads; test runs;
      outcome shows resolved addresses or honest failure. Does NOT fall back to
      `NATIVE_DNS_UNAVAILABLE` (which would indicate the native module is absent).
- [ ] **Suspicious Connection Test:** `URLSession`-backed HTTPS request completes.
- [ ] **Stop Test:** cancellation works; `Cancelled` outcome recorded.
- [ ] Apollo protection path observation: confirm Apollo's architecture on iOS
      (DNS Proxy Extension, Network Extension, or Safari Content Blocker) before
      claiming any Gate fired.

---

## What is NOT Testable in Expo Go or the Web Preview

| Feature | Expo Go | Web preview |
|---|---|---|
| Native DNS (Android Kotlin module) | ❌ | ❌ |
| Native DNS (iOS Swift module) | ❌ | ❌ |
| External browser launch (full Linking) | ⚠️ Limited | ⚠️ Limited |
| HTTPS network tests | ✅ (may show network errors) | ❌ CORS blocks cross-origin |
| Android Share sheet | ❌ | ❌ |
| iOS Share sheet | ❌ | ❌ |

The native DNS module is absent in Expo Go and web preview. Threat Lab reports
`NATIVE_DNS_UNAVAILABLE` honestly — this is expected, not a defect. Install the
built APK or IPA for full functionality.

---

## Unit Tests

Pure logic is covered by Jest tests (`cd frontend && yarn test`):
- Scenario selection and metadata
- Target validation (HTTPS / hostname)
- Availability → Setup required
- State transitions (one‑at‑a‑time, success / cancel / timeout / failure)
- Result classification honesty (no fabricated Apollo verdicts)
- Report export formatting and redaction

---

## Source Layout

```
frontend/
  app/                  index.tsx (home), settings.tsx, history.tsx, _layout.tsx
  src/components/       scenario-card, status-pill, test-activity-panel
  src/lib/              scenarios, network, useTestRunner, config, history,
                        report, types, defaults, async-abort, storage-keys
  modules/apollo-dns/
    android/            Kotlin Expo module — InetAddress.getAllByName
    ios/                Swift Expo module — POSIX getaddrinfo(3)    ← Phase 2
    expo-module.config.json  both platforms registered
    index.ts            JS bridge — graceful fallback if module absent

memory/
  apollo-protection-paths.md     Per-scenario Apollo Gate analysis (Android + iOS)
  windows-macos-recommendation.md  Tauri 2.x recommendation for Phase 3
  PRD.md                          Product Requirements Document
```

---

## Future Platforms (Phase 3)

Windows and macOS will be implemented using **Tauri 2.x** (Rust + OS WebView).
Pure TypeScript business logic (`scenarios.ts`, `types.ts`, `report.ts`, etc.)
will be reused directly. The UI will be reimplemented in React DOM + CSS. DNS
resolution will use a Rust Tauri command backed by `std::net::ToSocketAddrs`
(wraps OS `getaddrinfo`). Full recommendation: `/app/memory/windows-macos-recommendation.md`.
