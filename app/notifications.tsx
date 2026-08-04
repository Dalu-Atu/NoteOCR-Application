import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAppTheme } from "../contexts/ThemeContext";

function getTheme(isDark: boolean) {
  return {
    isDark,
    bg: isDark ? "#0f172a" : "#f8fafc",
    card: isDark ? "#1e293b" : "#ffffff",
    border: isDark ? "#334155" : "#f1f5f9",
    textPrimary: isDark ? "#f8fafc" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    textMuted: isDark ? "#64748b" : "#94a3b8",
    iconMuted: isDark ? "#cbd5e1" : "#334155",
    emerald: "#10b981",
    emeraldChip: isDark ? "rgba(16,185,129,0.14)" : "#ecfdf5",
    ripple: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
  };
}

export default function NotificationsScreen() {
  const { isDark } = useAppTheme();
  const router = useRouter();

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      barStyle={isDark ? "light-content" : "dark-content"}
      backgroundColor={'red'}
      {/* HEADER */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={22} color={theme.iconMuted} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        {/* Spacer to balance the back button so the title stays centered */}
        <View style={styles.backButton} />
      </View>
      {/* EMPTY / CAUGHT-UP STATE */}
      <View style={styles.emptyState}>
        <View style={styles.emptyIconCircle}>
          <Feather name="bell" size={26} color={theme.emerald} />
        </View>
        <Text style={styles.emptyTitle}>You're all caught up</Text>
        <Text style={styles.emptySubtitle}>
          No new notifications right now. We'll let you know as soon as
          something needs your attention.
        </Text>
      </View>
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
    headerBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.textPrimary,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 40,
      marginTop: -60,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.emeraldChip,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 18,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: theme.textPrimary,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 19,
      maxWidth: 260,
    },
  });
}
