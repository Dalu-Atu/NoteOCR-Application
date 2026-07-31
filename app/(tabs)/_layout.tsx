import { Feather, Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { useAuth } from "../../contexts/AuthContext";
import { useAppTheme } from "@/contexts/ThemeContext";


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

export default function TabLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { isDark } = useAppTheme();
  const { isLoading, isAuthenticated, hasOnboarded } = useAuth();

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Still checking AsyncStorage for a stored session/onboarding flag —
  // show a blank loading state rather than flashing the tabs then
  // redirecting a moment later.
  if (isLoading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.emerald} />
      </View>
    );
  }

  // Gate order matters: onboarding first (every new install), then auth.
  if (!hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }
  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ state, navigation }) => {
        const currentRoute = state.routes[state.index].name;

        return (
          <View style={styles.tabBar}>
            {/* 1. Home */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("index")}
              style={styles.tabItem}
            >
              <Ionicons
                name={currentRoute === "index" ? "home" : "home-outline"}
                size={22}
                color={
                  currentRoute === "index" ? theme.emerald : theme.textMuted
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      currentRoute === "index"
                        ? theme.emerald
                        : theme.textMuted,
                  },
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>

            {/* 2. Documents */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("documents")}
              style={styles.tabItem}
            >
              <Ionicons
                name="document-text-outline"
                size={22}
                color={
                  currentRoute === "documents" ? theme.emerald : theme.textMuted
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      currentRoute === "documents"
                        ? theme.emerald
                        : theme.textMuted,
                  },
                ]}
              >
                Documents
              </Text>
            </TouchableOpacity>

            {/* 3. CENTER PLUS BUTTON - Inline Flex Item */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/scan")}
              style={styles.tabItem}
            >
              <View style={styles.plusCircle}>
                <Feather name="plus" size={22} color="#ffffff" />
              </View>
            </TouchableOpacity>

            {/* 4. Folders */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("folders")}
              style={styles.tabItem}
            >
              <Feather
                name="folder"
                size={21}
                color={
                  currentRoute === "folders" ? theme.emerald : theme.textMuted
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      currentRoute === "folders"
                        ? theme.emerald
                        : theme.textMuted,
                  },
                ]}
              >
                Folders
              </Text>
            </TouchableOpacity>

            {/* 5. More */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("more")}
              style={styles.tabItem}
            >
              <Feather
                name="more-horizontal"
                size={22}
                color={
                  currentRoute === "more" ? theme.emerald : theme.textMuted
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      currentRoute === "more" ? theme.emerald : theme.textMuted,
                  },
                ]}
              >
                More
              </Text>
            </TouchableOpacity>
          </View>
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="documents" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="folders" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}

function createStyles(theme: ReturnType<typeof getTheme>) {
  return StyleSheet.create({
    loadingScreen: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    tabBar: {
      flexDirection: "row",
      backgroundColor: theme.card,
      borderTopWidth: theme.isDark ? 1 : 0,
      borderTopColor: theme.border,
      height: Platform.OS === "ios" ? 85 : 68,
      paddingTop: 6,
      paddingBottom: Platform.OS === "ios" ? 24 : 8,
      elevation: theme.isDark ? 0 : 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 4,
    },
    tabItem: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    tabLabel: {
      fontSize: 10,
      fontWeight: "500",
      marginTop: 2,
    },
    plusCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.emeraldSolid,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}
