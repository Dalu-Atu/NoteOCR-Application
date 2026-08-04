import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useRef, useState } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  DocumentActionSheet,
  DocumentActionSheetHandle,
} from "@/components/DocumentActionSheet";
import { DocumentCard } from "@/components/DocumentCard";
import EditDocumentBottomSheet, {
  EditDocumentMode,
} from "@/components/Editdocumentbottomsheet";
import FormatBottomSheet from "@/components/FormatBottomSgeet";
import { useAuth } from "@/contexts/AuthContext";
import { useAppTheme } from "../../contexts/ThemeContext";
import { getInitials } from "../../utils/fileVisuals";

type ConvertFormat = "word" | "excel";

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
    emeraldSolid: "#059669",
    emeraldChip: isDark ? "rgba(16,185,129,0.14)" : "#ecfdf5",
    amberChip: isDark ? "rgba(245,158,11,0.14)" : "#fffbeb",
    amber: "#f59e0b",
    ripple: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
    sheetHandle: isDark ? "#475569" : "#e2e8f0",
    overlay: "rgba(15,23,42,0.55)",
  };
}
function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function HomeScreen() {
  const { isDark } = useAppTheme();
  const router = useRouter();
  const { user, documents, overview } = useAuth();
  const [formatSheetVisible, setFormatSheetVisible] = useState(false);
  const [editSheetVisible, setEditSheetVisible] = useState(false);
  const actionSheetRef = useRef<DocumentActionSheetHandle>(null);

  const isFreePlan = user?.plan.toLowerCase() === "free";

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Maps the home screen's theme shape onto the smaller shape the
  // shared DocumentCard / DocumentActionSheet components expect, so
  // they stay decoupled from any one screen's theme object.
  const docTheme = useMemo(
    () => ({
      bg: theme.bg,
      card: theme.card,
      text: theme.textPrimary,
      textMuted: theme.textMuted,
      border: theme.border,
      inputBg: theme.card,
      accent: theme.emerald,
      accentSolid: theme.emeraldSolid,
      accentChip: theme.emeraldChip,
    }),
    [theme],
  );

  const handleFormatSelect = (format: ConvertFormat) => {
    router.push({ pathname: "/scan", params: { format } });
  };

  const handleEditDocumentSelect = (mode: EditDocumentMode) => {
    router.push({ pathname: "/create-document", params: { mode } });
  };

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
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => router.push("/documents")}
            >
              <Feather name="search" size={20} color={theme.iconMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => router.push("/notifications")}
            >
              <Feather name="bell" size={20} color={theme.iconMuted} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. USER GREETING & AVATAR */}
        <View style={styles.userSection}>
          <View>
            <Text style={styles.greetingText}>Hi, {user?.name}</Text>
            <Text style={styles.subGreetingText}>
              Welcome back to your dashboard
            </Text>
          </View>

          <TouchableOpacity
            style={styles.avatarRing}
            activeOpacity={0.85}
            onPress={() => router.push("/account")}
          >
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: hexToRgba(
                    theme.emeraldSolid,
                    isDark ? 0.22 : 0.12,
                  ),
                },
              ]}
            >
              <Text
                style={[styles.avatarInitials, { color: theme.emeraldSolid }]}
              >
                {getInitials(user?.name)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. ACTION CARDS */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.emeraldChip }]}
            activeOpacity={0.85}
            android_ripple={{ color: theme.ripple, borderless: false }}
            onPress={() => setFormatSheetVisible(true)}
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

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.amberChip }]}
            activeOpacity={0.85}
            android_ripple={{ color: theme.ripple, borderless: false }}
            onPress={() => setEditSheetVisible(true)}
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

        {/* 4. RECENT DOCUMENTS — now uses the shared DocumentCard, with
               the same open / rename / move / download / share / delete
               behavior as the Documents screen. */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Documents</Text>
            {documents.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/documents")}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {documents.length === 0 ? (
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
                onPress={() => setFormatSheetVisible(true)}
              >
                <Feather name="camera" size={15} color="#ffffff" />
                <Text style={styles.emptyCtaText}>
                  Scan Your First Document
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.recentList}>
              {documents.slice(0, 5).map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  theme={docTheme}
                  onPress={() =>
                    router.push({
                      pathname: "/documentPreview",
                      params: { folder: doc.folder, fileName: doc.title },
                    })
                  }
                  onMorePress={() => actionSheetRef.current?.open(doc)}
                />
              ))}
            </View>
          )}
        </View>

        {/* 5. OVERVIEW */}
        <View style={styles.overviewCard}>
          <Text style={styles.sectionTitle}>Overview</Text>

          <View style={styles.statChipRow}>
            <View style={styles.statChip}>
              <View style={styles.statChipIcon}>
                <Feather name="file-text" size={15} color={theme.emerald} />
              </View>
              <Text style={styles.statChipValue}>
                {overview?.documentCount}
              </Text>
              <Text style={styles.statChipLabel}>Documents</Text>
            </View>

            <View style={styles.statChip}>
              <View style={styles.statChipIcon}>
                <Feather name="folder" size={15} color={theme.emerald} />
              </View>
              <Text style={styles.statChipValue}>{overview?.folderCount}</Text>
              <Text style={styles.statChipLabel}>Folders</Text>
            </View>
          </View>

          <View style={styles.usagePanel}>
            <View style={styles.usagePanelHeader}>
              <Text style={styles.usagePanelLabel}>Pages remaining</Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{user?.plan}</Text>
              </View>
            </View>

            <Text style={styles.usageHeadline}>{overview?.pagesRemaining}</Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: "28%" }]} />
            </View>

            <Text style={styles.usageFootnote}></Text>

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

      <FormatBottomSheet
        visible={formatSheetVisible}
        theme={theme}
        styles={styles}
        onClose={() => setFormatSheetVisible(false)}
        onSelect={handleFormatSelect}
      />

      <EditDocumentBottomSheet
        visible={editSheetVisible}
        theme={theme}
        styles={styles}
        onClose={() => setEditSheetVisible(false)}
        onSelect={handleEditDocumentSelect}
      />

      <DocumentActionSheet
        ref={actionSheetRef}
        theme={docTheme}
        isFreePlan={isFreePlan}
      />
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
    headerBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      paddingTop:
        Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 14 : 14,
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
      position: "relative",
      left: 3,
    },
    subGreetingText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 5,
      position: "relative",
      left: 3,
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
    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.textPrimary,
      marginBottom: 14,
    },
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
      marginTop: 12,
    },
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
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitials: {
      fontSize: 13.5,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    sheetOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.overlay,
    },
    sheetContainer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === "ios" ? 34 : 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: theme.isDark ? 0.4 : 0.12,
      shadowRadius: 16,
      elevation: 10,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.sheetHandle,
      alignSelf: "center",
      marginBottom: 18,
    },
    sheetTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: theme.textPrimary,
      marginBottom: 4,
    },
    sheetSubtitle: {
      fontSize: 12.5,
      color: theme.textSecondary,
      marginBottom: 18,
    },
    sheetOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    sheetOptionIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      justifyContent: "center",
      alignItems: "center",
    },
    sheetOptionText: {
      flex: 1,
    },
    sheetOptionTitle: {
      fontSize: 14.5,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 2,
    },
    sheetOptionSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    sheetCancel: {
      marginTop: 10,
      paddingVertical: 14,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: theme.divider,
    },
    sheetCancelText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.textSecondary,
    },
  });
}
