// Pure text builders for live outcomes and the shareable report. Framework
// free and unit-testable. Every message is deliberately honest: a completed,
// failed, timed-out or cancelled network result is NEVER described as an Apollo
// verdict. Apollo enforcement can only be confirmed inside Apollo itself.

import { TEST_TIMEOUT_MS } from "./scenarios";
import { HistoryEntry, Scenario } from "./types";

const APOLLO_DISCLAIMER =
  "This is a network result only — it is not evidence that Apollo allowed or blocked anything. Verify Apollo separately in the Apollo app.";

export function buildBrowserOutcome(url: string): string {
  return `Requested the Android browser to open ${url}. Threat Lab only launched the link; it cannot confirm the page loaded or that Apollo inspected it. ${APOLLO_DISCLAIMER}`;
}

export function buildDnsOutcome(hostname: string, addresses: string[], durationMs: number): string {
  const ips = addresses.length ? addresses.join(", ") : "(no addresses)";
  return `DNS resolved ${hostname} to ${ips} in ${Math.round(durationMs)}ms via the Android system resolver. ${APOLLO_DISCLAIMER}`;
}

export function buildHttpOutcome(httpStatus: number, finalUrl: string, bytes: number, durationMs: number): string {
  return `HTTP ${httpStatus} from ${finalUrl} • ${bytes} bytes • ${durationMs}ms. A completed request means traffic was sent and a response returned. ${APOLLO_DISCLAIMER}`;
}

export function buildRedirectOutcome(httpStatus: number, finalUrl: string, durationMs: number): string {
  return `Followed redirects to ${finalUrl} • HTTP ${httpStatus} • ${durationMs}ms. Final URL recorded from the network response. ${APOLLO_DISCLAIMER}`;
}

export function buildSetupOutcome(): string {
  return "Setup required — add a valid target for this test in Settings before running it.";
}

export function buildCancelledOutcome(): string {
  return "Test cancelled by user before completion. No network outcome was recorded.";
}

export function buildTimeoutOutcome(): string {
  return `Request timed out after ${Math.round(TEST_TIMEOUT_MS / 1000)}s. A timeout can be caused by an offline network, a slow endpoint or a block — Threat Lab cannot attribute it to Apollo. ${APOLLO_DISCLAIMER}`;
}

export function buildFailureOutcome(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg === "NATIVE_DNS_UNAVAILABLE") {
    return "Native DNS module is not available in this runtime (Expo Go and the web preview do not include it). Install the built Android APK to perform real Android system DNS lookups.";
  }
  return `Request failed: ${msg}. A failed request (offline, DNS NXDOMAIN, TLS error, or enforcement) is a network result only and is NOT by itself evidence that Apollo enforced anything. ${APOLLO_DISCLAIMER}`;
}

export function buildStopIdleOutcome(): string {
  return "No in-app test is currently running. Note: a link already handed to the Android browser cannot be cancelled by Threat Lab.";
}

// Redacted, human-readable text report for Android Share. Local only.
export function buildReport(entries: HistoryEntry[]): string {
  const header = [
    "APOLLO THREAT LAB — Test Activity Report",
    "Internal Test Utility • Harmony Wellness Group",
    `Generated: ${new Date().toISOString()}`,
    `Attempts recorded: ${entries.length}`,
    "",
    "NOTE: Statuses describe Threat Lab's own network activity. They are NOT",
    "Apollo security verdicts. Apollo enforcement must be verified in Apollo.",
    "",
    "----------------------------------------",
  ];
  const body = entries.map((e, i) => {
    return [
      `${i + 1}. ${e.scenarioLabel}`,
      `   Run ID    : ${e.id}`,
      `   Time      : ${e.startTime}`,
      `   Target    : ${e.destination || "(none)"}`,
      `   Status    : ${e.status}`,
      `   Duration  : ${(e.elapsedMs / 1000).toFixed(2)}s`,
      `   Outcome   : ${e.outcome}`,
    ].join("\n");
  });
  return [...header, ...body].join("\n");
}
