import { Feather, Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import FormatBottomSheet from "@/components/FormatBottomSgeet";
import { useAppTheme } from "@/contexts/ThemeContext";
import { getTheme } from "@/utils/theme";
import { useAuth } from "../../contexts/AuthContext";

type ConvertFormat = "word" | "excel";

export default function TabLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { isDark } = useAppTheme();
  const { isLoading, isAuthenticated, hasOnboarded } = useAuth();

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [formatSheetVisible, setFormatSheetVisible] = useState(false);

  const handleFormatSelect = (format: ConvertFormat) => {
    // Hand off to the camera-first capture flow with the chosen format.
    // /scan owns: take photo or choose from library, crop, add pages,
    // then the name + folder bottom sheet, then convert + preview.
    router.push({ pathname: "/scan", params: { format } });
  };

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
              onPress={() => setFormatSheetVisible(true)}
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
            <FormatBottomSheet
              visible={formatSheetVisible}
              theme={theme}
              styles={styles}
              onClose={() => setFormatSheetVisible(false)}
              onSelect={handleFormatSelect}
            />
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
