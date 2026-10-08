import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { CATEGORY_META } from "@/src/lib/scenarios";
import { Scenario, StatusAccent, TestCategory } from "@/src/lib/types";
import { makeStyles, useTheme } from "@/src/theme";

function accentColor(accent: StatusAccent, colors: ReturnType<typeof useTheme>["colors"]): string {
  if (accent === "error") return colors.error;
  if (accent === "warning") return colors.warning;
  return colors.success;
}

function tintColor(accent: StatusAccent, colors: ReturnType<typeof useTheme>["colors"]): string {
  if (accent === "error") return colors.tintRed;
  if (accent === "warning") return colors.tintAmber;
  return colors.tintGreen;
}

function toneColor(
  tone: (typeof CATEGORY_META)[TestCategory]["tone"],
  colors: ReturnType<typeof useTheme>["colors"],
): string {
  if (tone === "warning") return colors.warning;
  if (tone === "success") return colors.success;
  if (tone === "info") return colors.info;
  return colors.muted;
}

type Props = {
  scenario: Scenario;
  ready: boolean; // false = Setup required
  disabled: boolean; // another test running
  onPress: () => void;
};

export function ScenarioCard({ scenario, ready, disabled, onPress }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const accent = accentColor(scenario.accent, colors);
  const tint = tintColor(scenario.accent, colors);
  const dim = disabled;
  const cat = CATEGORY_META[scenario.category];
  const catColor = toneColor(cat.tone, colors);

  return (
    <Pressable
      testID={`scenario-${scenario.id}`}
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.pressable, pressed && !disabled && styles.pressed, dim && styles.dim]}
    >
      <LinearGradient
        colors={[tint, colors.surfaceSecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={[styles.iconWrap, { borderColor: accent }]}>
          <MaterialDesignIcons name={scenario.icon as never} size={26} color={accent} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>{scenario.label}</Text>
          <Text style={styles.desc}>{scenario.description}</Text>
          <View style={styles.tagsRow}>
            {scenario.category !== "action" ? (
              <View style={[styles.catTag, { borderColor: catColor }]} testID={`scenario-${scenario.id}-category`}>
                <View style={[styles.catDot, { backgroundColor: catColor }]} />
                <Text style={[styles.catText, { color: catColor }]}>{cat.label}</Text>
              </View>
            ) : null}
            {!ready && scenario.id !== "stop" ? (
              <View style={styles.setupBadge} testID={`scenario-${scenario.id}-setup`}>
                <MaterialDesignIcons name="alert-circle-outline" size={13} color={colors.warning} />
                <Text style={styles.setupText}>Setup required</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={[styles.testBtn, { borderColor: accent, backgroundColor: tint }]} testID={`scenario-${scenario.id}-run`}>
          <Text style={[styles.testBtnText, { color: accent }]}>
            {scenario.id === "stop" ? "Stop" : "Test"}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  pressable: {
    borderRadius: 16,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  dim: {
    opacity: 0.45,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.onSurface,
    fontSize: 17,
    fontWeight: "700",
  },
  desc: {
    color: colors.muted,
    fontSize: 13.5,
    lineHeight: 18,
  },
  setupBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  setupText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "700",
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  catTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  testBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 68,
  },
  testBtnText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
}));
