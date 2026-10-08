import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScenarioCard } from "@/src/components/scenario-card";
import { TestActivityPanel } from "@/src/components/test-activity-panel";
import { loadConfig } from "@/src/lib/config";
import { clearHistory } from "@/src/lib/history";
import { getScenarioAvailability, SCENARIOS } from "@/src/lib/scenarios";
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
  const runner = useTestRunner(config);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadConfig().then((c) => {
        if (active) setConfig(c);
      });
      return () => {
        active = false;
      };
    }, []),
  );

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

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
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
        <Text style={styles.description}>Run safe test activity to observe how Apollo responds.</Text>

        {/* Scenario buttons */}
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

        {/* Live test results */}
        <View style={styles.panelWrap}>
          <TestActivityPanel activity={runner.activity} />
        </View>

        {/* Footer actions */}
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

      {/* Clear confirmation */}
      <Modal
        visible={confirmClear}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmClear(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmClear(false)}>
          <Pressable style={styles.modalCard} testID="clear-confirm-modal">
            <Text style={styles.modalTitle}>Clear test history?</Text>
            <Text style={styles.modalBody}>
              This permanently removes all locally stored test attempts on this device. This cannot
              be undone.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                testID="clear-cancel-button"
                onPress={() => setConfirmClear(false)}
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnGhost, pressed && styles.pressed]}
              >
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                testID="clear-confirm-button"
                onPress={handleClear}
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnDanger, pressed && styles.pressed]}
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
  cards: {
    gap: 12,
  },
  panelWrap: {
    marginTop: 16,
  },
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
