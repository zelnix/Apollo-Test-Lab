// Unit tests for Apollo Threat Lab's pure scenario logic: target validation,
// availability (Setup required), state transitions, scenario selection,
// destination resolution and formatting.

import {
  canStart,
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
  it("exposes exactly the six documented scenarios", () => {
    expect(SCENARIOS.map((s) => s.id)).toEqual([
      "phishing",
      "malicious-domain",
      "suspicious-connection",
      "redirect",
      "safe-traffic",
      "stop",
    ]);
  });

  it("looks scenarios up by id", () => {
    expect(getScenario("safe-traffic").kind).toBe("https");
    expect(getScenario("malicious-domain").kind).toBe("dns");
    expect(() => getScenario("nope" as never)).toThrow();
  });
});

describe("availability (Setup required)", () => {
  it("defaults: phishing/redirect/safe ready; malicious/suspicious need setup", () => {
    const a = getScenarioAvailability(DEFAULT_CONFIG);
    expect(a.phishing).toBe(true);
    expect(a.redirect).toBe(true);
    expect(a["safe-traffic"]).toBe(true);
    expect(a["malicious-domain"]).toBe(false);
    expect(a["suspicious-connection"]).toBe(false);
    expect(a.stop).toBe(true);
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
