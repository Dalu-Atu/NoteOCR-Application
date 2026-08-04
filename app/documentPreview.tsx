// app/(tabs)/documentPreview.tsx
import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

import { useAuth } from "@/contexts/AuthContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { AppTheme, getTheme } from "@/utils/theme";
import { LockedPreviewOverlay } from "../components/LockedPreviewOverlay";

// If the viewer doesn't confirm real render within this window (slow
// network, WebView/postMessage bridge issue on an older RN-WebView
// version, etc), fail into the error state instead of spinning forever.
const READY_TIMEOUT_MS = 30000;

// Fallback if viewer.html's postMessage("ready") never arrives (bridge
// issue, old cached viewer.html, etc): the native onLoadEnd event still
// fires once the page has finished loading, so we grace-period into a
// "probably fine, just stop showing the spinner" state instead of
// hanging until READY_TIMEOUT_MS every time. This does NOT gate the
// paywall overlay — that stays strictly tied to the real "ready"
// message, since it needs to know rendering actually happened.
const LOAD_END_GRACE_MS = 4000;

type ViewerMessage =
  | {
      type: "ready";
      pageCount: number;
      renderablePageCount: number;
      locked: boolean;
    }
  | { type: "error"; message: string };

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
  const [contentReady, setContentReady] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadEndGraceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gotReadyMessageRef = useRef(false);

  const rawFolder = Array.isArray(folder) ? folder[0] : folder;
  const rawFileName = Array.isArray(fileName) ? fileName[0] : fileName;

  const safeFolder = useMemo(() => {
    try {
      return decodeURIComponent(rawFolder ?? "");
    } catch {
      return rawFolder ?? "";
    }
  }, [rawFolder]);

  const safeFileName = useMemo(() => {
    try {
      return decodeURIComponent(rawFileName ?? "");
    } catch {
      return rawFileName ?? "";
    }
  }, [rawFileName]);

  // TODO: replace with wherever your plan/subscription state actually lives
  const isFreePlan = user?.plan?.toLowerCase() === "free";

  const previewUrl = `${process.env.EXPO_PUBLIC_API_URL}/users/preview-document/${user?.id}/${encodeURIComponent(
    safeFolder,
  )}/${encodeURIComponent(safeFileName)}?token=${encodeURIComponent(token ?? "")}`;

  const viewerUrl = `http://172.20.10.3:5000/viewer.html?file=${encodeURIComponent(
    previewUrl,
  )}&locked=${isFreePlan ? "1" : "0"}`;

  const clearTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (loadEndGraceRef.current) {
      clearTimeout(loadEndGraceRef.current);
      loadEndGraceRef.current = null;
    }
  };

  useEffect(() => {
    gotReadyMessageRef.current = false;
    clearTimers();
    timeoutRef.current = setTimeout(() => {
      console.warn(
        "[preview] READY_TIMEOUT_MS hit — no ready/error message or loadEnd fallback resolved it",
      );
      setLoading(false);
      setError(true);
    }, READY_TIMEOUT_MS);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const handleMessage = (event: WebViewMessageEvent) => {
    let data: ViewerMessage;
    try {
      data = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (data.type === "ready") {
      gotReadyMessageRef.current = true;
      clearTimers();
      setLoading(false);
      setContentReady(true);
      setError(false);
    } else if (data.type === "error") {
      gotReadyMessageRef.current = true; // resolved, just unhappily
      clearTimers();
      setLoading(false);
      setError(true);
    }
  };

  // Safety net: viewer.html is expected to postMessage("ready") once
  // pdf.js has actually rendered pixels — that's the real signal, and
  // it's what unlocks the paywall overlay below. But if that message
  // never arrives (bridge hiccup, stale cached viewer.html, etc), the
  // native onLoadEnd event still tells us the page itself finished
  // loading. Give the postMessage a short grace period after that to
  // still arrive normally; if it doesn't, stop spinning anyway so the
  // user isn't stuck for the full 30s every time. contentReady/paywall
  // gating is deliberately NOT flipped here — only loading/error are.
  const handleLoadEnd = () => {
    if (loadEndGraceRef.current) clearTimeout(loadEndGraceRef.current);
    loadEndGraceRef.current = setTimeout(() => {
      if (!gotReadyMessageRef.current) {
        console.warn(
          "[preview] onLoadEnd fallback fired — postMessage('ready') never arrived",
        );
        clearTimers();
        setLoading(false);
      }
    }, LOAD_END_GRACE_MS);
  };

  const handleRetry = () => {
    setError(false);
    setContentReady(false);
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

        {!isFreePlan && (
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
        )}
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
            onMessage={handleMessage}
            onLoadEnd={handleLoadEnd}
            onError={() => {
              clearTimers();
              setLoading(false);
              setError(true);
            }}
            onHttpError={() => {
              clearTimers();
              setLoading(false);
              setError(true);
            }}
            startInLoadingState={false}
            style={[styles.webview, { backgroundColor: theme.bg }]}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.emeraldSolid} />
              <Text style={styles.loadingText}>Preparing preview…</Text>
            </View>
          )}

          {/* Content-gated, not just loading-gated: only shows once the
              viewer has confirmed real pixels are rendered. The document
              itself is capped to page 1 for free users inside viewer.html,
              so this overlay is a sell, not the only thing hiding content. */}
          {contentReady && isFreePlan && (
            <LockedPreviewOverlay
              documentTitle={fileName}
              userName={user?.name}
              onUpgrade={() => router.push("/billing")}
            />
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
    headerTitleWrap: { flex: 1, minWidth: 0 },
    headerTitle: { fontSize: 14, fontWeight: "700", color: theme.textPrimary },
    headerSubtitle: { fontSize: 11.5, color: theme.textMuted, marginTop: 1 },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.emeraldSolid,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
    },
    editButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 12.5 },
    divider: { height: 1, backgroundColor: theme.divider },
    webviewWrap: { flex: 1 },
    webview: { flex: 1, backgroundColor: theme.bg },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.bg,
      gap: 12,
    },
    loadingText: { fontSize: 12.5, fontWeight: "600", color: theme.textMuted },
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
    retryButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 13 },
  });
}
