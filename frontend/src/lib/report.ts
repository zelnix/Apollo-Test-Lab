// Pure text builders for live outcomes and the shareable report. Framework
// free and unit-testable. Every message is deliberately honest: a completed,
// failed, timed-out or cancelled network result is NEVER described as an Apollo
// verdict. Apollo enforcement can only be confirmed inside Apollo itself.

import { TEST_TIMEOUT_MS } from "./scenarios";
import { HistoryEntry } from "./types";

const APOLLO_DISCLAIMER =
  "This is a network result only — it is not evidence that Apollo allowed or blocked anything. Verify Apollo separately in the Apollo app.";

export function buildBrowserOutcome(url: string): string {
  return `Requested the system browser to open ${url}. Threat Lab only launched the link; it cannot confirm the page loaded or that Apollo inspected it. ${APOLLO_DISCLAIMER}`;
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
    return "Native DNS module is not available in this runtime (Expo Go and the web preview do not include it). Install the built Android APK or iOS IPA to perform real native system DNS lookups.";
  }
  return `Request failed: ${msg}. A failed request (offline, DNS NXDOMAIN, TLS error, or enforcement) is a network result only and is NOT by itself evidence that Apollo enforced anything. ${APOLLO_DISCLAIMER}`;
}

export function buildStopIdleOutcome(): string {
  return "No in-app test is currently running. Note: a link already handed to the Android browser cannot be cancelled by Threat Lab.";
}

// --- Redaction (for shared / exported reports only) -------------------------
// The on-device history still shows full detail; only the shareable text report
// is redacted so it cannot leak sensitive URL parameters, IP addresses or raw
// error specifics.

const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const IPV6 = /\b(?:[A-Fa-f0-9]{1,4}:){2,7}[A-Fa-f0-9]{1,4}\b/g;
const URL_WITH_QUERY = /(https?:\/\/[^\s?#]+)(?:[?#][^\s]*)?/gi;

// Strip query string and fragment from a destination, keeping scheme/host/path.
export function redactUrl(value: string): string {
  if (!value) return value;
  const cut = value.search(/[?#]/);
  if (cut < 0) return value;
  return `${value.slice(0, cut)} [params redacted]`;
}

// Mask IP addresses and any query strings embedded in free-form outcome text.
export function redactText(value: string): string {
  if (!value) return value;
  return value
    .replace(URL_WITH_QUERY, (match, base) =>
      match.length > base.length ? `${base} [params redacted]` : base,
    )
    .replace(IPV6, "[ip redacted]")
    .replace(IPV4, "[ip redacted]");
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
    "This report is redacted: URL parameters and IP addresses are removed.",
    "",
    "----------------------------------------",
  ];
  const body = entries.map((e, i) => {
    return [
      `${i + 1}. ${e.scenarioLabel}`,
      `   Run ID    : ${e.id}`,
      `   Time      : ${e.startTime}`,
      `   Target    : ${redactUrl(e.destination) || "(none)"}`,
      `   Status    : ${e.status}`,
      `   Duration  : ${(e.elapsedMs / 1000).toFixed(2)}s`,
      `   Outcome   : ${redactText(e.outcome)}`,
    ].join("\n");
  });
  return [...header, ...body].join("\n");
}
