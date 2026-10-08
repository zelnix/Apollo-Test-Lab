// Result-classification tests. These assert the single most important safety
// property: Threat Lab never fabricates an Apollo verdict. A completed, failed,
// timed-out or cancelled network result must be described honestly and must
// never claim Apollo blocked, detected or allowed anything.

import {
  buildBrowserOutcome,
  buildCancelledOutcome,
  buildDnsOutcome,
  buildFailureOutcome,
  buildHttpOutcome,
  buildRedirectOutcome,
  buildReport,
  buildSetupOutcome,
  buildTimeoutOutcome,
} from "@/src/lib/report";
import { HistoryEntry } from "@/src/lib/types";

const FORBIDDEN = [
  "apollo blocked",
  "apollo detected",
  "threat blocked",
  "apollo passed",
  "biting",
  "apollo is",
];

function assertNoFabricatedVerdict(text: string) {
  const lower = text.toLowerCase();
  FORBIDDEN.forEach((phrase) => expect(lower).not.toContain(phrase));
}

describe("honest outcome text", () => {
  it("browser outcome only claims the link was launched", () => {
    const t = buildBrowserOutcome("https://demo.example/phishing");
    expect(t).toContain("open");
    expect(t.toLowerCase()).toContain("cannot confirm");
    assertNoFabricatedVerdict(t);
  });

  it("dns outcome reports addresses as a network result only", () => {
    const t = buildDnsOutcome("test.example.com", ["93.184.216.34"], 12.4);
    expect(t).toContain("93.184.216.34");
    expect(t).toContain("network result only");
    assertNoFabricatedVerdict(t);
  });

  it("http success is not an Apollo verdict", () => {
    const t = buildHttpOutcome(200, "https://example.com", 1256, 180);
    expect(t).toContain("HTTP 200");
    assertNoFabricatedVerdict(t);
  });

  it("redirect outcome records the final url honestly", () => {
    const t = buildRedirectOutcome(200, "https://httpbin.org/get", 220);
    expect(t).toContain("https://httpbin.org/get");
    assertNoFabricatedVerdict(t);
  });

  it("timeout is Failed-honest, never a block claim", () => {
    const t = buildTimeoutOutcome();
    expect(t.toLowerCase()).toContain("timed out");
    expect(t.toLowerCase()).toContain("cannot attribute it to apollo");
    assertNoFabricatedVerdict(t);
  });

  it("generic failure (including NXDOMAIN) is not a block claim", () => {
    const t = buildFailureOutcome(new Error("Network request failed"));
    expect(t.toLowerCase()).toContain("not");
    expect(t.toLowerCase()).toContain("verify");
    assertNoFabricatedVerdict(t);
  });

  it("missing native DNS module is reported truthfully", () => {
    const t = buildFailureOutcome(new Error("NATIVE_DNS_UNAVAILABLE"));
    expect(t.toLowerCase()).toContain("native dns module");
    assertNoFabricatedVerdict(t);
  });

  it("cancellation records no network outcome", () => {
    const t = buildCancelledOutcome();
    expect(t.toLowerCase()).toContain("cancelled");
    assertNoFabricatedVerdict(t);
  });

  it("setup-required never implies a passed test", () => {
    const t = buildSetupOutcome();
    expect(t.toLowerCase()).toContain("setup required");
    assertNoFabricatedVerdict(t);
  });
});

describe("report export", () => {
  it("builds a redacted text report with the Apollo disclaimer", () => {
    const entries: HistoryEntry[] = [
      {
        id: "ATL-ABC-123",
        scenarioId: "safe-traffic",
        scenarioLabel: "Safe Traffic Test",
        startTime: "2026-06-01T10:00:00.000Z",
        destination: "https://example.com",
        status: "Completed",
        elapsedMs: 1800,
        outcome: buildHttpOutcome(200, "https://example.com", 1256, 180),
      },
    ];
    const report = buildReport(entries);
    expect(report).toContain("APOLLO THREAT LAB");
    expect(report).toContain("ATL-ABC-123");
    expect(report).toContain("Attempts recorded: 1");
    expect(report.toLowerCase()).toContain("not");
    assertNoFabricatedVerdict(report);
  });
});
