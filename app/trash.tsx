import { useAuth } from "@/contexts/AuthContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useDocumentActions } from "@/hooks/useDocumentActions";
import { getFileVisual } from "@/utils/fileVisuals";
import { TrashItem } from "@/utils/mapUserData";
import { AppTheme, getTheme } from "@/utils/theme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function TrashScreen() {
  const { trash } = useAuth();
  const {
    recoverFile: recoverFileMutation,
    permanentDelete: permanentDeleteMutation,
  } = useDocumentActions();

  const { isDark } = useAppTheme();
  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeItem, setActiveItem] = useState<TrashItem | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<TrashItem | null>(
    null,
  );

  const filteredTrash = trash.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const isRestoring = !!activeItem && recoverFileMutation.isPending;
  const isPermanentlyDeleting =
    !!confirmDeleteItem && permanentDeleteMutation.isPending;

  const handleRestore = (item: TrashItem) => {
    // Don't close the sheet here — closing immediately was the bug: it
    // made `isRestoring` (which depends on `activeItem` staying set)
    // impossible to ever be true, so the spinner/disabled state never
    // showed. Close only once the mutation actually resolves, same as
    // handleConfirmPermanentDelete does below.
    recoverFileMutation.mutate(
      { file: { name: item.title, dest: item.folder } },
      {
        onSuccess: () => setActiveItem(null),
        onError: () => {
          setActiveItem(null);
          Alert.alert(
            "Couldn't restore",
            "Something went wrong restoring this document. Please try again.",
          );
        },
      },
    );
  };

  const handleConfirmPermanentDelete = () => {
    if (!confirmDeleteItem) return;
    permanentDeleteMutation.mutate(
      { file: confirmDeleteItem.title },
      {
        onSuccess: () => setConfirmDeleteItem(null),
        onError: () => {
          setConfirmDeleteItem(null);
          Alert.alert(
            "Couldn't delete",
            "Something went wrong permanently deleting this document. Please try again.",
          );
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Hide the native router header — we build our own below. This was
          missing before, which is why there were two stacked headers. */}
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.container}>
        {/* Header — same centered back/title/spacer pattern as Account */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backButton}
          >
            <Feather name="chevron-left" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trash</Text>
          <View style={{ width: 34 }} />
        </View>
        <Text style={styles.headerSubtitle}>
          Items are permanently deleted after their countdown ends
        </Text>

        {/* Search */}
        {trash.length > 0 && (
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={19} color={theme.textMuted} />
            <TextInput
              placeholder="Search trash..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {trash.length > 0 && (
          <Text style={styles.resultsCount}>
            {filteredTrash.length}{" "}
            {filteredTrash.length === 1 ? "item" : "items"}
          </Text>
        )}

        {/* List */}
        <FlatList
          data={filteredTrash}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            trash.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Feather
                    name="trash-2"
                    size={26}
                    color={theme.emeraldSolid}
                  />
                </View>
                <Text style={styles.emptyTitle}>Trash is empty</Text>
                <Text style={styles.emptySubtitle}>
                  Deleted documents show up here before they're gone for good.
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Feather name="search" size={40} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { marginTop: 14 }]}>
                  No matching items
                </Text>
                <Text style={styles.emptySubtitle}>
                  Try a different search term.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const visual = getFileVisual(item.title);
            const isUrgent = item.daysRemaining <= 3;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.docCard}
                onPress={() => setActiveItem(item)}
              >
                <View style={styles.iconTile}>
                  <MaterialCommunityIcons
                    name={visual.icon}
                    size={30}
                    color={visual.color}
                  />
                </View>

                <View style={styles.docInfo}>
                  <Text style={styles.docTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.docMeta}>
                    {item.folder} • {item.size}
                  </Text>
                </View>

                <View
                  style={[styles.daysPill, isUrgent && styles.daysPillUrgent]}
                >
                  <Text
                    style={[
                      styles.daysPillText,
                      isUrgent && styles.daysPillTextUrgent,
                    ]}
                  >
                    {item.daysRemaining}d
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Action sheet: Restore / Delete Forever / Cancel */}
      <Modal
        visible={!!activeItem}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isRestoring) setActiveItem(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            // Don't let a backdrop tap dismiss the sheet mid-restore —
            // that would hide the loading state while the request is
            // still in flight.
            onPress={() => {
              if (!isRestoring) setActiveItem(null);
            }}
          />
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />

            {activeItem && (
              <View style={styles.actionSheetHeader}>
                <View style={styles.actionSheetIconTile}>
                  <MaterialCommunityIcons
                    name={getFileVisual(activeItem.title).icon}
                    size={22}
                    color={getFileVisual(activeItem.title).color}
                  />
                </View>
                <View style={styles.actionSheetHeaderText}>
                  <Text style={styles.actionSheetHeaderTitle} numberOfLines={1}>
                    {activeItem.title}
                  </Text>
                  <Text style={styles.actionSheetSubtitle} numberOfLines={1}>
                    {activeItem.folder} • {activeItem.daysRemaining} days left
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.actionGroup}>
              <TouchableOpacity
                style={styles.actionRow}
                activeOpacity={0.6}
                disabled={isRestoring}
                onPress={() => activeItem && handleRestore(activeItem)}
              >
                <View style={styles.actionIconChipEmerald}>
                  {isRestoring ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.emeraldSolid}
                    />
                  ) : (
                    <Feather
                      name="rotate-ccw"
                      size={16}
                      color={theme.emeraldSolid}
                    />
                  )}
                </View>
                <Text style={styles.actionRowText}>
                  {isRestoring ? "Restoring…" : "Restore"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.actionGroup, { marginTop: 10 }]}>
              <TouchableOpacity
                style={styles.actionRow}
                activeOpacity={0.6}
                disabled={isRestoring}
                onPress={() => {
                  const item = activeItem;
                  setActiveItem(null);
                  if (item) setConfirmDeleteItem(item);
                }}
              >
                <View style={styles.actionIconChipDanger}>
                  <Feather name="trash-2" size={16} color={theme.danger} />
                </View>
                <Text style={[styles.actionRowText, { color: theme.danger }]}>
                  Delete Forever
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionCancelButton}
              activeOpacity={0.6}
              disabled={isRestoring}
              onPress={() => setActiveItem(null)}
            >
              <Text style={styles.actionCancelText}>
                {isRestoring ? "Please wait…" : "Cancel"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Permanent delete confirmation — irreversible, so it gets its own
          explicit confirm step instead of firing off the action sheet tap */}
      <Modal
        visible={!!confirmDeleteItem}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteItem(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setConfirmDeleteItem(null)}
          />
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />

            <View style={styles.confirmCard}>
              <View style={styles.confirmIconCircle}>
                <Feather name="alert-triangle" size={22} color={theme.danger} />
              </View>
              <Text style={styles.confirmTitle}>Delete Forever?</Text>
              <Text style={styles.confirmBody} numberOfLines={2}>
                This document will be permanently deleted. This can't be undone.
              </Text>
            </View>

            <View style={[styles.actionGroup, { marginTop: 10 }]}>
              <TouchableOpacity
                style={styles.actionRow}
                activeOpacity={0.6}
                disabled={isPermanentlyDeleting}
                onPress={handleConfirmPermanentDelete}
              >
                <View style={styles.actionIconChipDanger}>
                  {isPermanentlyDeleting ? (
                    <ActivityIndicator size="small" color={theme.danger} />
                  ) : (
                    <Feather name="trash-2" size={16} color={theme.danger} />
                  )}
                </View>
                <Text style={[styles.actionRowText, { color: theme.danger }]}>
                  {isPermanentlyDeleting ? "Deleting…" : "Yes, Delete Forever"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionCancelButton}
              activeOpacity={0.6}
              onPress={() => setConfirmDeleteItem(null)}
            >
              <Text style={styles.actionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    backButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.chip,
    },
    headerTitle: { fontSize: 16, fontWeight: "800", color: theme.textPrimary },
    headerSubtitle: {
      fontSize: 12.5,
      color: theme.textMuted,
      textAlign: "center",
      marginBottom: 16,
    },

    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.chip,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      marginBottom: 12,
    },
    searchInput: { flex: 1, fontSize: 14.5, color: theme.textPrimary },
    resultsCount: { fontSize: 12.5, color: theme.textMuted, marginBottom: 8 },

    listContent: { paddingBottom: 24 },
    docCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.card,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.isDark ? 0 : 0.04,
      shadowRadius: 10,
      elevation: theme.isDark ? 0 : 1,
    },
    iconTile: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    docInfo: { flex: 1 },
    docTitle: { fontSize: 14.5, fontWeight: "700", color: theme.textPrimary },
    docMeta: { fontSize: 11.5, marginTop: 2, color: theme.textMuted },
    daysPill: {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.bg,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    daysPillUrgent: {
      backgroundColor: theme.dangerChip,
      borderColor: "transparent",
    },
    daysPillText: { fontSize: 11.5, fontWeight: "700", color: theme.textMuted },
    daysPillTextUrgent: { color: theme.danger },

    emptyContainer: {
      alignItems: "center",
      paddingTop: 60,
      paddingHorizontal: 20,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.emeraldChip,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16.5,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 12.5,
      textAlign: "center",
      lineHeight: 18,
      color: theme.textMuted,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    actionSheet: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: Platform.OS === "ios" ? 40 : 24,
    },
    actionSheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(148,163,184,0.5)",
      alignSelf: "center",
      marginBottom: 14,
    },
    actionSheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 10,
    },
    actionSheetIconTile: {
      width: 42,
      height: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    actionSheetHeaderText: { flex: 1 },
    actionSheetHeaderTitle: {
      fontSize: 14.5,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    actionSheetSubtitle: {
      fontSize: 11.5,
      marginTop: 2,
      color: theme.textMuted,
    },

    actionGroup: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      overflow: "hidden",
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    actionIconChipEmerald: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.emeraldChip,
    },
    actionIconChipDanger: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.dangerChip,
    },
    actionRowText: {
      fontSize: 14.5,
      fontWeight: "600",
      color: theme.textPrimary,
    },
    actionCancelButton: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 10,
    },
    actionCancelText: {
      fontSize: 14.5,
      fontWeight: "700",
      color: theme.textPrimary,
    },

    confirmCard: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 18,
      alignItems: "center",
      marginBottom: 4,
    },
    confirmIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.dangerChip,
      marginBottom: 12,
    },
    confirmTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.textPrimary,
      marginBottom: 6,
    },
    confirmBody: {
      fontSize: 12.5,
      textAlign: "center",
      lineHeight: 18,
      color: theme.textMuted,
    },
  });
}
