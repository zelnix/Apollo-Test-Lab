// Pure default configuration (no storage import) so it is safe to use in unit
// tests and anywhere without pulling in native storage modules.

import { LabConfig } from "./types";

// Safe public defaults. Every test ships Ready to run out of the box — no
// manual configuration is required for ordinary testing.
//
// IMPORTANT (honesty): generating traffic is not the same as generating a
// detectable threat. The Phishing default is a purpose-built Safe Browsing demo
// page (a known test threat). The DNS / HTTPS / redirect defaults are BENIGN
// connectivity traffic to reachable public services — they verify networking on
// the device's normal path but do not by themselves trigger Apollo enforcement.
// Approved controlled threat-test destinations can be set later in Settings.
export const DEFAULT_CONFIG: LabConfig = {
  phishingUrl: "https://testsafebrowsing.appspot.com/s/phishing.html",
  maliciousDomain: "example.com",
  suspiciousUrl: "https://httpbin.org/get",
  redirectUrl: "https://httpbin.org/redirect/1",
  safeTrafficUrl: "https://example.com",
  // ── NEW (Phase 2 additional scenarios) ──────────────────────────────────────
  // Malware URL: Google Safe Browsing malware-category test page (not phishing).
  // Distinct gate: URL/Web Gate malware category vs phishing social-engineering.
  malwareUrl: "https://testsafebrowsing.appspot.com/s/malware.html",
  // EICAR: Industry-standard harmless test file served over HTTPS.
  // Exercises the content-inspection gate (signature analysis of downloaded bytes).
  eicarUrl: "https://secure.eicar.org/eicar.com.txt",
  // HTTP: Intentionally unencrypted. neverssl.com is maintained specifically to
  // remain on plain HTTP (no TLS redirect) for captive-portal and protocol testing.
  httpUrl: "http://neverssl.com",
  // Bad certificate: badssl.com is an industry-standard TLS test infrastructure.
  // expired.badssl.com has a genuinely expired certificate, causing a TLS error.
  badCertUrl: "https://expired.badssl.com/",
};
