import { getTheme } from "@/utils/theme";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;

type ConvertFormat = "word" | "excel";

export default function FormatBottomSheet({
  visible,
  theme,
  styles,
  onClose,
  onSelect,
}: {
  visible: boolean;
  theme: ReturnType<typeof getTheme>;
  styles: ReturnType<typeof createStyles>;
  onClose: () => void;
  onSelect: (format: ConvertFormat) => void;
}) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = (after: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(after);
  };

  const handleClose = () => animateOut(onClose);
  const handleSelect = (format: ConvertFormat) =>
    animateOut(() => {
      // Must close the modal itself, not just navigate — Modal renders
      // as a native overlay above the entire app, so leaving `visible`
      // true here means its (invisible, but still mounted) backdrop
      // keeps intercepting every touch on whatever screen comes next.
      onClose();
      onSelect(format);
    });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onShow={animateIn}
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[styles.sheetOverlay, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={[styles.sheetContainer, { transform: [{ translateY }] }]}
      >
        <View style={styles.sheetHandle} />

        <Text style={styles.sheetTitle}>Convert handwriting</Text>
        <Text style={styles.sheetSubtitle}>
          Choose what you want your notes turned into
        </Text>

        <TouchableOpacity
          style={styles.sheetOption}
          activeOpacity={0.7}
          onPress={() => handleSelect("word")}
        >
          <View
            style={[
              styles.sheetOptionIcon,
              { backgroundColor: theme.amberChip },
            ]}
          >
            <Feather name="file-text" size={20} color={theme.amber} />
          </View>
          <View style={styles.sheetOptionText}>
            <Text style={styles.sheetOptionTitle}>Image to Word</Text>
            <Text style={styles.sheetOptionSubtitle}>
              Extract text into an editable document
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sheetOption}
          activeOpacity={0.7}
          onPress={() => handleSelect("excel")}
        >
          <View
            style={[
              styles.sheetOptionIcon,
              { backgroundColor: theme.emeraldChip },
            ]}
          >
            <Feather name="grid" size={20} color={theme.emerald} />
          </View>
          <View style={styles.sheetOptionText}>
            <Text style={styles.sheetOptionTitle}>Image to Excel</Text>
            <Text style={styles.sheetOptionSubtitle}>
              Convert tables into spreadsheets
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sheetCancel}
          activeOpacity={0.7}
          onPress={handleClose}
        >
          <Text style={styles.sheetCancelText}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
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

    /* FORMAT BOTTOM SHEET */
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
