# Apollo Threat Lab — Windows and macOS Implementation Recommendation
**Phase 2 Assessment | June 2026**

---

## 1. Current State

The existing Emergent project is an Expo SDK 57 / React Native 0.86.3 mobile
application targeting Android (complete) and iOS (Phase 2 in progress). Neither
Windows nor macOS desktop is a supported target in the current project.

The Phase 2 development approval asks for an evaluation of two approaches before
desktop implementation begins:

1. **React Native Windows / React Native macOS** (Microsoft-maintained extensions
   to the React Native framework).
2. **Tauri 2.x** (Rust backend + OS WebView frontend) as a lighter alternative.

Desktop implementation is NOT in scope for Phase 2. This document provides the
recommendation so the correct approach is chosen when desktop work begins.

---

## 2. Evaluation: React Native Windows / React Native macOS

### Overview
Microsoft maintains `react-native-windows` (WinUI 3) and `react-native-macos`
(AppKit/Catalyst) as separate npm packages alongside the core React Native
framework. A React Native app can be extended to support these platforms by adding
the packages and providing platform-specific native modules.

### What it enables
- Reuse of all React Native component code (`View`, `Text`, `Pressable`, `ScrollView`, etc.)
- Reuse of `StyleSheet.create` styles directly
- Reuse of `expo-router` navigation (partial — see limitations)
- Same `useTestRunner.ts`, `scenarios.ts`, `types.ts`, `report.ts` etc.

### Compatibility audit — current `package.json` dependencies

| Package | Windows support | macOS support |
|---|---|---|
| `react-native-windows` | ✅ (must add) | ❌ (different package) |
| `react-native-macos` | ❌ (different package) | ✅ (must add) |
| `expo-router` | ❌ No Windows/macOS target | ❌ No Windows/macOS target |
| `expo-haptics` | ❌ No Windows implementation | ⚠️ Partial via Catalyst |
| `expo-secure-store` | ❌ No Windows implementation | ⚠️ Keychain available |
| `expo-web-browser` | ❌ No Windows implementation | ✅ |
| `expo-linear-gradient` | ❌ No Windows implementation | ⚠️ May work |
| `react-native-keyboard-controller` | ❌ Not supported | ❌ Not supported |
| `react-native-safe-area-context` | ⚠️ Limited | ✅ |
| `@react-native-vector-icons/material-design-icons` | ⚠️ Not verified | ⚠️ Not verified |
| `react-native-gesture-handler` | ⚠️ Partial | ✅ |
| `react-native-reanimated` | ⚠️ Partial | ✅ |

**Incompatible packages requiring removal or substitution for Windows alone: 6+**

### Build tooling requirements
- **Windows:** Visual Studio 2022 with C++ and WinUI 3 workload, Windows SDK
  10.0.19041+, Node.js. Build time: 20–45 minutes for first build.
- **macOS:** Xcode with macOS target added. Build time similar to iOS.
- Neither is available in the standard Emergent Expo cloud environment. Desktop
  builds would require a Windows developer machine or a macOS machine with
  additional tooling beyond the iOS EAS build path.

### Native DNS module for Windows/macOS
- **Windows:** New C# module calling `System.Net.Dns.GetHostAddresses(hostname)`.
  Requires a new `windows/` directory in `modules/apollo-dns/`, a C#/C++ UWP
  Module class, and registration in `expo-module.config.json`.
- **macOS:** Swift module calling `getaddrinfo()` — structurally identical to the
  iOS Swift module already written. The same file can be targeted to macOS with
  a conditional build flag or a separate macOS-specific copy.

### Verdict
**High complexity. Not recommended as the primary desktop path** for the following reasons:
- `expo-router` has no Windows/macOS support, requiring navigation to be rebuilt.
- 6+ dependencies require replacement on Windows alone.
- Visual Studio toolchain is not available in the Emergent cloud environment.
- Two separate build processes (Windows and macOS) rather than one shared path.
- Windows support in React Native is substantially less mature than Android/iOS.

React Native Windows/macOS remains viable IF the priority is maximum component-code
reuse AND the team is willing to maintain a separate, complex Windows build environment.

---

## 3. Evaluation: Tauri 2.x

