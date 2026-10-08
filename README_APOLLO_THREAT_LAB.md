# Apollo Threat Lab — Android V1

Internal security testing utility for **Harmony Wellness Group**, designed to run
alongside the existing **Apollo Cyber Security Guard Dog** app. Threat Lab
generates *safe, controlled, manually‑initiated* network and browser activity so
Apollo can independently investigate it with Apollo's own protection mechanisms.

> **Honesty contract:** Threat Lab only reports its own network activity. It
> **never** fabricates an Apollo alert, threat classification, successful test or
> enforcement evidence. A completed request means traffic was sent — it is **not**
> an Apollo verdict. Apollo enforcement must be verified separately inside Apollo.

This is a **standalone** app. It does not touch, call, configure or impersonate
Apollo. No authentication, cloud database or backend is used — everything runs
locally on the device.

---

## The six tests

| # | Test | What it really does | Category | Runs immediately? |
|---|------|---------------------|----------|-------------------|
| 1 | **Phishing Link** | Opens a configurable, harmless demo phishing URL in the Android system browser. Records only that the link was *launched*. | Detection test (known test threat) | ✅ Yes (default: Google Safe Browsing test page) |
| 2 | **Malicious Domain** | Genuine Android system **DNS lookup** of a configured hostname via a native Kotlin module (`InetAddress.getAllByName`). Uses the device's normal network path. | Connectivity test (benign by default) | ✅ Yes (default: `example.com`; needs the built APK for the native module) |
| 3 | **Suspicious Connection** | Bounded HTTPS GET to a configured endpoint on the normal network path. | Connectivity test (benign by default) | ✅ Yes (default: `https://httpbin.org/get`) |
| 4 | **Redirect** | HTTPS GET that follows redirects and records the final URL. | Connectivity test | ✅ Yes (default: `https://httpbin.org/redirect/1`) |
| 5 | **Safe Traffic** | Normal HTTPS GET to `https://example.com` (negative control). | Negative control | ✅ Yes |
| 6 | **Stop Test** | Cancels the in‑app request in flight and prevents new ones. Clearly notes that an already‑launched browser action cannot be cancelled. | Control | ✅ Yes |

> **Ready out of the box:** all six tests ship with safe, working defaults — no
> manual configuration is required. Settings remains available to point any test
> at your own authorized destination.
>
> **Traffic ≠ threat:** the DNS/HTTPS defaults generate *benign connectivity*
> traffic and will not by themselves trigger Apollo's enforcement. Only the
> Phishing default is a known test threat. To reliably exercise Apollo's
> Growling/Barking/Biting you will set approved controlled threat‑test
> destinations in Settings once established (still local‑only, no backend).

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

## Configuration (Settings)
Editable, locally‑stored targets:
- Phishing Link URL (HTTPS)
- Malicious Domain hostname (bare hostname, authorized lab domain only)
- Suspicious Connection URL (HTTPS)
- Redirect URL (HTTPS)
- Safe Traffic URL (HTTPS)

Entries are validated. Blank Malicious Domain / Suspicious Connection → the test
shows **Setup required** until a valid target is saved.

## Local history
- Last **100** attempts stored on‑device (scenario, run ID, timestamp, target,
  outcome, duration, errors).
- **Clear History** and **Share as Text** (redacted report via Android Share).
- No cloud upload, analytics or background monitoring.

## Android permissions
Only `INTERNET` and `ACCESS_NETWORK_STATE`. No Accessibility, Device Admin, SMS,
contacts, root, system VPN or device‑monitoring permissions. No certificate
bypasses, no alternate tunnels/VPN/proxy.

---

## Building & installing the APK (Emergent Publish workflow)

The native Kotlin DNS module requires a real Android build — it is **not**
available in Expo Go or the web preview. Build the installable APK through
Emergent:

1. Press **Publish** (top‑right) in Emergent to deploy.
2. In the deployment panel, generate the **Android build** (provide the requested
   credentials). Emergent manages the Expo/EAS build pipeline — no local EAS CLI
   or Expo account setup is needed.
3. Download the generated **APK** and install it on the physical Android device
   that already has Apollo installed (enable "Install unknown apps" for your file
   manager/browser if prompted).

**App identifiers**
- Name: `Apollo Threat Lab`
- Android package: `com.harmonywellnessgroup.apollothreatlab`

## Testing alongside Apollo
1. Install both Apollo and Apollo Threat Lab on the same physical Android device.
2. In Threat Lab → **Settings**, set the authorized lab hostname (Malicious
   Domain) and approved endpoint (Suspicious Connection). Save.
3. Run each test one at a time and read the honest status/outcome in **Test
   Activity**.
4. **Separately** open Apollo and use its own UI/diagnostics to confirm whether
   Apollo observed, growled at, or enforced (bit) the activity. Threat Lab does
   **not** report Apollo's state.
5. Verify a controlled block is attributed to Apollo **only** when Apollo's own
   enforcement evidence supports it.

## Which scenarios run immediately vs. need setup
- **All six run immediately** with the shipped safe defaults.
- Settings is **optional** — use it only to point Malicious Domain / Suspicious
  Connection (or any test) at your own authorized destination, or at approved
  controlled threat‑test destinations when established.
- Native DNS still requires the built APK (the Kotlin module is not in Expo Go /
  web preview).

> ⚠️ **Not testable in Expo Go / web preview:** the native DNS lookup, external
> browser launch and Android Share require a built APK on a device. Web preview
> additionally blocks cross‑origin HTTPS GETs (CORS), so Safe/Suspicious/Redirect
> tests will honestly report `Failed` there — this is a preview limitation, not an
> app defect. On a real Android device these perform genuine network requests.

---

## Unit tests
Pure logic is covered by Jest tests (`yarn test`):
- Scenario selection & metadata
- Target validation (HTTPS / hostname)
- Availability → Setup required
- State transitions (one‑at‑a‑time, success / cancel / timeout / failure)
- Result classification **honesty** (no fabricated Apollo verdicts)
- Report export formatting

Run: `cd frontend && yarn test`

## Source layout
```
frontend/
  app/                 index.tsx (home), settings.tsx, history.tsx, _layout.tsx
  src/components/      scenario-card, status-pill, test-activity-panel
  src/lib/             scenarios, network, useTestRunner, config, history, report, types
  modules/apollo-dns/  local Kotlin Expo module for genuine Android system DNS
  __tests__/           unit tests
```

## Future platforms
V1 is intentionally standalone and modular so iOS, Windows and macOS executors
can be added later without reworking the core logic.
