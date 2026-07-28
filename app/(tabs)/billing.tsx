import { useAppTheme } from "@/contexts/ThemeContext";
import { AppTheme, getTheme } from "@/utils/theme";
import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Tier = {
  key: string;
  name: string;
  perPage: string;
  price: string;
  pageCount: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

const TIERS: Tier[] = [
  {
    key: "starter",
    name: "Starter",
    perPage: "$0.120/page",
    price: "$12",
    pageCount: "100 pages",
    description: "Upload a photo, get a Word doc. Done in seconds.",
    features: [
      "100 pages — never expire",
      "Export to Word or Excel",
      "Works in any language",
      "Convert any image to doc",
      "Access our online editor",
      "Import doc + add image to it",
    ],
  },
  {
    key: "plus",
    name: "Plus",
    perPage: "$0.083/page",
    price: "$25",
    pageCount: "300 pages",
    description:
      "Messy handwriting, mixed tables, chaotic notes — all cleaned up and formatted.",
    features: [
      "300 pages — never expire",
      "Handwriting → clean text / tables",
      "Scattered tables → formatted Excel",
      "Batch convert 10 images at once",
      "Multi-language support",
      "Full access to online editor",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    perPage: "$0.050/page",
    price: "$50",
    pageCount: "1,000 pages",
    description:
      "Math formulas, handwriting, tables, historic letters, mixed layouts — the most accurate plan we offer.",
    features: [
      "1,000 pages — never expire",
      "Math & formula recognition",
      "Highest accuracy OCR engine",
      "Whole books in one go",
      "Handwriting + tables + layouts",
      "Batch convert 5 images at once",
      "PDF to Word conversion",
      "Priority processing queue",
    ],
    highlighted: true,
  },
];

export default function BillingScreen() {
  const { isDark } = useAppTheme();
  const router = useRouter();
  const [activeTierKey, setActiveTierKey] = useState("pro");

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const activeTier = TIERS.find((t) => t.key === activeTierKey)!;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan & Billing</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Balance — one clean card, no separate greeting block above it */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <View style={styles.securedPill}>
              <Feather name="lock" size={10} color={theme.emerald} />
              <Text style={styles.securedPillText}>Stripe Secured</Text>
            </View>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceNumber}>1,548</Text>
            <Text style={styles.balanceUnit}>pages</Text>
          </View>
          <Text style={styles.balanceFootnote}>
            Pay once · credits never expire or reset
          </Text>
        </View>

        {/* Value proposition — one slim banner, not a full card */}
        <View style={styles.valueBanner}>
          <Feather name="trending-up" size={15} color={theme.emerald} />
          <Text style={styles.valueBannerText}>
            <Text style={styles.valueBannerBold}>$50 once, yours forever</Text>
            {"  ·  others charge $49/month and reset every 30 days"}
          </Text>
        </View>

        {/* Tier switcher — same segmented-control language as the theme
            picker in Settings, so it feels native to the app rather than
            a one-off pattern */}
        <View style={styles.tabTrack}>
          {TIERS.map((tier) => {
            const active = tier.key === activeTierKey;
            return (
              <TouchableOpacity
                key={tier.key}
                style={[styles.tab, active && styles.tabActive]}
                activeOpacity={0.8}
                onPress={() => setActiveTierKey(tier.key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tier.name}
                </Text>
                {tier.highlighted && (
                  <View
                    style={[
                      styles.tabStarDot,
                      { backgroundColor: active ? "#ffffff" : theme.emerald },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Single detail panel for the selected tier only */}
        <View style={styles.tierPanel}>
          <View style={styles.tierPriceRow}>
            <View>
              <Text style={styles.tierPrice}>
                {activeTier.price}
                <Text style={styles.tierPriceSuffix}> one-time</Text>
              </Text>
              <Text style={styles.tierPageCount}>
                {activeTier.pageCount} · never expire
              </Text>
            </View>
            <Text style={styles.tierPerPage}>{activeTier.perPage}</Text>
          </View>

          <Text style={styles.tierDescription}>{activeTier.description}</Text>

          <View style={styles.divider} />

          <View style={styles.featureList}>
            {activeTier.features.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Feather name="check" size={13} color={theme.emerald} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85}>
            <Text style={styles.ctaButtonText}>Get {activeTier.pageCount}</Text>
          </TouchableOpacity>
          <Text style={styles.ctaFootnote}>
            No subscription · Instant access
          </Text>
        </View>

        {/* Bottom trust row — appears once, not duplicated */}
        <View style={styles.bottomTrustRow}>
          {[
            { icon: "zap", label: "Instant Delivery" },
            { icon: "infinity", label: "Never Expires" },
            { icon: "slash", label: "No Auto-Renewals" },
          ].map((item) => (
            <View key={item.label} style={styles.bottomTrustItem}>
              <Feather
                name={item.icon as keyof typeof Feather.glyphMap}
                size={14}
                color={theme.textMuted}
              />
              <Text style={styles.bottomTrustText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    backButton: {
      width: 34,
      height: 34,
      justifyContent: "center",
      alignItems: "flex-start",
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.textPrimary,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 50,
    },

    /* Balance card */
    balanceCard: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 18,
      marginBottom: 12,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 12,
      elevation: theme.isDark ? 0 : 2,
    },
    balanceTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    balanceLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    securedPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.emeraldChip,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
    },
    securedPillText: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.emerald,
    },
    balanceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
    },
    balanceNumber: {
      fontSize: 34,
      fontWeight: "800",
      color: theme.textPrimary,
      letterSpacing: -1,
    },
    balanceUnit: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    balanceFootnote: {
      fontSize: 11.5,
      color: theme.textMuted,
      marginTop: 4,
    },

    /* Value banner — single slim line, not a card */
    valueBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 4,
      marginBottom: 20,
    },
    valueBannerText: {
      flex: 1,
      fontSize: 11.5,
      color: theme.textSecondary,
      lineHeight: 16,
    },
    valueBannerBold: {
      fontWeight: "800",
      color: theme.textPrimary,
    },

    /* Tab switcher */
    tabTrack: {
      flexDirection: "row",
      backgroundColor: theme.chip,
      borderRadius: 14,
      padding: 4,
      gap: 4,
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 5,
      paddingVertical: 10,
      borderRadius: 10,
    },
    tabActive: {
      backgroundColor: theme.emeraldSolid,
    },
    tabText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    tabTextActive: {
      color: "#ffffff",
    },
    tabStarDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },

    /* Tier detail panel */
    tierPanel: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 20,
      marginBottom: 20,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 12,
      elevation: theme.isDark ? 0 : 2,
    },
    tierPriceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    tierPrice: {
      fontSize: 30,
      fontWeight: "800",
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },
    tierPriceSuffix: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    tierPageCount: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    tierPerPage: {
      fontSize: 11.5,
      fontWeight: "600",
      color: theme.textMuted,
      marginTop: 4,
    },
    tierDescription: {
      fontSize: 12.5,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    divider: {
      height: 1,
      backgroundColor: theme.divider,
      marginVertical: 16,
    },
    featureList: {
      gap: 10,
      marginBottom: 20,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    featureText: {
      fontSize: 12.5,
      color: theme.textPrimary,
      flex: 1,
    },
    ctaButton: {
      backgroundColor: theme.emeraldSolid,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 8,
    },
    ctaButtonText: {
      fontSize: 13.5,
      fontWeight: "700",
      color: "#ffffff",
    },
    ctaFootnote: {
      textAlign: "center",
      fontSize: 10.5,
      color: theme.textMuted,
    },

    /* Bottom trust row */
    bottomTrustRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    bottomTrustItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    bottomTrustText: {
      fontSize: 10.5,
      color: theme.textMuted,
    },
  });
}
