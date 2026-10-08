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
};
