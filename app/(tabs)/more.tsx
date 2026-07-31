import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/utils/fileVisuals";
import * as StoreReview from "expo-store-review";
import { Alert } from "react-native";
import { ThemeMode, useAppTheme } from "../../contexts/ThemeContext";
import { AppTheme, getTheme } from "../../utils/theme";

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---- Row primitive shared by every settings section ----
function SettingsRow({
  theme,
  icon,
  label,
  value,
  onPress,
  isLast,
  destructive,
}: {
  theme: AppTheme;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  destructive?: boolean;
}) {
  const styles = createRowStyles(theme);
  return (
    <TouchableOpacity
      style={[styles.row, isLast && { borderBottomWidth: 0 }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View
        style={[
          styles.iconTile,
          destructive && { backgroundColor: theme.dangerChip },
        ]}
      >
        <Feather
          name={icon}
          size={17}
          color={destructive ? theme.danger : theme.emerald}
        />
      </View>
      <Text
        style={[styles.label, destructive && { color: theme.danger }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {value && <Text style={styles.value}>{value}</Text>}
      {!destructive && (
        <Feather name="chevron-right" size={16} color={theme.textMuted} />
      )}
    </TouchableOpacity>
  );
}

function createRowStyles(theme: AppTheme) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    iconTile: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: theme.emeraldChip,
      justifyContent: "center",
      alignItems: "center",
    },
    label: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: "600",
      color: theme.textPrimary,
    },
    value: {
      fontSize: 12.5,
      color: theme.textMuted,
      marginRight: 2,
    },
  });
}

// ---- Segmented Light / Dark / System control ----
function ThemeSegmentedControl({
  theme,
  themeMode,
  setThemeMode,
}: {
  theme: AppTheme;
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
}) {
  const options: {
    key: ThemeMode;
    label: string;
    icon: keyof typeof Feather.glyphMap;
  }[] = [
    { key: "light", label: "Light", icon: "sun" },
    { key: "dark", label: "Dark", icon: "moon" },
    { key: "system", label: "Auto", icon: "smartphone" },
  ];

  const styles = createSegmentStyles(theme);

  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const active = themeMode === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[styles.segment, active && styles.segmentActive]}
            activeOpacity={0.8}
            onPress={() => setThemeMode(opt.key)}
          >
            <Feather
              name={opt.icon}
              size={13}
              color={active ? "#ffffff" : theme.textSecondary}
            />
            <Text
              style={[styles.segmentText, active && styles.segmentTextActive]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function createSegmentStyles(theme: AppTheme) {
  return StyleSheet.create({
    track: {
      flexDirection: "row",
      backgroundColor: theme.chip,
      borderRadius: 14,
      padding: 4,
      gap: 4,
    },
    segment: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 5,
      paddingVertical: 9,
      borderRadius: 10,
    },
    segmentActive: {
      backgroundColor: theme.emeraldSolid,
    },
    segmentText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    segmentTextActive: {
      color: "#ffffff",
    },
  });
}

async function handleRateApp() {
  const isAvailable = await StoreReview.isAvailableAsync();
  if (isAvailable) {
    await StoreReview.requestReview(); // shows native in-app rating prompt
  } else {
    // fallback: deep link straight to the store listing
    const url = Platform.select({
      ios: "itms-apps://itunes.apple.com/app/idYOUR_APP_ID?action=write-review",
      android: "market://details?id=YOUR_PACKAGE_NAME",
    });
    if (url) Linking.openURL(url);
  }
}

