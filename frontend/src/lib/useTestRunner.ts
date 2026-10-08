// useTestRunner — the single-test state machine. Enforces one test at a time,
// applies a hard timeout, supports user cancellation, performs real device
// networking and records truthful outcomes to local history.

import { useCallback, useEffect, useRef, useState } from "react";
import { Linking } from "react-native";

import { addHistoryEntry, genRunId } from "./history";
import { performDnsLookup, performHttpRequest } from "./network";
import {
  buildBrowserOutcome,
  buildCancelledOutcome,
  buildDnsOutcome,
  buildFailureOutcome,
  buildHttpOutcome,
  buildRedirectOutcome,
  buildSetupOutcome,
  buildStopIdleOutcome,
  buildTimeoutOutcome,
} from "./report";
import {
  getDestination,
  getScenarioAvailability,
  resolveTerminalStatus,
  TEST_TIMEOUT_MS,
} from "./scenarios";
import { LabConfig, Scenario, TestActivity, TestStatus } from "./types";

const INITIAL_ACTIVITY: TestActivity = {
  scenarioId: "safe-traffic",
  scenarioLabel: "Safe Traffic Test",
  startTime: null,
  destination: "https://example.com",
  status: "Ready",
  elapsedMs: 0,
  outcome: "Awaiting test run.",
};

async function executeScenario(
  scenario: Scenario,
  config: LabConfig,
  signal: AbortSignal,
): Promise<string> {
  switch (scenario.kind) {
    case "browser": {
      await Linking.openURL(config.phishingUrl);
      return buildBrowserOutcome(config.phishingUrl);
    }
    case "dns": {
      const r = await performDnsLookup(config.maliciousDomain, signal);
      return buildDnsOutcome(r.hostname, r.addresses, r.durationMs);
    }
    case "https": {
      const url = scenario.id === "safe-traffic" ? config.safeTrafficUrl : config.suspiciousUrl;
      const r = await performHttpRequest(url, signal);
      return buildHttpOutcome(r.httpStatus, r.finalUrl, r.bytes, r.durationMs);
    }
    case "redirect": {
      const r = await performHttpRequest(config.redirectUrl, signal);
      return buildRedirectOutcome(r.httpStatus, r.finalUrl, r.durationMs);
    }
    default:
      return "No action.";
  }
}

export function useTestRunner(config: LabConfig | null, onHistoryChange?: () => void) {
  const [activity, setActivity] = useState<TestActivity>(INITIAL_ACTIVITY);

  const statusRef = useRef<TestStatus>("Ready");
  const controllerRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const timedOutRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const run = useCallback(
    async (scenario: Scenario) => {
      if (!config) return;
      // One test at a time.
      if (statusRef.current === "Running") return;

      const destination = getDestination(scenario.id, config);

      // Setup required — never fake a successful test.
      if (!getScenarioAvailability(config)[scenario.id]) {
        const outcome = buildSetupOutcome();
        statusRef.current = "Setup required";
        setActivity({
          scenarioId: scenario.id,
          scenarioLabel: scenario.label,
          startTime: null,
          destination: destination || "—",
          status: "Setup required",
          elapsedMs: 0,
          outcome,
        });
        await addHistoryEntry({
          id: genRunId(),
          scenarioId: scenario.id,
          scenarioLabel: scenario.label,
          startTime: new Date().toISOString(),
          destination: destination || "(none)",
          status: "Setup required",
          elapsedMs: 0,
          outcome,
        });
        onHistoryChange?.();
        return;
      }

      const runId = genRunId();
      const startDate = new Date();
      const startMs = Date.now();
      const controller = new AbortController();
      controllerRef.current = controller;
      cancelledRef.current = false;
      timedOutRef.current = false;
      statusRef.current = "Running";

      setActivity({
        scenarioId: scenario.id,
        scenarioLabel: scenario.label,
        startTime: startDate.toISOString(),
        destination,
        status: "Running",
        elapsedMs: 0,
        outcome: "Request in progress…",
      });

      stopTimer();
      intervalRef.current = setInterval(() => {
        setActivity((a) => (a.status === "Running" ? { ...a, elapsedMs: Date.now() - startMs } : a));
      }, 250);

      const timeout = setTimeout(() => {
        timedOutRef.current = true;
        controller.abort();
      }, TEST_TIMEOUT_MS);

      let status: TestStatus;
      let outcome: string;
      try {
        outcome = await executeScenario(scenario, config, controller.signal);
        status = "Completed";
      } catch (e) {
        status = resolveTerminalStatus({
          userCancelled: cancelledRef.current,
          timedOut: timedOutRef.current,
          failed: !cancelledRef.current && !timedOutRef.current,
        });
        if (status === "Cancelled") outcome = buildCancelledOutcome();
        else if (timedOutRef.current) outcome = buildTimeoutOutcome();
        else outcome = buildFailureOutcome(e);
      } finally {
        clearTimeout(timeout);
        stopTimer();
      }

      const elapsedMs = Date.now() - startMs;
      statusRef.current = status;
      controllerRef.current = null;

      setActivity({
        scenarioId: scenario.id,
        scenarioLabel: scenario.label,
        startTime: startDate.toISOString(),
        destination,
        status,
        elapsedMs,
        outcome,
      });

      await addHistoryEntry({
        id: runId,
        scenarioId: scenario.id,
        scenarioLabel: scenario.label,
        startTime: startDate.toISOString(),
        destination,
        status,
        elapsedMs,
        outcome,
        error: status === "Failed" ? outcome : undefined,
      });
      onHistoryChange?.();
    },
    [config, onHistoryChange, stopTimer],
  );

  const stop = useCallback(() => {
    if (statusRef.current === "Running" && controllerRef.current) {
      cancelledRef.current = true;
      controllerRef.current.abort();
    } else {
      setActivity((a) => ({
        ...a,
        scenarioId: "stop",
        scenarioLabel: "Stop Test",
        status: "Ready",
        outcome: buildStopIdleOutcome(),
      }));
    }
  }, []);

  return { activity, run, stop, isRunning: activity.status === "Running" };
}
