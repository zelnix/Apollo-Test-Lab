// Pure default configuration (no storage import) so it is safe to use in unit
// tests and anywhere without pulling in native storage modules.

import { LabConfig } from "./types";

// Safe public defaults. Phishing uses Google's official Safe Browsing test
// page, which is purpose-built and harmless. Malicious Domain and Suspicious
// Connection are intentionally blank so they report "Setup required" until a
// tester supplies an authorized lab target.
export const DEFAULT_CONFIG: LabConfig = {
  phishingUrl: "https://testsafebrowsing.appspot.com/s/phishing.html",
  maliciousDomain: "",
  suspiciousUrl: "",
  redirectUrl: "https://httpbin.org/redirect/1",
  safeTrafficUrl: "https://example.com",
};
