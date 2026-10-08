// Tests for report redaction: shared/exported reports must not leak URL
// parameters or IP addresses.

import { buildDnsOutcome, buildReport, redactText, redactUrl } from "@/src/lib/report";
import { HistoryEntry } from "@/src/lib/types";

describe("redactUrl", () => {
  it("strips query string and fragment", () => {
    expect(redactUrl("https://lab.example.com/scan?token=secret123")).toBe(
      "https://lab.example.com/scan [params redacted]",
    );
    expect(redactUrl("https://lab.example.com/a#frag")).toBe(
      "https://lab.example.com/a [params redacted]",
    );
  });

  it("leaves clean URLs untouched", () => {
    expect(redactUrl("https://example.com")).toBe("https://example.com");
    expect(redactUrl("")).toBe("");
  });
});

describe("redactText", () => {
  it("masks IPv4 and IPv6 addresses", () => {
    expect(redactText("resolved to 93.184.216.34 fast")).toBe("resolved to [ip redacted] fast");
    expect(redactText("addr 2001:0db8:85a3:0000:0000:8a2e:0370:7334 ok")).toContain("[ip redacted]");
  });

  it("strips query params from URLs embedded in text", () => {
    expect(redactText("final https://httpbin.org/get?key=secret done")).toBe(
      "final https://httpbin.org/get [params redacted] done",
    );
  });
});

describe("buildReport redaction", () => {
  it("redacts destinations and outcome IPs/params", () => {
    const entries: HistoryEntry[] = [
      {
        id: "ATL-1",
        scenarioId: "malicious-domain",
        scenarioLabel: "Malicious Domain Test",
        startTime: "2026-06-01T10:00:00.000Z",
        destination: "lab.example.com",
        status: "Completed",
        elapsedMs: 120,
        outcome: buildDnsOutcome("lab.example.com", ["93.184.216.34"], 12),
      },
      {
        id: "ATL-2",
        scenarioId: "suspicious-connection",
        scenarioLabel: "Suspicious Connection Test",
        startTime: "2026-06-01T10:01:00.000Z",
        destination: "https://lab.example.com/scan?token=secret123",
        status: "Completed",
        elapsedMs: 200,
        outcome: "HTTP 200 from https://lab.example.com/scan?token=secret123 • 10 bytes • 200ms.",
      },
    ];
    const report = buildReport(entries);
    expect(report).not.toContain("93.184.216.34");
    expect(report).not.toContain("secret123");
    expect(report).not.toContain("token=");
    expect(report).toContain("[ip redacted]");
    expect(report).toContain("[params redacted]");
    expect(report).toContain("redacted: URL parameters and IP addresses are removed");
  });
});
