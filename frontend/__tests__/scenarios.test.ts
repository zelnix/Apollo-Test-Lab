// Unit tests for Apollo Threat Lab's pure scenario logic: target validation,
// availability (Setup required), state transitions, scenario selection,
// destination resolution and formatting.

import {
  canStart,
  CATEGORY_META,
  formatBytes,
  formatElapsed,
  getDestination,
  getScenario,
  getScenarioAvailability,
  isScenarioReady,
  isValidHostname,
  isValidHttpsUrl,
  resolveTerminalStatus,
  SCENARIOS,
} from "@/src/lib/scenarios";
import { DEFAULT_CONFIG } from "@/src/lib/defaults";
import { LabConfig } from "@/src/lib/types";

describe("target validation", () => {
  it("accepts well-formed https URLs", () => {
    expect(isValidHttpsUrl("https://example.com")).toBe(true);
    expect(isValidHttpsUrl("https://httpbin.org/redirect/1")).toBe(true);
    expect(isValidHttpsUrl("https://test.example.com/path?x=1")).toBe(true);
  });

  it("rejects non-https and malformed URLs", () => {
    expect(isValidHttpsUrl("http://example.com")).toBe(false);
    expect(isValidHttpsUrl("ftp://example.com")).toBe(false);
    expect(isValidHttpsUrl("example.com")).toBe(false);
    expect(isValidHttpsUrl("https://has space.com")).toBe(false);
    expect(isValidHttpsUrl("")).toBe(false);
    expect(isValidHttpsUrl(null)).toBe(false);
  });

  it("accepts valid bare hostnames", () => {
    expect(isValidHostname("example.com")).toBe(true);
    expect(isValidHostname("test.lab.example.com")).toBe(true);
  });

  it("rejects URLs, schemes and junk as hostnames", () => {
    expect(isValidHostname("https://example.com")).toBe(false);
    expect(isValidHostname("example.com/path")).toBe(false);
    expect(isValidHostname("localhost")).toBe(false);
    expect(isValidHostname("has space.com")).toBe(false);
    expect(isValidHostname("")).toBe(false);
    expect(isValidHostname(null)).toBe(false);
  });
});

describe("scenario selection", () => {
  it("exposes exactly the ten documented scenarios", () => {
    expect(SCENARIOS.map((s) => s.id)).toEqual([
      "phishing",
      "malware-url",
      "malicious-domain",
      "suspicious-connection",
      "redirect",
      "unencrypted-http",
      "malware-download",
      "bad-certificate",
      "safe-traffic",
      "stop",
    ]);
  });

  it("looks scenarios up by id", () => {
    expect(getScenario("safe-traffic").kind).toBe("https");
    expect(getScenario("malicious-domain").kind).toBe("dns");
    expect(getScenario("malware-url").kind).toBe("browser");
    expect(getScenario("unencrypted-http").kind).toBe("http");
    expect(getScenario("malware-download").kind).toBe("eicar");
    expect(getScenario("bad-certificate").kind).toBe("bad-cert");
    expect(() => getScenario("nope" as never)).toThrow();
  });
});

describe("availability (ready out of the box)", () => {
  it("defaults: every test is ready, none require setup", () => {
    const a = getScenarioAvailability(DEFAULT_CONFIG);
    expect(a.phishing).toBe(true);
    expect(a["malware-url"]).toBe(true);
    expect(a.redirect).toBe(true);
    expect(a["safe-traffic"]).toBe(true);
    expect(a["malicious-domain"]).toBe(true);
    expect(a["suspicious-connection"]).toBe(true);
    expect(a["unencrypted-http"]).toBe(true);
    expect(a["malware-download"]).toBe(true);
    expect(a["bad-certificate"]).toBe(true);
    expect(a.stop).toBe(true);
  });

  it("clearing an optional target makes that test Setup required", () => {
    const cleared: LabConfig = { ...DEFAULT_CONFIG, maliciousDomain: "", suspiciousUrl: "" };
    expect(isScenarioReady(cleared, "malicious-domain")).toBe(false);
    expect(isScenarioReady(cleared, "suspicious-connection")).toBe(false);
  });

  it("becomes ready once valid targets are configured", () => {
    const config: LabConfig = {
      ...DEFAULT_CONFIG,
      maliciousDomain: "test.example.com",
      suspiciousUrl: "https://httpbin.org/get",
    };
    expect(isScenarioReady(config, "malicious-domain")).toBe(true);
    expect(isScenarioReady(config, "suspicious-connection")).toBe(true);
  });

  it("stays setup-required with an invalid target", () => {
    const config: LabConfig = { ...DEFAULT_CONFIG, suspiciousUrl: "notaurl" };
    expect(isScenarioReady(config, "suspicious-connection")).toBe(false);
  });
});

describe("test categories", () => {
  it("assigns an honest category to every scenario", () => {
    const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s.category]));
    expect(byId.phishing).toBe("detection");
    expect(byId["malware-url"]).toBe("detection");
    expect(byId["malicious-domain"]).toBe("connectivity");
    expect(byId["suspicious-connection"]).toBe("connectivity");
    expect(byId.redirect).toBe("connectivity");
    expect(byId["unencrypted-http"]).toBe("connectivity");
    expect(byId["malware-download"]).toBe("detection");
    expect(byId["bad-certificate"]).toBe("detection");
    expect(byId["safe-traffic"]).toBe("control");
    expect(byId.stop).toBe("action");
  });

  it("every category has honest metadata and none claims an Apollo verdict", () => {
    (["detection", "connectivity", "control", "action"] as const).forEach((c) => {
      const meta = CATEGORY_META[c];
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.blurb.toLowerCase()).not.toContain("apollo blocked");
      expect(meta.blurb.toLowerCase()).not.toContain("apollo detected");
    });
  });
});

describe("state transitions", () => {
  it("allows starting unless already Running (one test at a time)", () => {
    expect(canStart("Ready")).toBe(true);
    expect(canStart("Completed")).toBe(true);
    expect(canStart("Failed")).toBe(true);
    expect(canStart("Setup required")).toBe(true);
    expect(canStart("Running")).toBe(false);
  });

  it("maps a successful run to Completed", () => {
    expect(resolveTerminalStatus({ userCancelled: false, timedOut: false, failed: false })).toBe(
      "Completed",
    );
  });

  it("maps user cancellation to Cancelled", () => {
    expect(resolveTerminalStatus({ userCancelled: true, timedOut: false, failed: true })).toBe(
      "Cancelled",
    );
  });

  it("maps a timeout to Failed (never a block claim)", () => {
    expect(resolveTerminalStatus({ userCancelled: false, timedOut: true, failed: true })).toBe(
      "Failed",
    );
  });

  it("maps a network error to Failed", () => {
    expect(resolveTerminalStatus({ userCancelled: false, timedOut: false, failed: true })).toBe(
      "Failed",
    );
  });
});

describe("destination resolution", () => {
  it("returns the configured target per scenario", () => {
    expect(getDestination("safe-traffic", DEFAULT_CONFIG)).toBe("https://example.com");
    expect(getDestination("redirect", DEFAULT_CONFIG)).toBe("https://httpbin.org/redirect/1");
    expect(getDestination("stop", DEFAULT_CONFIG)).toBe("");
  });
});

describe("formatting", () => {
  it("formats elapsed time as mm:ss", () => {
    expect(formatElapsed(0)).toBe("00:00");
    expect(formatElapsed(3200)).toBe("00:03");
    expect(formatElapsed(65000)).toBe("01:05");
  });

  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
  });
});
