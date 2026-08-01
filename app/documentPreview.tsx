// app/(tabs)/documentPreview.tsx
import { useMemo, useState } from "react";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";

import { useAuth } from "@/contexts/AuthContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { AppTheme, getTheme } from "@/utils/theme";

export default function DocumentPreviewScreen() {
  const { folder, fileName } = useLocalSearchParams<{
    folder: string;
    fileName: string;
  }>();
  const { user, token } = useAuth();
  const router = useRouter();
  const { isDark } = useAppTheme();

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Raw PDF endpoint — this already carries the token as a query param,
  // so the backend's existing auth check on preview-document keeps working
  // unchanged. PDF.js will fetch this URL itself once loaded.
  const previewUrl = `${process.env.EXPO_PUBLIC_API_URL}/users/preview-document/${user?.id}/${encodeURIComponent(
    folder ?? "",
  )}/${encodeURIComponent(fileName ?? "")}?token=${encodeURIComponent(token ?? "")}`;

  // Route through the self-hosted PDF.js viewer (public/viewer.html) instead
  // of letting the WebView hand the PDF to the OS's native plugin — this is
  // what gets rid of the gray letterboxing and gives us controlled zoom/pan.
  const viewerUrl = `http://172.20.10.4:5000/viewer.html?file=${encodeURIComponent(previewUrl)}`;

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.headerIconButton}
        >
          <Feather name="x" size={20} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {fileName}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {folder}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/documentEditor",
              params: { folder, fileName },
            })
          }
          activeOpacity={0.85}
          style={styles.editButton}
        >
          <Feather name="edit-2" size={13} color="#ffffff" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Body */}
      {error ? (
        <View style={styles.stateContainer}>
          <View style={styles.errorIconCircle}>
            <Feather name="alert-circle" size={24} color={theme.danger} />
          </View>
          <Text style={styles.stateTitle}>Couldn't load preview</Text>
          <Text style={styles.stateSubtitle}>
            Check your connection and try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.85}
            onPress={handleRetry}
          >
            <Feather name="refresh-cw" size={14} color="#ffffff" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.webviewWrap}>
          <WebView
            key={reloadKey}
            source={{ uri: viewerUrl }}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            onHttpError={() => {
              setLoading(false);
              setError(true);
            }}
            startInLoadingState={false}
            style={[styles.webview, { backgroundColor: theme.bg }]}
            // The PDF is now rendered by our self-hosted PDF.js page
            // (public/viewer.html) onto a canvas we fully control — fixed
            // zoom, native scroll/pan, and a background that matches the
            // app instead of the OS's PDF-plugin chrome and gray letterboxing.
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.emeraldSolid} />
              <Text style={styles.loadingText}>Preparing preview…</Text>
            </View>
          )}
        </View>
      )}
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    headerIconButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.chip,
    },
    headerTitleWrap: {
      flex: 1,
      minWidth: 0,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    headerSubtitle: {
      fontSize: 11.5,
      color: theme.textMuted,
      marginTop: 1,
    },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.emeraldSolid,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
    },
    editButtonText: {
      color: "#ffffff",
      fontWeight: "700",
      fontSize: 12.5,
    },

    divider: {
      height: 1,
      backgroundColor: theme.divider,
    },

    webviewWrap: {
      flex: 1,
    },
    webview: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.bg,
      gap: 12,
    },
    loadingText: {
      fontSize: 12.5,
      fontWeight: "600",
      color: theme.textMuted,
    },

    stateContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    errorIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.dangerChip,
      marginBottom: 14,
    },
    stateTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 4,
    },
    stateSubtitle: {
      fontSize: 12.5,
      color: theme.textMuted,
      textAlign: "center",
      marginBottom: 20,
    },
    retryButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.emeraldSolid,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 14,
    },
    retryButtonText: {
      color: "#ffffff",
      fontWeight: "700",
      fontSize: 13,
    },
  });
}