### Overview
Tauri 2.x (stable since late 2024) is a framework for building desktop
applications with a Rust backend and a native OS WebView for the UI layer.
The UI is standard web technologies (HTML/CSS/JS, React, Vue, etc.), not React Native.
Tauri bundles are typically 5–15 MB (no bundled Chromium engine — it uses the
OS-provided WebView: WKWebView on macOS, WebView2 on Windows).

### What it enables
- **Single codebase** for both Windows and macOS (and Linux).
- **Direct reuse of all pure TypeScript modules**: `scenarios.ts`, `types.ts`,
  `report.ts`, `history.ts`, `config.ts`, `async-abort.ts` — all pure TS with
  no React Native imports, importable directly into a React web frontend.
- **Rust backend** calls OS DNS APIs natively — not in a browser context, not
  CORS-limited. The network path is the OS's real resolver path.
- **Tauri IPC** replaces the expo-modules-core bridge: the JS frontend calls Rust
  commands via `invoke()` instead of native module bridges.
- Standard React (not React Native) for the UI — `div`, CSS, Tailwind, etc.

### Code reuse audit

| Module | Reusable in Tauri | Notes |
|---|---|---|
| `src/lib/scenarios.ts` | ✅ 100% | Pure TS, no RN imports |
| `src/lib/types.ts` | ✅ 100% | Pure TS |
| `src/lib/report.ts` | ✅ 100% | Pure TS |
| `src/lib/defaults.ts` | ✅ 100% | Pure TS |
| `src/lib/async-abort.ts` | ✅ 100% | Pure TS |
| `src/lib/history.ts` | ⚠️ 80% | Replace `@react-native-async-storage` with Tauri Store plugin |
| `src/lib/config.ts` | ⚠️ 80% | Replace storage layer |
| `src/lib/network.ts` | ⚠️ 50% | Replace native DNS bridge with Tauri `invoke("dns_lookup")` |
| `src/theme.ts` | ⚠️ 30% | Color tokens reusable; `StyleSheet.create` → CSS variables |
| `src/components/*.tsx` | ❌ 0% | React Native components → React DOM components + CSS |
| `app/*.tsx` screens | ❌ 0% | React Native layout → React DOM layout |
| `modules/apollo-dns/ios/` | ❌ 0% | Replaced by Rust Tauri command |
| `modules/apollo-dns/android/` | ❌ 0% | Replaced by Rust Tauri command |

**~55% of the codebase is directly reusable or requires minimal adaptation.**
The UI layer must be reimplemented, but its design (dark navy tokens, component
structure) is straightforward to reproduce in CSS.

### Rust DNS implementation
```rust
// src-tauri/src/lib.rs (simplified)
use std::net::ToSocketAddrs;

#[tauri::command]
fn dns_lookup(hostname: String) -> Result<DnsResult, String> {
    let start = std::time::Instant::now();
    let addr = format!("{}:0", hostname);
    match addr.to_socket_addrs() {
        Ok(addrs) => {
            let addresses: Vec<String> = addrs
                .map(|a| a.ip().to_string())
                .collect::<std::collections::HashSet<_>>()
                .into_iter()
                .collect();
            Ok(DnsResult {
                hostname,
                addresses,
                duration_ms: start.elapsed().as_secs_f64() * 1000.0,
            })
        }
        Err(e) => Err(format!("DNS resolution failed: {}", e)),
    }
}
```

`std::net::ToSocketAddrs` uses the OS's native resolver (`getaddrinfo` on macOS,
`getaddrinfo`/`WinSock` on Windows). This is the same OS resolver path that a
system VPN or DNS filter would intercept.

### Browser launch
Tauri's `tauri-plugin-opener` provides `open_url(url)` which calls the OS's
default browser handler — equivalent to `Linking.openURL` on mobile.

### Storage
Tauri's `tauri-plugin-store` provides a key-value store backed by a JSON file.
It replaces `@react-native-async-storage/async-storage` with minimal code change
to `history.ts` and `config.ts`.

### HTTP requests
Tauri's `tauri-plugin-http` provides `fetch()` from the Rust side, not the
WebView. Rust fetch requests go through the OS's native network stack (not
subject to browser CORS restrictions). This is the correct path for security
testing — the same path a desktop VPN or network filter would observe.

### Build tooling requirements
- **macOS:** Xcode Command Line Tools + Rust toolchain (via `rustup`). No full
  Xcode IDE required. Can potentially integrate with the Emergent macOS build runner.
