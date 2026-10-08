import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { makeStyles, useTheme } from "@/src/theme";
import { Scenario, StatusAccent } from "@/src/lib/types";

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
          {!ready && scenario.id !== "stop" ? (
            <View style={styles.setupBadge} testID={`scenario-${scenario.id}-setup`}>
              <MaterialDesignIcons name="alert-circle-outline" size={13} color={colors.warning} />
              <Text style={styles.setupText}>Setup required</Text>
            </View>
          ) : null}
        </View>
        <MaterialDesignIcons name="chevron-right" size={24} color={colors.muted} />
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
    marginTop: 4,
  },
  setupText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "700",
  },
}));