export default function MoreScreen() {
  const { isDark, themeMode, setThemeMode } = useAppTheme();
  const router = useRouter();
  const { user, logout } = useAuth();

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  function useLogoutHandler() {
    const { logout } = useAuth();
    const router = useRouter();

    return function handleLogout() {
      Alert.alert(
        "Log Out",
        "Are you sure you want to log out?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Log Out",
            style: "destructive",
            onPress: async () => {
              try {
                await logout();
                router.replace("/auth");
              } catch (err) {
                console.error("Logout failed:", err);
                Alert.alert(
                  "Error",
                  "Something went wrong logging out. Please try again.",
                );
              }
            },
          },
        ],
        { cancelable: true },
      );
    };
  }
  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.screenTitle}>Settings</Text>

        {/* 1. PROFILE HEADER — tapping this is how users get to edit
               name/email/password, not a separate menu row */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.85}
          onPress={() => router.push("/account")}
        >
          <View style={styles.avatarRing}>
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
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || "User"}</Text>
            <Text style={styles.profileEmail}>
              {user?.email || "user@example.com"}
            </Text>
          </View>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>
              {user?.plan || "Free Plan"}
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={16}
            color={theme.textMuted}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        {/* 2. PREFERENCES */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <Text style={styles.subLabel}>Appearance</Text>
          <ThemeSegmentedControl
            theme={theme}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
          />

          <View style={{ marginTop: 6 }}>
            {/* <SettingsRow
              theme={theme}
              icon="file-text"
              label="Default Export Format"
              value="PDF"
            /> */}
            {/* <SettingsRow
              theme={theme}
              icon="globe"
              label="Language"
              value="English"
              isLast
            /> */}
          </View>
        </View>

        {/* 3. BILLING */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Billing</Text>
          <SettingsRow
            theme={theme}
            icon="credit-card"
            label="Manage Plan & Billing"
            value="1,548 pages left"
            onPress={() => router.push("/billing")}
            isLast
          />
        </View>

        {/* 4. STORAGE */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <SettingsRow
            theme={theme}
            icon="trash-2"
            label="Trash"
            value="Recently deleted"
            onPress={() => router.push("/trash")}
            isLast
          />
        </View>

        {/* 4. SUPPORT */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingsRow
            theme={theme}
            icon="help-circle"
            label="Help Center"
            onPress={() => Linking.openURL("https://noteocr.com/help")}
          />
          <SettingsRow
            theme={theme}
            icon="mail"
            label="Contact Support"
            onPress={() => Linking.openURL("mailto:support@noteocr.com")}
          />
          <SettingsRow
            theme={theme}
            icon="star"
            label="Rate the App"
            onPress={handleRateApp}
            isLast
          />
        </View>

        {/* 5. LEGAL */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <SettingsRow
            theme={theme}
            icon="shield"
            label="Privacy Policy"
            onPress={() => Linking.openURL("https://noteocr.com/privacy")}
          />
          <SettingsRow
            theme={theme}
            icon="file"
            label="Terms of Service"
            onPress={() => Linking.openURL("https://noteocr.com/terms")}
            isLast
          />
        </View>

        {/* 6. LOGOUT */}
        <View style={styles.card}>
          <SettingsRow
            theme={theme}
            icon="log-out"
            label="Log Out"
            destructive
            onPress={handleLogout}
            isLast
          />
        </View>

        <Text style={styles.versionText}>NoteOCR v1.0.0</Text>
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
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 50,
    },
    screenTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.textPrimary,
      marginTop: 10,
      marginBottom: 18,
    },

    /* PROFILE HEADER */
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 12,
      elevation: theme.isDark ? 0 : 2,
    },
    avatarRing: {
      padding: 2,
      borderRadius: 26,
      borderWidth: 1.5,
      borderColor: theme.emerald,
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
    profileInfo: {
      flex: 1,
      marginLeft: 12,
    },
    profileName: {
      fontSize: 14.5,
      fontWeight: "800",
      color: theme.textPrimary,
      marginBottom: 2,
    },
    profileEmail: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    planBadge: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: theme.emeraldChip,
    },
    planBadgeText: {
      fontSize: 10.5,
      fontWeight: "700",
      color: theme.emerald,
    },

    /* SHARED CARD */
    card: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 18,
      marginBottom: 16,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 12,
      elevation: theme.isDark ? 0 : 2,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: theme.textPrimary,
      marginBottom: 12,
    },
    subLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 8,
    },

    versionText: {
      textAlign: "center",
      fontSize: 11.5,
      color: theme.textMuted,
      marginTop: 4,
    },
  });
}
