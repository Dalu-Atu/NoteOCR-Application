import { useAppTheme } from "@/contexts/ThemeContext";
import { getTheme } from "@/utils/theme";
import { Feather } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface LockedPreviewOverlayProps {
  onUpgrade: () => void;
  documentTitle?: string;
  userName?: string;
}

/**
 * Bottom sell-card for free-plan users. Deliberately does NOT dim or blur
 * the document content above it — for an OCR product, the transcribed
 * text needs to stay fully legible so the preview itself sells accuracy.
 * The fade band transitions using the page's own background color (not a
 * dark scrim), so at worst it fades to white before the card — it never
 * reads as "hiding" text. Page 1 for free users already has whitespace
 * below the transcribed block (see viewer.html locked-mode cap), so this
 * band should land in that margin, not across any real content.
 */
export function LockedPreviewOverlay({
  onUpgrade,
  documentTitle,
  userName,
}: LockedPreviewOverlayProps) {
  const { isDark } = useAppTheme();
  const theme = getTheme(isDark);

  const slideAnim = useRef(new Animated.Value(24)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Page background as an rgb triplet so we can step its alpha 0 -> 1.
  // This should match viewer.html's <body> background (#eef0f2 light).
  const pageBg = isDark ? "15,23,42" : "238,240,242";

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {/* Fades to the page's own bg color, not a dark tint — never dims
          real text, just tapers the page into the card below it. */}
      <View style={styles.fadeStack} pointerEvents="none">
        {[0.15, 0.4, 0.7, 1].map((alpha, i) => (
          <View
            key={i}
            style={[
              styles.fadeBand,
              { backgroundColor: `rgba(${pageBg},${alpha})` },
            ]}
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? "rgba(15,23,42,0.98)"
              : "rgba(255,255,255,0.98)",
            borderColor: theme.divider,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: theme.emeraldChip }]}>
            <Feather name="check-circle" size={12} color={theme.emeraldSolid} />
            <Text style={[styles.badgeText, { color: theme.emeraldSolid }]}>
              PREVIEW READY
            </Text>
          </View>
        </View>

        <Text
          style={[styles.title, { color: theme.textPrimary }]}
          numberOfLines={2}
        >
          {userName && documentTitle
            ? `Hi ${userName.split(" ")[0]}, your document is ready`
            : documentTitle
              ? `"${documentTitle}" is ready`
              : "Your document is ready"}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Unlock to view every page, edit, and download.
        </Text>

        <View style={styles.trustRow}>
          <TrustItem
            label="No subscription"
            color={theme.emeraldSolid}
            textColor={theme.textMuted}
          />
          <TrustItem
            label="Permanent access"
            color={theme.emeraldSolid}
            textColor={theme.textMuted}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.upgradeButton,
            { backgroundColor: theme.emeraldSolid },
          ]}
          activeOpacity={0.85}
          onPress={onUpgrade}
        >
          <Feather name="download" size={15} color="#ffffff" />
          <Text style={styles.upgradeButtonText}>Unlock & Download</Text>
        </TouchableOpacity>
        <Text style={[styles.priceHint, { color: theme.textMuted }]}>
          From $12 for 100 pages · never expires
        </Text>
      </Animated.View>
    </View>
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
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0 },
  fadeStack: { height: 70, flexDirection: "column-reverse" },
  fadeBand: { flex: 1 },
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  badgeRow: { marginBottom: 10 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.5 },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: "center",
    marginBottom: 12,
  },
  trustRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  trustText: { fontSize: 11, fontWeight: "600" },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  upgradeButtonText: { color: "#ffffff", fontSize: 14.5, fontWeight: "700" },
  priceHint: { marginTop: 8, fontSize: 10.5 },
});
