// Shared types for Apollo Threat Lab.

export type ScenarioId =
  | "phishing"
  | "malicious-domain"
  | "suspicious-connection"
  | "redirect"
  | "safe-traffic"
  | "stop";

// The only truthful execution statuses Threat Lab is allowed to show.
export type TestStatus =
  | "Ready"
  | "Running"
  | "Completed"
  | "Failed"
  | "Cancelled"
  | "Setup required";

export type ScenarioKind = "browser" | "dns" | "https" | "redirect" | "stop";

export type StatusAccent = "error" | "warning" | "success";

// What a test's traffic is intended to exercise. This is an honest description
// of the test's purpose/target — it is NOT a claim about what Apollo does.
//   detection    = default target is a known test threat (e.g. Safe Browsing demo)
//   connectivity = benign traffic that verifies DNS/HTTPS on the device path
//   control      = negative control (ordinary, expected-successful traffic)
//   action       = an app control, not network traffic (Stop)
export type TestCategory = "detection" | "connectivity" | "control" | "action";

export type LabConfig = {
  phishingUrl: string;
  maliciousDomain: string; // bare hostname for DNS lookup, may be ""
  suspiciousUrl: string; // https endpoint, may be ""
  redirectUrl: string;
  safeTrafficUrl: string;
};

export type Scenario = {
  id: ScenarioId;
  label: string;
  description: string;
  icon: string; // MaterialDesignIcons glyph name
  accent: StatusAccent;
  kind: ScenarioKind;
  category: TestCategory;
  configKey: keyof LabConfig | null;
};

export type TestActivity = {
  scenarioId: ScenarioId | null;
  scenarioLabel: string;
  startTime: string | null; // ISO
  destination: string;
  status: TestStatus;
  elapsedMs: number;
  outcome: string;
};

export type HistoryEntry = {
  id: string; // unique local run id
  scenarioId: ScenarioId;
  scenarioLabel: string;
  startTime: string; // ISO
  destination: string;
  status: TestStatus;
  elapsedMs: number;
  outcome: string;
  error?: string;
};
