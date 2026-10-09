// Pure, framework-free logic for Apollo Threat Lab. Everything here is safe to
// unit test with no React Native runtime. It contains scenario metadata,
// target validation, availability, status-transition rules, result
// classification and formatting helpers.

import { LabConfig, Scenario, ScenarioId, TestCategory, TestStatus } from "./types";

export const TEST_TIMEOUT_MS = 15000;
export const MAX_HISTORY = 100;

export const SCENARIOS: Scenario[] = [
  {
    id: "phishing",
    label: "Phishing Link Test",
    description: "Open a harmless demo phishing URL in browser.",
    icon: "link-variant",
    accent: "error",
    kind: "browser",
    category: "detection",
    configKey: "phishingUrl",
  },
  {
    id: "malware-url",
    label: "Malware URL Test",
    description: "Open a harmless malware-category test URL in browser.",
    icon: "bug-outline",
    accent: "error",
    kind: "browser",
    category: "detection",
    configKey: "malwareUrl",
  },
  {
    id: "malicious-domain",
    label: "Malicious Domain Test",
    description: "Resolve a configured domain through a real native system DNS lookup.",
    icon: "web",
    accent: "warning",
    kind: "dns",
    category: "connectivity",
    configKey: "maliciousDomain",
  },
  {
    id: "suspicious-connection",
    label: "Suspicious Connection Test",
    description: "Run a bounded HTTPS request to a configured endpoint.",
    icon: "transit-connection-variant",
    accent: "warning",
    kind: "https",
    category: "connectivity",
    configKey: "suspiciousUrl",
  },
  {
    id: "redirect",
    label: "Redirect Test",
    description: "Follow a safe redirect chain and record the outcome.",
    icon: "arrow-decision",
    accent: "warning",
    kind: "redirect",
    category: "connectivity",
    configKey: "redirectUrl",
  },
  {
    id: "unencrypted-http",
    label: "Unencrypted HTTP Test",
    description: "Send a plain HTTP request to test the cleartext-traffic gate.",
    icon: "lock-open-variant-outline",
    accent: "warning",
    kind: "http",
    category: "connectivity",
    configKey: "httpUrl",
  },
  {
    id: "malware-download",
    label: "EICAR Download Test",
    description: "Fetch the EICAR test file over HTTPS to exercise content inspection.",
    icon: "file-alert-outline",
    accent: "error",
    kind: "eicar",
    category: "detection",
    configKey: "eicarUrl",
  },
  {
    id: "bad-certificate",
    label: "Bad Certificate Test",
    description: "Connect to an endpoint with an expired TLS certificate.",
    icon: "certificate-outline",
    accent: "error",
    kind: "bad-cert",
    category: "detection",
    configKey: "badCertUrl",
  },
  {
    id: "safe-traffic",
    label: "Safe Traffic Test",
    description: "Send normal HTTPS traffic to example.com.",
    icon: "shield-check",
    accent: "success",
    kind: "https",
    category: "control",
    configKey: "safeTrafficUrl",
  },
  {
    id: "stop",
    label: "Stop Test",
    description: "Cancel current in-app test activity.",
    icon: "stop-circle",
    accent: "error",
    kind: "stop",
    category: "action",
    configKey: null,
  },
];

// Honest, short label + helper for each test category. Describes the test's
// intent/target only — never a claim about Apollo's behaviour.
export const CATEGORY_META: Record<
  TestCategory,
  { label: string; tone: "warning" | "info" | "success" | "muted"; blurb: string }
> = {
  detection: {
    label: "Detection test",
    tone: "warning",
    blurb:
      "Default target is a known test threat (a Safe Browsing demo page) meant to be recognised by browser/Apollo rules.",
  },
  connectivity: {
    label: "Connectivity test",
    tone: "info",
    blurb:
      "Benign traffic to a reachable service. Verifies DNS/HTTPS on the device path; does not by itself trigger Apollo enforcement.",
  },
  control: {
    label: "Negative control",
    tone: "success",
    blurb: "Ordinary traffic expected to succeed. A success here is never a threat.",
  },
  action: {
    label: "Control",
    tone: "muted",
    blurb: "An app control, not network traffic.",
  },
};

export function getScenario(id: ScenarioId): Scenario {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown scenario: ${id}`);
  return s;
}

// --- Target validation ------------------------------------------------------

export function isValidHttpsUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  if (/\s/.test(v)) return false;
  // Require https scheme and at least one host character.
  return /^https:\/\/[^\s/$.?#][^\s]*$/i.test(v) || /^https:\/\/[a-z0-9.-]+(:\d+)?(\/[^\s]*)?$/i.test(v);
}

// Accepts any http:// or https:// URL. Used for the unencrypted-HTTP test
// where the http:// scheme is intentional.
export function isValidAnyUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  if (/\s/.test(v)) return false;
  return /^https?:\/\/[^\s/$.?#][^\s]*$/i.test(v);
}

export function isValidHostname(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  if (v.length === 0 || v.length > 253) return false;
  if (/\s/.test(v)) return false;
  // Reject anything that looks like a URL/scheme.
  if (v.includes("/") || v.includes(":")) return false;
  return /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(v);
}

// --- Availability -----------------------------------------------------------

// true = a valid target exists (Ready). false = Setup required.
export function getScenarioAvailability(config: LabConfig): Record<ScenarioId, boolean> {
  return {
    phishing: isValidHttpsUrl(config.phishingUrl),
    "malware-url": isValidHttpsUrl(config.malwareUrl),
    "malicious-domain": isValidHostname(config.maliciousDomain),
    "suspicious-connection": isValidHttpsUrl(config.suspiciousUrl),
    redirect: isValidHttpsUrl(config.redirectUrl),
    "unencrypted-http": isValidAnyUrl(config.httpUrl),
    "malware-download": isValidHttpsUrl(config.eicarUrl),
    "bad-certificate": isValidHttpsUrl(config.badCertUrl),
    "safe-traffic": isValidHttpsUrl(config.safeTrafficUrl),
    stop: true,
  };
}

export function isScenarioReady(config: LabConfig, id: ScenarioId): boolean {
  return getScenarioAvailability(config)[id];
}

// --- State transitions ------------------------------------------------------

// Only one test runs at a time: a new run can start only when not Running.
export function canStart(current: TestStatus): boolean {
  return current !== "Running";
}

export function resolveTerminalStatus(opts: {
  userCancelled: boolean;
  timedOut: boolean;
  failed: boolean;
}): TestStatus {
  if (opts.userCancelled) return "Cancelled";
  if (opts.timedOut) return "Failed";
  if (opts.failed) return "Failed";
  return "Completed";
}

// --- Destinations -----------------------------------------------------------

export function getDestination(id: ScenarioId, config: LabConfig): string {
  switch (id) {
    case "phishing":
      return config.phishingUrl;
    case "malware-url":
      return config.malwareUrl;
    case "malicious-domain":
      return config.maliciousDomain;
    case "suspicious-connection":
      return config.suspiciousUrl;
    case "redirect":
      return config.redirectUrl;
    case "unencrypted-http":
      return config.httpUrl;
    case "malware-download":
      return config.eicarUrl;
    case "bad-certificate":
      return config.badCertUrl;
    case "safe-traffic":
      return config.safeTrafficUrl;
    case "stop":
      return "";
  }
}

// --- Formatting -------------------------------------------------------------

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatClock(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, { hour12: false });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
