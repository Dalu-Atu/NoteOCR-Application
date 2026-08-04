import { useAppTheme } from "@/contexts/ThemeContext";
import { Feather } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  title?: string;
  message?: string;
  /** e.g. document filename, shown in the "ready" headline. */
  documentTitle?: string;
  userName?: string;
}

/**
 * Locked-feature paywall, restyled to match the site's conversion pattern:
 * success framing ("ready", checkmark) instead of restriction framing
 * ("locked feature"), plus visible pricing and trust badges so the CTA
 * isn't asking for a blind click.
 */
export function PaywallModal({
  visible,
  onClose,
  onUpgrade,
  title,
  message = "Unlock to export, share, and edit your documents.",
  documentTitle,
  userName,
}: PaywallModalProps) {
  const { isDark } = useAppTheme();

  const theme = {
    overlay: "rgba(0,0,0,0.5)",
    card: isDark ? "#1e293b" : "#ffffff",
    text: isDark ? "#f8fafc" : "#0f172a",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    accent: "#10b981",
    accentSolid: "#059669",
    accentChip: isDark ? "rgba(16,185,129,0.16)" : "#ecfdf5",
    divider: isDark ? "#334155" : "#e2e8f0",
  };

  const resolvedTitle =
    title ??
    (userName && documentTitle
      ? `${userName}, your "${documentTitle}" is ready`
      : documentTitle
        ? `Your "${documentTitle}" is ready`
        : "Your document is ready");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={[styles.badge, { backgroundColor: theme.accentChip }]}>
            <Feather name="check-circle" size={13} color={theme.accent} />
            <Text style={[styles.badgeText, { color: theme.accent }]}>
              CONVERSION COMPLETE
            </Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {resolvedTitle}
          </Text>
          <Text style={[styles.message, { color: theme.textMuted }]}>
            {message}
          </Text>

          <View style={styles.trustRow}>
            <TrustItem
              label="No subscription"
              color={theme.accent}
              textColor={theme.textMuted}
            />
            <TrustItem
              label="Word, Excel & Pdf export"
              color={theme.accent}
              textColor={theme.textMuted}
            />
            <TrustItem
              label="Permanent access"
              color={theme.accent}
              textColor={theme.textMuted}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          <TouchableOpacity
            style={[
              styles.upgradeButton,
              { backgroundColor: theme.accentSolid },
            ]}
            activeOpacity={0.85}
            onPress={onUpgrade}
          >
            <Feather name="download" size={15} color="#ffffff" />
            <Text style={styles.upgradeButtonText}>Unlock & Download</Text>
          </TouchableOpacity>
          <Text style={[styles.priceHint, { color: theme.textMuted }]}>
            100 pages for $12 · use on any doc · never expires
          </Text>

          <TouchableOpacity
            style={styles.notNowButton}
            activeOpacity={0.7}
            onPress={onClose}
          >
            <Text style={[styles.notNowText, { color: theme.textMuted }]}>
              Not now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function TrustItem({
  label,
  color,
  textColor,
}: {
  label: string;
  color: string;
  textColor: string;
}) {
  return (
    <View style={styles.trustItem}>
      <Feather name="check" size={11} color={color} />
      <Text style={[styles.trustText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 14,
  },
  badgeText: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.5 },
  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 16,
  },
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    marginBottom: 16,
  },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  trustText: { fontSize: 11.5, fontWeight: "600" },
  divider: { height: 1, width: "100%", marginBottom: 16 },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
  },
  upgradeButtonText: { color: "#ffffff", fontSize: 14.5, fontWeight: "700" },
  priceHint: { marginTop: 10, fontSize: 11 },
  notNowButton: { marginTop: 10, paddingVertical: 6 },
  notNowText: { fontSize: 13.5, fontWeight: "600" },
});
