import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScenarioCard } from "@/src/components/scenario-card";
import { StatusPill } from "@/src/components/status-pill";
import { loadConfig } from "@/src/lib/config";
import { clearHistory } from "@/src/lib/history";
import {
  formatClock,
  formatElapsed,
  getScenarioAvailability,
  SCENARIOS,
} from "@/src/lib/scenarios";
import { useTestRunner } from "@/src/lib/useTestRunner";
import { LabConfig, Scenario } from "@/src/lib/types";
import { makeStyles, useTheme } from "@/src/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();

  const [config, setConfig] = useState<LabConfig | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showResultSheet, setShowResultSheet] = useState(false);
  const runner = useTestRunner(config);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadConfig().then((c) => {
        if (active) setConfig(c);
      });
      return () => { active = false; };
    }, []),
  );

  // Slide the result sheet up the moment a test starts.
  useEffect(() => {
    if (runner.isRunning) {
      setShowResultSheet(true);
    }
  }, [runner.isRunning]);

  const availability = useMemo(
    () => (config ? getScenarioAvailability(config) : null),
    [config],
  );

  const handlePress = useCallback(
    (scenario: Scenario) => {
      if (scenario.id === "stop") {
        runner.stop();
        return;
      }
      runner.run(scenario);
    },
    [runner],
  );

  const handleClear = useCallback(async () => {
    await clearHistory();
    setConfirmClear(false);
  }, []);

  const handleCloseResult = useCallback(() => {
    setShowResultSheet(false);
  }, []);

  // Resolve accent colour for the scenario icon shown in the result sheet.
  const activeScenario = runner.activity.scenarioId
    ? SCENARIOS.find((s) => s.id === runner.activity.scenarioId) ?? null
    : null;
  const sheetAccent =
    activeScenario?.accent === "error"
      ? colors.error
      : activeScenario?.accent === "warning"
        ? colors.warning
        : colors.success;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <MaterialDesignIcons name="shield-outline" size={40} color={colors.brand} />
              <View style={styles.logoFlask}>
                <MaterialDesignIcons name="flask-outline" size={18} color={colors.onSurface} />
              </View>
            </View>
            <Text style={styles.appTitle}>APOLLO THREAT LAB</Text>
          </View>
          <Pressable
            testID="open-settings-button"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.push("/settings")}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <MaterialDesignIcons name="cog" size={26} color={colors.subtitle} />
          </Pressable>
        </View>

        <Text style={styles.subtitle}>Controlled Security Testing</Text>
        <Text style={styles.description}>
          Run safe test activity to observe how Apollo responds.
        </Text>

        {/* ── Category legend ───────────────────────────────────────────── */}
        <View style={styles.infoBanner} testID="category-legend">
          <MaterialDesignIcons name="information-outline" size={18} color={colors.info} />
          <Text style={styles.infoText}>
            All tests are preconfigured and ready. Generating traffic is not the same
            as a detectable threat:{" "}
            <Text style={styles.infoStrong}>connectivity</Text> tests send benign traffic
            and won&apos;t by themselves trigger Apollo, while a{" "}
            <Text style={styles.infoStrong}>detection</Text> test uses a known test
            threat. Verdicts are confirmed only inside Apollo.
          </Text>
        </View>

        {/* ── Scenario cards ────────────────────────────────────────────── */}
        <View style={styles.cards}>
          {SCENARIOS.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              ready={availability ? availability[scenario.id] : true}
              disabled={runner.isRunning && scenario.id !== "stop"}
              onPress={() => handlePress(scenario)}
            />
          ))}
        </View>

        {/* ── Footer actions ────────────────────────────────────────────── */}
        <View style={styles.footerActions}>
          <Pressable
            testID="open-history-button"
            accessibilityRole="button"
            onPress={() => router.push("/history")}
            style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
          >
            <MaterialDesignIcons name="history" size={20} color={colors.onSurface} />
            <Text style={styles.footerButtonText}>History</Text>
            <MaterialDesignIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>
          <Pressable
            testID="clear-history-button"
            accessibilityRole="button"
            onPress={() => setConfirmClear(true)}
            style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
          >
            <MaterialDesignIcons name="trash-can-outline" size={20} color={colors.onSurface} />
            <Text style={styles.footerButtonText}>Clear</Text>
            <MaterialDesignIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>
        </View>

        <Text style={styles.footerNote}>Internal Test Utility • Harmony Wellness Group</Text>
      </ScrollView>

      {/* ── Result Bottom Sheet ───────────────────────────────────────────── */}
      <Modal
        visible={showResultSheet}
        transparent
        animationType="slide"
        onRequestClose={() => {
          // Android back button: only close when the test is not still running.
          if (!runner.isRunning) handleCloseResult();
        }}
      >
        <View style={styles.sheetBackdrop}>
          {/* Tapping the dimmed area closes the sheet when done */}
          <Pressable
            style={styles.sheetBackdropTouch}
            onPress={!runner.isRunning ? handleCloseResult : undefined}
          />

          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 12) + 16 },
            ]}
          >
            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Scenario icon + label + status pill */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                {activeScenario ? (
                  <View
                    style={[styles.sheetIconWrap, { borderColor: sheetAccent }]}
                  >
                    <MaterialDesignIcons
                      name={activeScenario.icon as never}
                      size={18}
                      color={sheetAccent}
                    />
                  </View>
                ) : null}
                <Text style={styles.sheetTitle} numberOfLines={2}>
                  {runner.activity.scenarioLabel || "Test"}
                </Text>
              </View>
              <StatusPill status={runner.activity.status} />
            </View>

            <View style={styles.sheetDivider} />

            {/* Destination */}
            {runner.activity.destination ? (
              <View style={styles.sheetRow}>
                <Text style={styles.sheetRowLabel}>Destination</Text>
                <Text style={styles.sheetRowValue} numberOfLines={2}>
                  {runner.activity.destination}
                </Text>
              </View>
            ) : null}

            {/* Start time */}
            {runner.activity.startTime ? (
              <View style={styles.sheetRow}>
                <Text style={styles.sheetRowLabel}>Start Time</Text>
                <Text style={styles.sheetRowValue}>
                  {formatClock(runner.activity.startTime)}
                </Text>
              </View>
            ) : null}

            {/* Elapsed */}
            <View style={styles.sheetRow}>
              <Text style={styles.sheetRowLabel}>Elapsed</Text>
              <Text style={styles.sheetRowValue}>
                {formatElapsed(runner.activity.elapsedMs)}
              </Text>
            </View>

            {/* Running spinner  OR  completed outcome */}
            {runner.isRunning ? (
              <View style={styles.runningBlock}>
                <ActivityIndicator color={colors.brand} size="small" />
                <Text style={styles.runningText}>Test in progress…</Text>
              </View>
            ) : (
              <View style={styles.outcomeBlock}>
                <Text style={styles.outcomeLabel}>Observed Outcome</Text>
                <ScrollView
                  style={styles.outcomeScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.outcomeText}>
                    {runner.activity.outcome}
                  </Text>
                </ScrollView>
              </View>
            )}

            {/* Stop (while running) or Close (when done) */}
            <View style={styles.sheetAction}>
              {runner.isRunning ? (
                <Pressable
                  onPress={runner.stop}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.stopBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialDesignIcons
                    name="stop-circle-outline"
                    size={18}
                    color={colors.onError}
                  />
                  <Text style={styles.stopBtnText}>Stop Test</Text>
                </Pressable>
              ) : (
                <Pressable
                  testID="result-close-button"
                  onPress={handleCloseResult}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.closeBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Clear History Confirmation ────────────────────────────────────── */}
      <Modal
        visible={confirmClear}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmClear(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setConfirmClear(false)}
        >
          <Pressable style={styles.modalCard} testID="clear-confirm-modal">
            <Text style={styles.modalTitle}>Clear test history?</Text>
            <Text style={styles.modalBody}>
              This permanently removes all locally stored test attempts on this
              device. This cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                testID="clear-cancel-button"
                onPress={() => setConfirmClear(false)}
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.modalBtnGhost,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                testID="clear-confirm-button"
                onPress={handleClear}
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.modalBtnDanger,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.modalBtnDangerText}>Clear History</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: 18,
    gap: 6,
  },
  pressed: {
    opacity: 0.7,
  },

  // ── Header / brand ──────────────────────────────────────────────────
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  logo: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  logoFlask: {
    position: "absolute",
    top: 11,
    left: 13,
  },
  appTitle: {
    color: colors.onSurface,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  subtitle: {
    color: colors.subtitle,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  description: {
    color: colors.onSurfaceSecondary,
    fontSize: 15,
    marginTop: 2,
    marginBottom: 8,
  },

  // ── Info banner ─────────────────────────────────────────────────────
  infoBanner: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  infoText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12.5,
    lineHeight: 18,
  },
  infoStrong: {
    color: colors.onSurface,
    fontWeight: "700",
  },

  // ── Scenario cards ──────────────────────────────────────────────────
  cards: {
    gap: 12,
  },

  // ── Footer ──────────────────────────────────────────────────────────
  footerActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  footerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  footerButtonText: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: "700",
  },
  footerNote: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },

  // ── Result bottom sheet ─────────────────────────────────────────────
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheetBackdropTouch: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 4,
  },
  sheetTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sheetIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    flexShrink: 0,
  },
  sheetTitle: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 17,
    fontWeight: "700",
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 14,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 5,
    gap: 12,
  },
  sheetRowLabel: {
    color: colors.muted,
    fontSize: 13,
    width: 90,
    lineHeight: 18,
  },
  sheetRowValue: {
    color: colors.onSurface,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  runningBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  runningText: {
    color: colors.onSurface,
    fontSize: 15,
    fontWeight: "600",
  },
  outcomeBlock: {
    marginTop: 14,
    gap: 8,
  },
  outcomeLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  outcomeScroll: {
    maxHeight: 160,
  },
  outcomeText: {
    color: colors.onSurfaceSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  sheetAction: {
    marginTop: 20,
  },
  actionBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  stopBtn: {
    backgroundColor: colors.error,
  },
  stopBtnText: {
    color: colors.onError,
    fontSize: 16,
    fontWeight: "800",
  },
  closeBtn: {
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtnText: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: "700",
  },

  // ── Clear history confirmation modal ────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
  },
  modalTitle: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: "800",
  },
  modalBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnGhost: {
    backgroundColor: colors.surfaceTertiary,
  },
  modalBtnGhostText: {
    color: colors.onSurface,
    fontSize: 15,
    fontWeight: "700",
  },
  modalBtnDanger: {
    backgroundColor: colors.error,
  },
  modalBtnDangerText: {
    color: colors.onError,
    fontSize: 15,
    fontWeight: "800",
  },
}));
