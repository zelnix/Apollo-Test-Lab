// Design tokens for Apollo Threat Lab. Dark navy cybersecurity theme.
//
// The keys match the "color" block of the design. A plain key is a background,
// and its `on` partner is the text/icon color that sits on top of it. Always
// use them as a pair. Build StyleSheets with makeStyles(); read
// useTheme().colors for non-style color props (icon color, ActivityIndicator).
//
// This app is navy-dark on every device: the single `light` scheme below holds
// the navy palette and setColorScheme pins it, so the device setting never
// flips it to a white theme.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // Surfaces -----------------------------------------------------------------
  surface: "#0A1120", // deep navy canvas
  onSurface: "#FFFFFF", // primary white text
  surfaceSecondary: "#111C30", // cards, panels
  onSurfaceSecondary: "#E6EDF5",
  surfaceTertiary: "#16233B", // inputs, chips, nested fills
  onSurfaceTertiary: "#C3D0E0",
  surfaceInverse: "#F3F4F6",
  onSurfaceInverse: "#0A1120",
  muted: "#8A9BB3", // captions, timestamps, secondary labels

  // Brand --------------------------------------------------------------------
  brand: "#2E72C8", // Apollo blue
  onBrand: "#FFFFFF",
  brandPrimary: "#2E72C8",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#16233B",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#16233B",
  onBrandTertiary: "#C3D0E0",

  // Status -------------------------------------------------------------------
  success: "#34C759",
  onSuccess: "#05240F",
  warning: "#F5A623",
  onWarning: "#241A05",
  error: "#FF4D4D",
  onError: "#2A0808",
  info: "#5B9BD5",
  onInfo: "#06121F",

  // Lines --------------------------------------------------------------------
  border: "#1E2B45",
  borderStrong: "#2B3C5C",
  divider: "#1A2740",

  // App-specific accents (same in light/dark, intentional literals) ----------
  subtitle: "#5B9BD5", // blue subtitle under the header
  tintRed: "rgba(255,77,77,0.12)",
  tintAmber: "rgba(245,166,35,0.10)",
  tintGreen: "rgba(52,199,89,0.12)",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
