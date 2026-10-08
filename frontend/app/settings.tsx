import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DEFAULT_CONFIG, loadConfig, saveConfig } from "@/src/lib/config";
import { isValidHostname, isValidHttpsUrl } from "@/src/lib/scenarios";
import { LabConfig } from "@/src/lib/types";
import { makeStyles, useTheme } from "@/src/theme";

type FieldKind = "url" | "hostname";

type FieldDef = {
  key: keyof LabConfig;
  label: string;
  kind: FieldKind;
  placeholder: string;
  helper: string;
  optional?: boolean; // blank is allowed (reports Setup required)
};

const FIELDS: FieldDef[] = [
  {
    key: "phishingUrl",
    label: "Phishing Link URL",
    kind: "url",
    placeholder: "https://...",
    helper: "Harmless demo phishing page opened in the Android browser. Must be HTTPS.",
  },
  {
    key: "maliciousDomain",
    label: "Malicious Domain (hostname)",
    kind: "hostname",
    placeholder: "e.g. test.example.com",
    helper: "Bare hostname for a real Android system DNS lookup. Use only an authorized lab domain.",
    optional: true,
  },
  {
    key: "suspiciousUrl",
    label: "Suspicious Connection URL",
    kind: "url",
    placeholder: "https://...",
    helper: "Approved HTTPS endpoint for a bounded request on the device's normal network path.",
    optional: true,
  },
  {
    key: "redirectUrl",
    label: "Redirect URL",
    kind: "url",
    placeholder: "https://...",
    helper: "HTTPS endpoint that issues redirects. Threat Lab records the final URL.",
  },
  {
    key: "safeTrafficUrl",
    label: "Safe Traffic URL",
    kind: "url",
    placeholder: "https://example.com",
    helper: "Negative control. A normal HTTPS GET that should succeed without any threat claim.",
  },
];

function isFieldValid(kind: FieldKind, value: string, optional?: boolean): boolean {
  const v = value.trim();
  if (v.length === 0) return Boolean(optional);
  return kind === "url" ? isValidHttpsUrl(v) : isValidHostname(v);
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();

  const [values, setValues] = useState<LabConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig().then(setValues);
  }, []);

  const update = useCallback((key: keyof LabConfig, text: string) => {
    setSaved(false);
    setValues((v) => ({ ...v, [key]: text }));
  }, []);

  const allValid = FIELDS.every((f) => isFieldValid(f.kind, values[f.key], f.optional));

  const handleSave = useCallback(async () => {
    const trimmed: LabConfig = {
      phishingUrl: values.phishingUrl.trim(),
      maliciousDomain: values.maliciousDomain.trim(),
      suspiciousUrl: values.suspiciousUrl.trim(),
      redirectUrl: values.redirectUrl.trim(),
      safeTrafficUrl: values.safeTrafficUrl.trim(),
    };
    await saveConfig(trimmed);
    setValues(trimmed);
    setSaved(true);
  }, [values]);

  const handleReset = useCallback(() => {
    setSaved(false);
    setValues(DEFAULT_CONFIG);
  }, []);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          testID="settings-back-button"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <MaterialDesignIcons name="arrow-left" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Configure the HTTPS URLs and hostnames used by each test. Targets are stored locally on
          this device. Tests with no valid target report &quot;Setup required&quot; instead of a
          fake result.
        </Text>

        {FIELDS.map((f) => {
          const value = values[f.key];
          const valid = isFieldValid(f.kind, value, f.optional);
          const blankOptional = value.trim().length === 0 && f.optional;
          return (
            <View key={f.key} style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{f.label}</Text>
                {blankOptional ? (
                  <Text style={styles.setupTag}>Setup required</Text>
                ) : valid ? (
                  <MaterialDesignIcons name="check-circle" size={16} color={colors.success} />
                ) : (
                  <MaterialDesignIcons name="alert-circle" size={16} color={colors.error} />
                )}
              </View>
              <TextInput
                testID={`settings-input-${f.key}`}
                value={value}
                onChangeText={(t) => update(f.key, t)}
                placeholder={f.placeholder}
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={f.kind === "url" ? "url" : "default"}
                style={[styles.input, !valid && !blankOptional && styles.inputInvalid]}
              />
              <Text style={styles.helper}>{f.helper}</Text>
            </View>
          );
        })}

        <Pressable
          testID="settings-save-button"
          accessibilityRole="button"
          onPress={handleSave}
          disabled={!allValid}
          style={({ pressed }) => [
            styles.saveButton,
            !allValid && styles.saveButtonDisabled,
            pressed && allValid && styles.pressed,
          ]}
        >
          <MaterialDesignIcons name="content-save-outline" size={20} color={colors.onBrandPrimary} />
          <Text style={styles.saveButtonText}>{saved ? "Saved" : "Save Configuration"}</Text>
        </Pressable>

        <Pressable
          testID="settings-reset-button"
          accessibilityRole="button"
          onPress={handleReset}
          style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
        >
          <Text style={styles.resetButtonText}>Restore defaults</Text>
        </Pressable>
      </KeyboardAwareScrollView>
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
  content: {
    padding: 18,
    gap: 18,
  },
  intro: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: colors.onSurface,
    fontSize: 15,
    fontWeight: "700",
  },
  setupTag: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.onSurface,
    fontSize: 15,
  },
  inputInvalid: {
    borderColor: colors.error,
  },
  helper: {
    color: colors.muted,
    fontSize: 12.5,
    lineHeight: 17,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.brandPrimary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 6,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: colors.onBrandPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  resetButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  resetButtonText: {
    color: colors.subtitle,
    fontSize: 14,
    fontWeight: "600",
  },
}));
