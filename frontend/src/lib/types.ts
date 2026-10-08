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
