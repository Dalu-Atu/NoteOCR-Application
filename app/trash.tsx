import { useAuth } from "@/contexts/AuthContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useDocumentActions } from "@/hooks/useDocumentActions";
import { getFileVisual } from "@/utils/fileVisuals";
import { TrashItem } from "@/utils/mapUserData";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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
  useColorScheme,
  View,
} from "react-native";

export default function TrashScreen() {
  const { trash } = useAuth();
  const {
    recoverFile: recoverFileMutation,
    permanentDelete: permanentDeleteMutation,
  } = useDocumentActions();

  const { isDark } = useAppTheme();
  const theme = useColorScheme();
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
    setActiveItem(null);
    recoverFileMutation.mutate(
      { file: { name: item.title, dest: item.folder } },
      {
        onError: () =>
          Alert.alert(
            "Couldn't restore",
            "Something went wrong restoring this document. Please try again.",
          ),
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Feather name="chevron-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.title, { color: theme.text }]}>Trash</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
              Items are permanently deleted after their countdown ends
            </Text>
          </View>
        </View>

        {/* Search */}
        {trash.length > 0 && (
          <View
            style={[
              styles.searchBar,
              { backgroundColor: theme.inputBg, borderColor: theme.border },
            ]}
          >
            <Ionicons name="search-outline" size={20} color={theme.textMuted} />
            <TextInput
              placeholder="Search trash..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: theme.text }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
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
          <Text style={[styles.resultsCount, { color: theme.textMuted }]}>
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
                <View
                  style={[
                    styles.emptyIconCircle,
                    { backgroundColor: theme.accentChip },
                  ]}
                >
                  <Feather name="trash-2" size={26} color={theme.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  Trash is empty
                </Text>
                <Text
                  style={[styles.emptySubtitle, { color: theme.textMuted }]}
                >
                  Deleted documents show up here before they're gone for good.
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Feather name="search" size={40} color={theme.textMuted} />
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: theme.text, marginTop: 14 },
                  ]}
                >
                  No matching items
                </Text>
                <Text
                  style={[styles.emptySubtitle, { color: theme.textMuted }]}
                >
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
                style={[
                  styles.docCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={() => setActiveItem(item)}
              >
                <View style={styles.iconTile}>
                  <MaterialCommunityIcons
                    name={visual.icon}
                    size={32}
                    color={visual.color}
                  />
                </View>

                <View style={styles.docInfo}>
                  <Text
                    style={[styles.docTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.docMeta, { color: theme.textMuted }]}>
                    {item.folder} • {item.size}
                  </Text>
                </View>

                <View
                  style={[
                    styles.daysPill,
                    {
                      backgroundColor: isUrgent
                        ? "rgba(220,38,38,0.12)"
                        : theme.bg,
                      borderColor: isUrgent
                        ? "rgba(220,38,38,0.3)"
                        : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.daysPillText,
                      { color: isUrgent ? "#dc2626" : theme.textMuted },
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
        onRequestClose={() => setActiveItem(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setActiveItem(null)}
          />
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />

            {activeItem && (
              <View
                style={[
                  styles.actionSheetHeader,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View
                  style={[
                    styles.actionSheetIconTile,
                    { backgroundColor: theme.bg, borderColor: theme.border },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={getFileVisual(activeItem.title).icon}
                    size={22}
                    color={getFileVisual(activeItem.title).color}
                  />
                </View>
                <View style={styles.actionSheetHeaderText}>
                  <Text
                    style={[
                      styles.actionSheetHeaderTitle,
                      { color: theme.text },
                    ]}
                    numberOfLines={1}
                  >
                    {activeItem.title}
                  </Text>
                  <Text
                    style={[
                      styles.actionSheetSubtitle,
                      { color: theme.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {activeItem.folder} • {activeItem.daysRemaining} days left
                  </Text>
                </View>
              </View>
            )}

            <View
              style={[
                styles.actionGroup,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <TouchableOpacity
                style={styles.actionRow}
                activeOpacity={0.6}
                disabled={isRestoring}
                onPress={() => activeItem && handleRestore(activeItem)}
              >
                <View
                  style={[
                    styles.actionIconChip,
                    { backgroundColor: theme.accentChip },
                  ]}
                >
                  {isRestoring ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : (
                    <Feather name="rotate-ccw" size={16} color={theme.accent} />
                  )}
                </View>
                <Text style={[styles.actionRowText, { color: theme.text }]}>
                  {isRestoring ? "Restoring…" : "Restore"}
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.actionGroup,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  marginTop: 10,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.actionRow}
                activeOpacity={0.6}
                onPress={() => {
                  const item = activeItem;
                  setActiveItem(null);
                  if (item) setConfirmDeleteItem(item);
                }}
              >
                <View
                  style={[
                    styles.actionIconChip,
                    { backgroundColor: "rgba(220,38,38,0.12)" },
                  ]}
                >
                  <Feather name="trash-2" size={16} color="#dc2626" />
                </View>
                <Text style={[styles.actionRowText, { color: "#dc2626" }]}>
                  Delete Forever
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.actionCancelButton,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              activeOpacity={0.6}
              onPress={() => setActiveItem(null)}
            >
              <Text style={[styles.actionCancelText, { color: theme.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Permanent delete confirmation — this is irreversible, so it gets
          its own explicit confirm step rather than firing straight off
          the action sheet tap. */}
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

            <View
              style={[
                styles.confirmCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.confirmIconCircle,
                  { backgroundColor: "rgba(220,38,38,0.12)" },
                ]}
              >
                <Feather name="alert-triangle" size={22} color="#dc2626" />
              </View>
              <Text style={[styles.confirmTitle, { color: theme.text }]}>
                Delete Forever?
              </Text>
              <Text
                style={[styles.confirmBody, { color: theme.textMuted }]}
                numberOfLines={2}
              >
                This document will be permanently deleted. This can't be undone.
              </Text>
            </View>

            <View
              style={[
                styles.actionGroup,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  marginTop: 10,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.actionRow}
                activeOpacity={0.6}
                disabled={isPermanentlyDeleting}
                onPress={handleConfirmPermanentDelete}
              >
                <View
                  style={[
                    styles.actionIconChip,
                    { backgroundColor: "rgba(220,38,38,0.12)" },
                  ]}
                >
                  {isPermanentlyDeleting ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <Feather name="trash-2" size={16} color="#dc2626" />
                  )}
                </View>
                <Text style={[styles.actionRowText, { color: "#dc2626" }]}>
                  {isPermanentlyDeleting ? "Deleting…" : "Yes, Delete Forever"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.actionCancelButton,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              activeOpacity={0.6}
              onPress={() => setConfirmDeleteItem(null)}
            >
              <Text style={[styles.actionCancelText, { color: theme.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  headerTitleWrap: { flex: 1 },
  title: { fontSize: 20, fontWeight: "700" },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  resultsCount: { fontSize: 13, marginBottom: 8 },
  listContent: { paddingBottom: 24 },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  iconTile: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 15, fontWeight: "600" },
  docMeta: { fontSize: 12, marginTop: 2 },
  daysPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  daysPillText: { fontSize: 12, fontWeight: "700" },
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
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 19 },
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
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  actionSheetIconTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionSheetHeaderText: { flex: 1 },
  actionSheetHeaderTitle: { fontSize: 15, fontWeight: "700" },
  actionSheetSubtitle: { fontSize: 12, marginTop: 2 },
  actionGroup: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  actionIconChip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRowText: { fontSize: 15, fontWeight: "500" },
  actionCancelButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  actionCancelText: { fontSize: 15, fontWeight: "700" },
  confirmCard: {
    borderRadius: 14,
    borderWidth: 1,
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
    marginBottom: 12,
  },
  confirmTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  confirmBody: { fontSize: 13, textAlign: "center", lineHeight: 19 },
});
