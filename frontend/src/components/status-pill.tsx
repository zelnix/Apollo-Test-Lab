import { View, Text } from "react-native";

import { makeStyles, useTheme } from "@/src/theme";
import { TestStatus } from "@/src/lib/types";

function colorForStatus(status: TestStatus, colors: ReturnType<typeof useTheme>["colors"]): string {
  switch (status) {
    case "Ready":
      return colors.success;
    case "Running":
      return colors.warning;
    case "Completed":
      return colors.success;
    case "Failed":
      return colors.error;
    case "Cancelled":
      return colors.muted;
    case "Setup required":
      return colors.warning;
  }
}

export function StatusPill({ status, testID }: { status: TestStatus; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const tint = colorForStatus(status, colors);
  return (
    <View style={[styles.pill, { borderColor: tint }]} testID={testID}>
      <View style={[styles.dot, { backgroundColor: tint }]} />
      <Text style={[styles.label, { color: tint }]}>{status}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: colors.surfaceTertiary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
}));