- **Windows:** Visual Studio C++ Build Tools (lighter than full VS for React Native
  Windows) + Rust toolchain + WebView2 Runtime (shipped with Windows 10/11).
  Requires a Windows build machine; not available in Emergent cloud.
- **Single shared codebase** builds for both platforms from the same source tree.

### Security path on desktop
- **macOS:** A desktop VPN (or Apollo's macOS Network Extension, if it exists)
  would intercept `getaddrinfo` DNS calls from the Rust process, HTTPS requests
  from the Rust HTTP client, and browser traffic launched via `open_url`. This is
  equivalent to the iOS Network Extension path.
- **Windows:** Same — a WFP (Windows Filtering Platform) driver or VPN would
  intercept Rust process traffic.
- There is no "content blocker for a specific browser" concept on desktop; all
  network traffic from the process goes through the OS network stack.

### Verdict
**Recommended** as the desktop implementation path, subject to the following:

1. The UI layer requires reimplementation in React (not React Native) + CSS.
   This is an explicit tradeoff: less component-code reuse, but significantly
   lower build complexity and a single codebase for both Windows and macOS.
2. The pure-TS business logic is reused directly — the most important code.
3. No dependency on Microsoft's React Native extensions, which have lower
   community support and incomplete Expo compatibility.
4. The Rust DNS implementation provides native OS resolver access on both
   Windows and macOS without platform-specific native modules.

---

## 4. Comparison Table

| Criterion | React Native Windows/macOS | Tauri 2.x |
|---|---|---|
| Component code reuse | High (React Native components) | Low (must use React DOM) |
| Business logic reuse | High | High (same pure TS) |
| Build complexity | Very high (Visual Studio, WinUI 3) | Medium (Rust toolchain) |
| Single codebase for Win+Mac | ❌ Two packages | ✅ One codebase |
| expo-router compatibility | ❌ Not supported | N/A (own routing) |
| Expo package compatibility | Low (6+ broken) | N/A (own stack) |
| Binary size | Large (~100–200 MB) | Small (5–15 MB) |
| Native network path on desktop | ✅ Yes | ✅ Yes (Rust process) |
| Emergent cloud build support | ❌ No (needs Visual Studio) | macOS: maybe; Windows: no |
| Maturity for security apps | Low (Windows RN is experimental) | Medium (Tauri 2.0 stable) |

---

## 5. Minimum Work Estimate for Tauri Desktop

For a Threat Lab Tauri desktop app that achieves feature parity with the mobile version:

| Task | Estimated effort |
|---|---|
| New Tauri 2.x project with React frontend | Small |
| Copy and wire pure TS modules (scenarios, types, report, defaults, async-abort) | Small |
| Adapt history.ts and config.ts to Tauri Store plugin | Small |
| Implement Rust `dns_lookup` Tauri command | Small |
| Implement Rust `http_request` Tauri command (or use `tauri-plugin-http`) | Small |
| Implement dark navy CSS design system (from existing color tokens) | Medium |
| Reimplement 6 scenario cards in React DOM | Medium |
| Reimplement history and settings screens in React DOM | Medium |
| Windows build machine setup and testing | Medium |
| macOS build and notarization setup | Small |
| **Total** | **Medium — achievable in a dedicated phase** |

---

## 6. Recommendation Summary

| Decision | Recommendation |
|---|---|
| Desktop framework | **Tauri 2.x** |
| UI layer | React (not React Native) + CSS, using the same dark navy token values |
| Business logic | Reuse `scenarios.ts`, `types.ts`, `report.ts`, `defaults.ts`, `async-abort.ts` directly |
| DNS on desktop | Rust `std::net::ToSocketAddrs` (wraps OS `getaddrinfo`) |
| HTTP on desktop | `tauri-plugin-http` (Rust, not browser CORS-limited) |
| Browser launch | `tauri-plugin-opener` (`open::that(url)`) |
| Storage | `tauri-plugin-store` (JSON file, replaces AsyncStorage) |
| Scope | **Windows and macOS from a single Tauri project** |
| Phase | **After iOS V1 is validated on a physical device** |

Do not implement desktop during Phase 2. This recommendation provides the
foundation for a future Phase 3 desktop scope.
