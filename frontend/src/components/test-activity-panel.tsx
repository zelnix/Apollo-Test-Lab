import { Text, View } from "react-native";

import { StatusPill } from "@/src/components/status-pill";
import { formatClock, formatElapsed } from "@/src/lib/scenarios";
import { TestActivity } from "@/src/lib/types";
import { makeStyles } from "@/src/theme";

function Row({ label, value, testID }: { label: string; value: string; testID?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} testID={testID} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

export function TestActivityPanel({ activity }: { activity: TestActivity }) {
  const styles = useStyles();
  return (
    <View style={styles.panel} testID="test-activity-panel">
      <View style={styles.header}>
        <Text style={styles.heading}>Test Activity</Text>
        <StatusPill status={activity.status} testID="activity-status-pill" />
      </View>
      <View style={styles.divider} />
      <Row label="Scenario" value={activity.scenarioLabel} testID="activity-scenario" />
      <Row label="Start Time" value={formatClock(activity.startTime)} testID="activity-start-time" />
      <Row label="Destination" value={activity.destination || "—"} testID="activity-destination" />
      <Row label="Status" value={activity.status} testID="activity-status" />
      <Row label="Elapsed" value={formatElapsed(activity.elapsedMs)} testID="activity-elapsed" />
      <Row label="Observed Outcome" value={activity.outcome} testID="activity-outcome" />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  panel: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: {
    color: colors.onSurface,
    fontSize: 19,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 7,
    gap: 12,
  },
  rowLabel: {
    color: colors.muted,
    fontSize: 14,
    width: 120,
  },
  rowValue: {
    color: colors.onSurface,
    fontSize: 14,
    flex: 1,
    lineHeight: 19,
  },
}));
