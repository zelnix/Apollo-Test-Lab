# Apollo Threat Lab — Apollo Protection Path Analysis
**Version:** Phase 2 | **Date:** June 2026

---

## 1. How Apollo Can Observe Device Traffic — Architecture Background

Before mapping each test scenario to an Apollo Gate, it is necessary to understand
the possible observation mechanisms available on each platform. The architecture
Apollo uses determines whether any given scenario can enter a protection path at all.

### Android Observation Mechanisms

| Mechanism | What it observes | Threat Lab traffic affected |
|---|---|---|
| **VPN Service (Android VPN API)** | All TCP/UDP traffic from all apps, via a local TUN interface | DNS queries, HTTPS connections, browser traffic — all observable |
| **DNS-over-VPN (local DNS proxy inside VPN)** | DNS queries only, re-routed through the VPN tunnel | Malicious Domain (DNS test) observable |
| **Accessibility Service** | UI events only | Not relevant for network traffic |
| **Device Policy (MDM)** | Certificate installation, proxy rules | Could affect TLS inspection |

If Apollo on Android uses a VPN Service, every network request Threat Lab makes
passes through Apollo's TUN interface. Apollo can inspect, allow, or block any
connection at the TCP/IP level. This is the most complete protection path and the
one most Android security apps use.

### iOS Observation Mechanisms

| Mechanism | What it observes | Threat Lab traffic affected |
|---|---|---|
| **Network Extension — Packet Tunnel Provider** | All TCP/UDP, via a VPN tunnel (equivalent to Android VPN Service) | DNS queries, HTTPS connections, browser traffic — all observable |
| **Network Extension — DNS Proxy Extension** | DNS queries only (system-wide, all apps) | Malicious Domain (DNS test) observable; HTTP/HTTPS connections NOT intercepted |
| **Network Extension — Content Filter Provider** | HTTP/HTTPS content inspection (requires Apple entitlement) | HTTPS connections from all apps potentially observable |
| **Safari Content Blocker** | Safari browser navigations ONLY — purely declarative, no network packets seen | ONLY the Phishing Link test when opened in Safari; all native HTTP requests and all DNS tests are invisible to this mechanism |
| **On-device ML / Behavioral Analysis** | App behaviour patterns, not individual network packets | Indirect; not a reliable test path |

