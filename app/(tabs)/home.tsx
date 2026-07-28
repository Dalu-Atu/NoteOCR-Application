import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAppTheme } from "../../contexts/ThemeContext";
import { MOCK_DOCUMENTS } from "../../data/mockDocuments";
import { getFileVisual } from "../../utils/fileVisuals";

function getTheme(isDark: boolean) {
  return {
    isDark,
    bg: isDark ? "#0f172a" : "#f8fafc",
    card: isDark ? "#1e293b" : "#ffffff",
    chip: isDark ? "#0f172a" : "#f8fafc",
    border: isDark ? "#334155" : "#f1f5f9",
    divider: isDark ? "#334155" : "#f1f5f9",
    textPrimary: isDark ? "#f8fafc" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    textMuted: isDark ? "#64748b" : "#94a3b8",
    iconMuted: isDark ? "#cbd5e1" : "#334155",
    emerald: "#10b981",
    emeraldSolid: "#059669", // slightly deeper — used on solid CTA buttons
    emeraldChip: isDark ? "rgba(16,185,129,0.14)" : "#ecfdf5",
    amberChip: isDark ? "rgba(245,158,11,0.14)" : "#fffbeb",
    amber: "#f59e0b",
    ripple: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
  };
}

export default function HomeScreen() {
  const { isDark } = useAppTheme();
  const router = useRouter();

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. TOP NAVBAR */}
        <View style={styles.headerBar}>
          <View style={styles.logoContainer}>
            <Image
              source={
                isDark
                  ? require("../../assets/images/logo-white.png")
                  : require("../../assets/images/logo-dark.png")
              }
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>NoteOCR</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Feather name="search" size={20} color={theme.iconMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Feather name="bell" size={20} color={theme.iconMuted} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. USER GREETING & AVATAR */}
        <View style={styles.userSection}>
          <View>
            <Text style={styles.greetingText}>Hi, joe</Text>
            <Text style={styles.subGreetingText}>
              Welcome back to your dashboard
            </Text>
          </View>

          <View style={styles.avatarRing}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
              }}
              style={styles.avatar}
            />
          </View>
        </View>

        {/* 3. ACTION CARDS — emerald is the brand/primary card, amber only supports it */}
        <View style={styles.actionRow}>
          {/* Card 1: Convert Handwriting — emerald, the primary action */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.emeraldChip }]}
            activeOpacity={0.85}
            android_ripple={{ color: theme.ripple, borderless: false }}
            onPress={() => router.push("/scan")}
          >
            <View style={styles.watermarkClip}>
              <Feather
                name="edit-3"
                size={80}
                color={theme.emerald}
                style={styles.watermarkIcon}
              />
            </View>

            <View style={styles.cardTopRow}>
              <View
                style={[styles.iconBadge, { backgroundColor: theme.emerald }]}
              >
                <Feather name="edit-3" size={19} color="#ffffff" />
              </View>
              <View style={styles.chevronButton}>
                <Feather name="chevron-right" size={14} color={theme.emerald} />
              </View>
            </View>

            <Text
              style={styles.actionCardTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Convert Handwriting
            </Text>
            <Text style={styles.actionCardSubtitle} numberOfLines={2}>
              Upload images to convert them into editable documents.
            </Text>
          </TouchableOpacity>

          {/* Card 2: Edit Document — amber, purely a supporting/secondary action */}
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.amberChip }]}
            activeOpacity={0.85}
            android_ripple={{ color: theme.ripple, borderless: false }}
          >
            <View style={styles.watermarkClip}>
              <Feather
                name="file-text"
                size={80}
                color={theme.amber}
                style={styles.watermarkIcon}
              />
            </View>

            <View style={styles.cardTopRow}>
              <View
                style={[styles.iconBadge, { backgroundColor: theme.amber }]}
              >
                <Feather name="file-text" size={19} color="#ffffff" />
              </View>
              <View style={styles.chevronButton}>
                <Feather name="chevron-right" size={14} color={theme.amber} />
              </View>
            </View>

            <Text
              style={styles.actionCardTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Edit Document
            </Text>
            <Text style={styles.actionCardSubtitle} numberOfLines={2}>
              Upload a document or start from a blank slate.
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. RECENT DOCUMENTS — comes before Overview; users care about their
               files first, stats second. */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Documents</Text>
            {MOCK_DOCUMENTS.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/documents")}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {MOCK_DOCUMENTS.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Feather name="file-plus" size={24} color={theme.emerald} />
              </View>
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <Text style={styles.emptySubtitle}>
                Turn handwritten notes into clean, editable documents in
                seconds. Scan your first page to see NoteOCR in action.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                activeOpacity={0.85}
                onPress={() => router.push("/scan")}
              >
                <Feather name="camera" size={15} color="#ffffff" />
                <Text style={styles.emptyCtaText}>
                  Scan Your First Document
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.recentList}>
              {MOCK_DOCUMENTS.slice(0, 5).map((doc, i) => {
                const visual = getFileVisual(doc.title);
                return (
                  <TouchableOpacity
                    key={doc.id}
                    style={[
                      styles.recentRow,
                      i === MOCK_DOCUMENTS.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.recentIconTile}>
                      <MaterialCommunityIcons
                        name={visual.icon}
                        size={30}
                        color={visual.color}
                      />
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentName} numberOfLines={1}>
                        {doc.title}
                      </Text>
                      <Text style={styles.recentMeta}>
                        {doc.date} · {doc.folder}
                      </Text>
                    </View>
                    <Feather
                      name="more-vertical"
                      size={16}
                      color={theme.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 5. OVERVIEW — nested bento: small stat chips + a distinct
               "usage panel" with a headline number, not a plain bar+label. */}
        <View style={styles.overviewCard}>
          <Text style={styles.sectionTitle}>Overview</Text>

          <View style={styles.statChipRow}>
            <View style={styles.statChip}>
              <View style={styles.statChipIcon}>
                <Feather name="file-text" size={15} color={theme.emerald} />
              </View>
              <Text style={styles.statChipValue}>25</Text>
              <Text style={styles.statChipLabel}>Documents</Text>
            </View>

            <View style={styles.statChip}>
              <View style={styles.statChipIcon}>
                <Feather name="folder" size={15} color={theme.emerald} />
              </View>
              <Text style={styles.statChipValue}>4</Text>
              <Text style={styles.statChipLabel}>Folders</Text>
            </View>
          </View>

          <View style={styles.usagePanel}>
            <View style={styles.usagePanelHeader}>
              <Text style={styles.usagePanelLabel}>Pages remaining</Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>Pro Plan</Text>
              </View>
            </View>

            <Text style={styles.usageHeadline}>3,584</Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: "28%" }]} />
            </View>

            <Text style={styles.usageFootnote}>
              1,416 of 5,000 pages used this month
            </Text>

            <TouchableOpacity
              style={styles.primaryUsageButton}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={14} color="#ffffff" />
              <Text style={styles.primaryUsageButtonText}>Add More Pages</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof getTheme>) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 50,
    },

    /* HEADER NAVBAR */
    headerBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
    },
    logoContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    logoImage: {
      width: 28,
      height: 28,
    },
    logoText: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.textPrimary,
      letterSpacing: -0.4,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    iconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: "center",
      alignItems: "center",
    },
    notifDot: {
      position: "absolute",
      top: 8,
      right: 9,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.emerald,
      borderWidth: 1.5,
      borderColor: theme.bg,
    },

    /* USER SECTION */
    userSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 16,
      marginBottom: 20,
    },
    greetingText: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.textPrimary,
    },
    subGreetingText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 5,
    },
    avatarRing: {
      padding: 2,
      borderRadius: 26,
      borderWidth: 1.5,
      borderColor: theme.emerald,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 22,
    },

    /* ACTION CARDS */
    actionRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 20,
    },
    actionCard: {
      flex: 1,
      height: 168,
      borderRadius: 24,
      padding: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: theme.isDark ? 0.25 : 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    watermarkClip: {
      position: "absolute",
      right: -18,
      bottom: -18,
      opacity: theme.isDark ? 0.16 : 0.1,
    },
    watermarkIcon: {
      transform: [{ rotate: "-8deg" }],
    },
    cardTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    chevronButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.isDark
        ? "rgba(255,255,255,0.1)"
        : "rgba(255,255,255,0.7)",
      justifyContent: "center",
      alignItems: "center",
    },
    iconBadge: {
      width: 40,
      height: 40,
      borderRadius: 13,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: theme.isDark ? 0.3 : 0.15,
      shadowRadius: 5,
      elevation: 3,
    },
    actionCardTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: theme.textPrimary,
      marginBottom: 6,
    },
    actionCardSubtitle: {
      fontSize: 11.5,
      color: theme.textSecondary,
      lineHeight: 16,
    },

    /* SHARED SECTION TITLE */
    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.textPrimary,
      marginBottom: 14,
    },

    /* RECENT DOCUMENTS */
    recentSection: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 20,
      marginBottom: 16,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 12,
      elevation: theme.isDark ? 0 : 2,
    },
    recentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 0,
    },
    viewAllText: {
      fontSize: 12.5,
      fontWeight: "700",
      color: theme.emerald,
    },
    recentList: {
      marginTop: -4,
    },
    recentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    recentIconTile: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.chip,
      justifyContent: "center",
      alignItems: "center",
    },
    recentInfo: {
      flex: 1,
    },
    recentName: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 2,
    },
    recentMeta: {
      fontSize: 11.5,
      color: theme.textMuted,
    },

    /* EMPTY STATE — conversion-oriented */
    emptyState: {
      alignItems: "center",
      paddingVertical: 24,
      paddingHorizontal: 12,
    },
    emptyIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.emeraldChip,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: theme.textPrimary,
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 12.5,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 18,
      maxWidth: 260,
    },
    emptyCta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.emeraldSolid,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 14,
      shadowColor: theme.emerald,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 3,
    },
    emptyCtaText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "700",
    },

    /* OVERVIEW */
    overviewCard: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 12,
      elevation: theme.isDark ? 0 : 2,
    },

    /* Stat chips — small bento tiles */
    statChipRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 14,
    },
    statChip: {
      flex: 1,
      backgroundColor: theme.chip,
      borderRadius: 16,
      padding: 14,
    },
    statChipIcon: {
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: theme.emeraldChip,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
    },
    statChipValue: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.textPrimary,
      marginBottom: 2,
    },
    statChipLabel: {
      fontSize: 11.5,
      color: theme.textSecondary,
    },

    /* Usage panel — nested block, headline number treatment */
    usagePanel: {
      backgroundColor: theme.chip,
      borderRadius: 18,
      padding: 18,
    },
    usagePanelHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    usagePanelLabel: {
      fontSize: 12.5,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    planBadge: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    planBadgeText: {
      fontSize: 10.5,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    usageHeadline: {
      fontSize: 34,
      fontWeight: "800",
      color: theme.textPrimary,
      letterSpacing: -1,
      marginBottom: 14,
    },
    progressTrack: {
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.card,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 4,
      backgroundColor: theme.emerald,
    },
    usageFootnote: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 8,
      marginBottom: 16,
    },
    primaryUsageButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.emeraldSolid,
      paddingVertical: 13,
      borderRadius: 14,
    },
    primaryUsageButtonText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "700",
    },
  });
}
