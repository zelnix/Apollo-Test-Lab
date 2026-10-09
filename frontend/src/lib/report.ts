// Pure text builders for live outcomes and the shareable report. Framework
// free and unit-testable. Every message is deliberately honest: a completed,
// failed, timed-out or cancelled network result is NEVER described as an Apollo
// verdict. Apollo enforcement can only be confirmed inside Apollo itself.

import { TEST_TIMEOUT_MS } from "./scenarios";
import { HistoryEntry } from "./types";

const APOLLO_DISCLAIMER =
  "This is a network result only — it is not evidence that Apollo allowed or blocked anything. Verify Apollo separately in the Apollo app.";

export function buildBrowserOutcome(url: string): string {
  return (
    `Requested the system browser to open ${url}. Threat Lab only launched the link; ` +
    `it cannot confirm which browser opened it, whether the page loaded, or that Apollo inspected it. ` +
    `IMPORTANT: A browser-level Safe Browsing warning (e.g. Chrome's "Dangerous Site" alert) is ` +
    `issued by the browser independently of Apollo's VPN or DNS protection. ` +
    `It does NOT confirm that Apollo's Site Gate matched this URL. ` +
    `Apollo's Site Gate requires the destination to match Apollo's own hostname or URL blocklist. ` +
    `If Apollo shows no incident after this test, the browser's own protection acted before or ` +
    `instead of Apollo — not an Apollo enforcement event. ` +
    `Verify Apollo's own event log separately. ` +
    APOLLO_DISCLAIMER
  );
}

export function buildDnsOutcome(hostname: string, addresses: string[], durationMs: number): string {
  const ips = addresses.length ? addresses.join(", ") : "(no addresses)";
  return (
    `DNS resolved ${hostname} to ${ips} in ${Math.round(durationMs)}ms via the native system resolver. ` +
    `A completed DNS lookup means the query traversed the device's resolver path (which Apollo's VPN ` +
    `intercepts if connected). IMPORTANT: A hostname match in Apollo's DNS gate does NOT constitute ` +
    `a verified connection block. Apollo must also enforce a packet-level block on the subsequent ` +
    `HTTPS connection — DNS rule matching alone does not establish that. ` +
    APOLLO_DISCLAIMER
  );
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
  // Provide specific context for TLS/certificate errors — they are the expected
  // outcome of the Bad Certificate Test and should not be confused with a generic failure.
  if (/certificate|ssl|tls|handshake|pkix|trust anchor|hostname|x\.509/i.test(msg)) {
    return `TLS/certificate error: ${msg}. This is the expected outcome for a bad-certificate test if Apollo did not intercept the connection. A TLS error means the OS rejected the invalid certificate before any data was exchanged — it is not by itself evidence that Apollo enforced anything. ${APOLLO_DISCLAIMER}`;
  }
  return `Request failed: ${msg}. A failed request (offline, DNS NXDOMAIN, TLS error, or enforcement) is a network result only and is NOT by itself evidence that Apollo enforced anything. ${APOLLO_DISCLAIMER}`;
}

export function buildStopIdleOutcome(): string {
  return "No in-app test is currently running. Note: a link already handed to the system browser cannot be cancelled by Threat Lab.";
}

// ── New scenario outcome builders ────────────────────────────────────────────

// EICAR download test: reports whether the EICAR test signature was received in
// the response body. eicarDetected=true means the content was NOT blocked at the
// network or content-inspection layer. eicarDetected=false with a 200 status
// suggests Apollo may have substituted a block page.
export function buildEicarOutcome(
  httpStatus: number,
  bytes: number,
  durationMs: number,
  eicarDetected: boolean,
): string {
  const summary = eicarDetected
    ? "EICAR test signature received in response body — content-inspection gate did not block this download."
    : `HTTP ${httpStatus} received but EICAR signature not found in ${bytes} bytes — possible Apollo block page or content substitution.`;
  return `EICAR download: HTTP ${httpStatus} • ${bytes} bytes • ${Math.round(durationMs)}ms. ${summary} ${APOLLO_DISCLAIMER}`;
}

// Unencrypted HTTP test: records that the request used plain HTTP (not HTTPS).
// A completed response confirms cleartext traffic was not blocked on the device path.
export function buildUnencryptedHttpOutcome(
  httpStatus: number,
  finalUrl: string,
  bytes: number,
  durationMs: number,
): string {
  return `Unencrypted HTTP ${httpStatus} from ${finalUrl} • ${bytes} bytes • ${Math.round(durationMs)}ms. This request intentionally used plain HTTP. A completed response means cleartext traffic traversed the device's network path. ${APOLLO_DISCLAIMER}`;
}

// Bad certificate test (success path): the connection completed despite an
// invalid certificate. This may mean Apollo substituted a block page (common
// enforcement pattern), the certificate was quietly accepted, or the cert is
// no longer expired.
export function buildBadCertCompletedOutcome(
  httpStatus: number,
  finalUrl: string,
  durationMs: number,
): string {
  return `TLS certificate test: connection completed — HTTP ${httpStatus} from ${finalUrl} in ${Math.round(durationMs)}ms. The endpoint has an invalid certificate; a successful connection may indicate Apollo redirected to a block page, or the certificate state changed. ${APOLLO_DISCLAIMER}`;
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