**Critical iOS distinction:**
A Safari Content Blocker is the most common "lightweight" iOS security extension.
It operates entirely within Safari's rendering engine and never sees:
- Native HTTPS requests made by apps (including React Native's `fetch()`)
- Programmatic DNS lookups from native code (`getaddrinfo`, `InetAddress`)
- Traffic from any browser other than Safari

If Apollo on iOS only has a Safari Content Blocker (and no Network Extension),
then five of the six Threat Lab tests are completely invisible to Apollo on iOS.
Only the Phishing Link test — if and only if the device's default browser is
Safari — could reach Apollo's Safari Content Blocker.

**Do not claim full-device protection path coverage on iOS unless Apollo has a
confirmed operational Network Extension (Packet Tunnel Provider, DNS Proxy
Extension, or Content Filter Provider).**

---

## 2. Apollo's Gate Model

Based on the "Guard Dog" naming convention and the five-gate model:

| Gate | Interpretation | Network function |
|---|---|---|
| **Sniffing** | Passive traffic observation — Apollo has seen the packet/request | Traffic enters Apollo's inspection path |
| **Patrolling** | Active analysis — Apollo is classifying the observed content | Threat classification running against the traffic |
| **Growling** | Warning state — traffic matches a suspicious pattern | Preliminary match, not yet a confirmed block |
| **Barking** | Alert state — a threat has been identified | Definitive match; enforcement decision pending |
| **Biting** | Enforcement — Apollo has actively blocked or terminated the connection | Connection terminated, DNS response altered, browser navigation blocked |

**Gate progression requires prior gate(s) to have fired.** Biting without Sniffing
is not authentic enforcement evidence — it means the test app, not Apollo, caused
the failure. This distinction is fundamental to what Threat Lab measures.

---

## 3. Per-Scenario Protection Path Analysis

### Scenario 1 — Phishing Link Test

| Attribute | Detail |
|---|---|
| **Mechanism** | `Linking.openURL(url)` → hands the URL to the OS → system browser launched |
| **Intended gate** | Growling → Barking → Biting |
| **Automatic or manual?** | Automatic (if Apollo's browser protection is active); manual observation in Apollo's UI |
| **Default target** | `https://testsafebrowsing.appspot.com/s/phishing.html` (Google Safe Browsing demo) |

**Android protection path:**
- If Apollo has a VPN Service: the browser's DNS query AND HTTPS connection pass through the VPN tunnel. Apollo can observe the SNI (`testsafebrowsing.appspot.com`) and the full URL path. A domain/URL blocklist match can trigger Biting (connection terminated or redirected to a block page).
- If Apollo has Safe Browsing integration: the URL hash may match Apollo's blocklist before the connection is made.
- **Threat Lab cannot confirm:** whether Apollo saw the navigation, which gate fired, or whether the browser displayed a warning vs a block page. This must be confirmed inside Apollo.

**iOS protection path:**
- If Apollo has a **Network Extension (Packet Tunnel Provider or Content Filter Provider)**: the browser's HTTPS connection is observable. Growling → Biting is possible.
- If Apollo has a **DNS Proxy Extension**: Apollo sees the DNS query for `testsafebrowsing.appspot.com` and can block at the DNS level (NXDOMAIN or redirect IP). However, if the IP is cached or the browser uses its own DNS-over-HTTPS, this may be bypassed.
- If Apollo has **only a Safari Content Blocker**: The content blocker CAN block this navigation — but ONLY if the device's default browser is Safari. No other browser (Chrome, Firefox, Brave) is covered by a Safari Content Blocker. There is no way for Threat Lab to confirm which browser handled the link.
- **Limitation on iOS:** Threat Lab calls `Linking.openURL` and has no knowledge of which browser opened the link. If Safari is not the default browser, a Safari Content Blocker provides no protection for this test.

**What genuine Biting evidence looks like:**
- Android: The browser displays Apollo's block page, or Apollo's app UI shows an enforcement event for the URL.
- iOS (Content Blocker): Safari shows a "This page has been blocked" message from Apollo.
- iOS (Network Extension): The connection fails with a network error, or Apollo's app UI shows an enforcement event.
- **A browser warning issued by the browser itself (Chrome's Safe Browsing, Safari's Fraudulent Website Warning) is NOT Apollo enforcement.** These are independent browser controls.

---

### Scenario 2 — Malicious Domain Test (DNS)

| Attribute | Detail |
|---|---|
| **Mechanism** | Native `getaddrinfo(hostname)` via OS system resolver (Kotlin on Android, Swift on iOS) |
| **Intended gate** | Sniffing → Biting (DNS-level block) |
| **Automatic or manual?** | Automatic — if Apollo's DNS protection path is active, DNS queries are intercepted without any user action |
| **Default target** | `example.com` (benign — only exercises the DNS path, not a threat trigger by default) |

**Android protection path:**
- If Apollo has a VPN Service with DNS proxy: DNS query for the configured hostname passes through Apollo's resolver. Apollo can return NXDOMAIN (causing the native lookup to fail) or return a block page IP. Both are observable in Threat Lab's outcome text.
- A `Failed` result with "DNS resolution failed" + message like "NXDOMAIN" or a resolved IP pointing to Apollo's block server are both valid Biting signals.
- The default `example.com` will NOT trigger Apollo enforcement — it is a benign control. To test blocking, configure a domain that Apollo actually recognises as malicious.

**iOS protection path:**
- If Apollo has a **DNS Proxy Extension**: ALL system DNS queries (from all apps) are intercepted. `getaddrinfo("hostname")` from Threat Lab's Swift module will pass through Apollo's DNS Proxy. Biting = DNS query returns NXDOMAIN or a block IP.
- If Apollo has a **Network Extension (Packet Tunnel)**: DNS is routed through the VPN tunnel and intercepted the same way.
- If Apollo has **only a Safari Content Blocker**: **This test is completely invisible to Apollo on iOS.** Safari Content Blockers do not intercept programmatic DNS calls from native apps. `getaddrinfo` bypasses content blockers entirely.
- **Limitation:** A DNS lookup failure is ambiguous on both platforms. It may be caused by: the hostname not existing (NXDOMAIN from the authoritative server), no network connectivity, Apollo blocking, or a resolver timeout. Threat Lab cannot attribute a DNS failure to Apollo without Apollo's own confirmation.
- **A successful DNS resolution does NOT mean Apollo allowed it.** It may mean Apollo is not intercepting DNS at all.

**What genuine Biting evidence looks like:**
- The DNS lookup returns `Failed` AND Apollo's app UI shows a DNS block event for the queried hostname at approximately the same time.
- OR: The DNS lookup resolves to an IP address that belongs to Apollo's block page server (not the legitimate address). This can be confirmed by comparing with a known-good resolver.

---

### Scenario 3 — Suspicious Connection Test

| Attribute | Detail |
|---|---|
| **Mechanism** | `fetch(url, { method: 'GET', signal })` — React Native's native HTTP stack |
| **Intended gate** | Sniffing → Patrolling → (Growling → Biting if target is threat-listed) |
| **Automatic or manual?** | Automatic (if Apollo's network inspection is active) |
| **Default target** | `https://httpbin.org/get` (benign — connectivity verification only) |

**Android protection path:**
- React Native's `fetch()` on Android goes through `OkHttp`, which uses the Android network stack. If Apollo has a VPN, the TCP connection for `httpbin.org:443` is routed through the VPN tunnel. Apollo can see the TLS SNI (`httpbin.org`) and terminate the connection (causing `fetch` to throw) or allow it.
- The default `httpbin.org/get` is benign and will not trigger Apollo. To test blocking, configure an HTTPS endpoint that Apollo recognises as a threat in Settings.
- **CORS note:** In the web preview context, `fetch` fails due to CORS — this is a browser restriction, NOT Apollo enforcement.

**iOS protection path:**
- React Native's `fetch()` on iOS goes through `URLSession`. If Apollo has a **Network Extension (Packet Tunnel or Content Filter Provider)**, the TCP/TLS connection is observable.
- If Apollo has **only a DNS Proxy Extension**: Apollo sees the DNS query for the endpoint's hostname but NOT the HTTPS request body or response. Sniffing at DNS level only; TCP connection is not filtered.
- If Apollo has **only a Safari Content Blocker**: **This test is completely invisible to Apollo on iOS.** `URLSession` requests from React Native are not Safari navigations.
- **Limitation:** A `fetch` failure is ambiguous — it could be a server timeout, CORS, TLS error, network issue, or Apollo blocking. None of these can be reliably attributed to Apollo without Apollo's own UI confirming it.

**What genuine Biting evidence looks like:**
- The fetch returns `Failed` AND Apollo's app shows a blocked connection event for the target hostname at the same time.
- OR: The HTTP response status is unexpected (e.g., Apollo returns a block page — HTTP 200 with Apollo's page content instead of the expected response). Threat Lab records the actual HTTP status and response bytes, which can help distinguish this.

---

### Scenario 4 — Redirect Test

| Attribute | Detail |
|---|---|
| **Mechanism** | `fetch(url, { redirect: 'follow', signal })` — follows redirect chain, records final URL |
| **Intended gate** | Sniffing on both the initial request and each redirect target |
| **Automatic or manual?** | Automatic |
| **Default target** | `https://httpbin.org/redirect/1` (benign, redirects to `httpbin.org/get`) |

**Android and iOS protection path:**
Same analysis as Scenario 3 (Suspicious Connection). The key additional behaviour is that Apollo has an opportunity to Sniff and potentially Bite on EACH hop in the redirect chain, not just the initial URL. If Apollo terminates the connection mid-redirect, `fetch` throws and Threat Lab records `Failed` with the network error.

**Limitation:**
- The final URL recorded by Threat Lab is the URL from the last HTTP response. If Apollo blocks mid-chain, Threat Lab records `Failed` with no final URL — it does not know at which redirect hop Apollo intervened.
- The redirect target `httpbin.org/get` is benign. To test mid-chain blocking, configure a redirect URL that points to a threat-test endpoint.

**What genuine Biting evidence looks like:**
Same as Scenario 3. Apollo's UI should show the blocked URL (either the initial or a redirect target).

---

### Scenario 5 — Safe Traffic Test (Negative Control)

| Attribute | Detail |
|---|---|
| **Mechanism** | `fetch("https://example.com")` — ordinary HTTPS GET |
| **Intended gate** | None expected; this is the negative control |
| **Automatic or manual?** | Automatic — expects `Completed` with no Apollo intervention |
| **Default target** | `https://example.com` |

**Purpose:** Verifies that Apollo is NOT over-blocking legitimate traffic. If this test returns `Failed`, it is a potential false-positive signal in Apollo that warrants investigation.

**Android and iOS:** `example.com` is IANA-maintained and is universally benign. No security product should block it. If Apollo blocks `example.com`, that is a defect in Apollo's blocklist or configuration.

**What a passing result looks like:** `Completed`, HTTP 200, response body contains the IANA example page HTML. Duration is typically under 1s on a healthy connection.

**What a failure here means:** NOT Apollo working correctly — investigate Apollo's active blocklists and rule configuration.

---

### Scenario 6 — Stop Test

| Attribute | Detail |
|---|---|
| **Mechanism** | `AbortController.abort()` — cancels in-flight Threat Lab request |
| **Intended gate** | None — this is a Threat Lab in-app control, not a network test |
| **Automatic or manual?** | Manual (user presses Stop) |

**There is no Apollo Gate interaction.** Stop Test exercises Threat Lab's own cancellation mechanism. It verifies:
1. An in-flight `fetch()` is terminated before it completes.
2. The DNS lookup result (if it arrives after abort) is discarded and not recorded as `Completed`.
3. The outcome string correctly says "cancelled by user — no network outcome was recorded."

**Limitation on browser tests:** If a Phishing Link was already launched to the browser, Stop Test CANNOT cancel it. The browser has received the URL and opened it independently of Threat Lab. This is documented in the outcome text.

---

## 4. iOS-Specific Verification Limitations Summary

| Test | Safari Content Blocker | DNS Proxy Extension | Network Extension (Full VPN) |
|---|---|---|---|
| Phishing Link (Safari as default browser) | ✅ Possible to observe and block | ✅ DNS-level observation | ✅ Full observation |
| Phishing Link (non-Safari default browser) | ❌ Not observable | ✅ DNS-level only | ✅ Full observation |
| Malicious Domain (native DNS) | ❌ Not observable | ✅ Observable and blockable | ✅ Observable and blockable |
| Suspicious Connection (native HTTPS) | ❌ Not observable | ⚠️ DNS only (not TCP) | ✅ Observable and blockable |
| Redirect (native HTTPS) | ❌ Not observable | ⚠️ DNS only (not TCP) | ✅ Observable and blockable |
| Safe Traffic (native HTTPS) | ❌ Not observable | ⚠️ DNS only (not TCP) | ✅ Observable and blockable |
| Stop Test | N/A | N/A | N/A |

**Do NOT claim Apollo observed or blocked a test on iOS based solely on a `Failed` result unless:**
1. Apollo has a confirmed, operational Network Extension or DNS Proxy Extension on the device.
2. Apollo's own UI shows a matching enforcement event with a timestamp aligned to the test run.

---

## 5. Evidence Requirements for Biting Verification

A "Biting" claim is only valid if ALL of the following are true:

1. **Threat Lab records the test run** — the scenario ran and Threat Lab generated a `Failed` or `Completed` outcome.
2. **Apollo's own UI shows an enforcement event** — not inferred from the Threat Lab result, but independently confirmed inside Apollo's alerts or event log.
3. **The timestamps match** — Apollo's event corresponds to the same time window as the Threat Lab test run (use the Run ID and `startTime` from Threat Lab's History screen).
4. **The target matches** — Apollo's event identifies the same destination (hostname or URL) as the configured Threat Lab target.
5. **The mechanism is authentic** — the block was performed by Apollo's native extension (VPN termination, DNS NXDOMAIN, content filter response), not by the browser's own Safe Browsing or the OS reporting no network.

A `Failed` result in Threat Lab alone is **NOT** evidence of Biting. It is evidence that a network operation did not complete. The failure may have nothing to do with Apollo.

---

## 6. Scenarios Currently Unverifiable Without Physical-Device Testing

| Scenario | Reason not cloud-verifiable |
|---|---|
| All six | Cloud/CI environment has no physical device with Apollo installed |
| Malicious Domain (DNS) — Apollo blocking | Requires Apollo's DNS Proxy Extension active + a domain Apollo actually blocks |
| Phishing Link — Apollo blocking | Requires Apollo's browser protection active + browser opened on device |
| Suspicious Connection — Apollo blocking | Requires Apollo's Network Extension + a URL Apollo blocks |
| iOS native DNS module load | Requires an EAS-built iOS IPA installed on a physical iOS device |
| iOS browser launch (Safari vs others) | Requires device to determine which browser handles `Linking.openURL` |

Physical-device testing must be conducted by the Harmony Wellness Group security team
with Apollo and Threat Lab both installed and operational.
