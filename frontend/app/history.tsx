import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Share, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StatusPill } from "@/src/components/status-pill";
import { clearHistory, loadHistory } from "@/src/lib/history";
import { buildReport } from "@/src/lib/report";
import { formatClock } from "@/src/lib/scenarios";
import { HistoryEntry } from "@/src/lib/types";
import { makeStyles, useTheme } from "@/src/theme";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();

  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const refresh = useCallback(() => {
    loadHistory().then(setEntries);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleShare = useCallback(async () => {
    if (entries.length === 0) return;
    await Share.share({ message: buildReport(entries) });
  }, [entries]);

  const handleClear = useCallback(async () => {
    await clearHistory();
    refresh();
  }, [refresh]);

  const renderItem = useCallback(
    ({ item }: { item: HistoryEntry }) => (
      <View style={styles.card} testID={`history-item-${item.id}`}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.scenarioLabel}
          </Text>
          <StatusPill status={item.status} />
        </View>
        <View style={styles.metaRow}>
          <MaterialDesignIcons name="clock-outline" size={13} color={colors.muted} />
          <Text style={styles.meta}>{formatClock(item.startTime)}</Text>
          <MaterialDesignIcons name="timer-outline" size={13} color={colors.muted} />
          <Text style={styles.meta}>{(item.elapsedMs / 1000).toFixed(2)}s</Text>
        </View>
        <Text style={styles.dest} numberOfLines={1}>
          {item.destination || "(none)"}
        </Text>
        <Text style={styles.outcome}>{item.outcome}</Text>
        <Text style={styles.runId}>{item.id}</Text>
      </View>
    ),
    [styles, colors],
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          testID="history-back-button"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <MaterialDesignIcons name="arrow-left" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Test History</Text>
        <View style={{ width: 26 }} />
      </View>

      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.count}>
            {entries.length} attempt{entries.length === 1 ? "" : "s"} • most recent first (max 100)
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty} testID="history-empty">
            <MaterialDesignIcons name="history" size={56} color={colors.muted} />
            <Text style={styles.emptyTitle}>No test attempts yet</Text>
            <Text style={styles.emptyBody}>Run a test from the home screen to record activity here.</Text>
          </View>
        }
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          testID="history-share-button"
          accessibilityRole="button"
          onPress={handleShare}
          disabled={entries.length === 0}
          style={({ pressed }) => [
            styles.footerBtn,
            styles.shareBtn,
            entries.length === 0 && styles.disabled,
            pressed && entries.length > 0 && styles.pressed,
          ]}
        >
          <MaterialDesignIcons name="share-variant-outline" size={19} color={colors.onBrandPrimary} />
          <Text style={styles.shareBtnText}>Share Report</Text>
        </Pressable>
        <Pressable
          testID="history-clear-button"
          accessibilityRole="button"
          onPress={handleClear}
          disabled={entries.length === 0}
          style={({ pressed }) => [
            styles.footerBtn,
            styles.clearBtn,
            entries.length === 0 && styles.disabled,
            pressed && entries.length > 0 && styles.pressed,
          ]}
        >
          <MaterialDesignIcons name="trash-can-outline" size={19} color={colors.error} />
          <Text style={styles.clearBtnText}>Clear</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "800",
  },
  listContent: {
    padding: 18,
    gap: 12,
  },
  count: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 6,
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 7,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  meta: {
    color: colors.muted,
    fontSize: 12.5,
    marginRight: 8,
  },
  dest: {
    color: colors.subtitle,
    fontSize: 13,
  },
  outcome: {
    color: colors.onSurfaceSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  runId: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  empty: {
    alignItems: "center",
    gap: 10,
    paddingTop: 80,
  },
  emptyTitle: {
    color: colors.onSurface,
    fontSize: 17,
    fontWeight: "700",
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  footerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 12,
    paddingVertical: 14,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: colors.brandPrimary,
  },
  shareBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  clearBtn: {
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  clearBtnText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: "700",
  },
}));
