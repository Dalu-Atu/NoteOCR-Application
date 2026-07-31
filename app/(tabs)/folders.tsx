import { useAuth } from "@/contexts/AuthContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
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
import { MOCK_DOCUMENTS } from "../../data/mockDocuments";
import { useFolderActions } from "../../hooks/useFolderAcrtion";

interface Folder {
  id: string;
  name: string;
  color?: string;
  documentCount?: number;
}

const FOLDER_COLOR_PALETTE = [
  "#10b981",
  "#3b82f6",
  "#f97316",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
  "#64748b",
];

const SORT_OPTIONS = [
  { key: "recent", label: "Recently Updated", icon: "clock" as const },
  { key: "name", label: "Name (A–Z)", icon: "type" as const },
  { key: "count", label: "Item Count", icon: "hash" as const },
];

type SortKey = "recent" | "name" | "count";

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function FoldersScreen() {
  const colorScheme = useColorScheme();
  const { isDark } = useAppTheme();
  const router = useRouter();
  const { folders: flds } = useAuth();
  const {
    createFolder: createFolderMutation,
    renameFolder: renameFolderMutation,
    deleteFolder: deleteFolderMutation,
  } = useFolderActions();

  const [folders, setFolders] = useState<Folder[]>(flds);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [modalName, setModalName] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalColor, setModalColor] = useState(FOLDER_COLOR_PALETTE[0]);
  const [modalError, setModalError] = useState<string | null>(null);

  const [activeFolder, setActiveFolder] = useState<Folder | null>(null);
  const [folderPendingDelete, setFolderPendingDelete] = useState<Folder | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Keep local list in sync with whatever the auth context has, since
  // mutations refresh user data there rather than mutating local state.
  useEffect(() => {
    setFolders(flds);
  }, [flds]);

  const theme = useMemo(
    () => ({
      bg: isDark ? "#0f172a" : "#f8fafc",
      card: isDark ? "#1e293b" : "#ffffff",
      text: isDark ? "#f8fafc" : "#0f172a",
      textMuted: isDark ? "#64748b" : "#94a3b8",
      border: isDark ? "#334155" : "#e2e8f0",
      inputBg: isDark ? "#1e293b" : "#ffffff",
      accent: "#10b981",
      accentSolid: "#059669",
      accentChip: isDark ? "rgba(16,185,129,0.16)" : "#ecfdf5",
    }),
    [isDark],
  );

  const folderList = useMemo(() => {
    return folders.map((folder) => {
      const docsInFolder = MOCK_DOCUMENTS.filter(
        (d) => d.folder === folder.name,
      );
      const latestDoc = docsInFolder.reduce<
        (typeof docsInFolder)[number] | null
      >((latest, d) => {
        if (!latest) return d;
        return new Date(d.date).getTime() > new Date(latest.date).getTime()
          ? d
          : latest;
      }, null);
      return {
        ...folder,
        latestDateStr: latestDoc?.date ?? null,
        latestTimestamp: latestDoc ? new Date(latestDoc.date).getTime() : 0,
      };
    });
  }, [folders]);

  const hasAnyFolders = folders.length > 0;

  const filteredFolders = folderList.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sortedFolders = useMemo(() => {
    const arr = [...filteredFolders];
    if (sortBy === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "count")
      arr.sort((a, b) => (b.documentCount ?? 0) - (a.documentCount ?? 0));
    else arr.sort((a, b) => b.latestTimestamp - a.latestTimestamp);
    return arr;
  }, [filteredFolders, sortBy]);

  function openCreateModal() {
    setModalMode("create");
    setEditingFolder(null);
    setModalName("");
    setModalDescription("");
    setModalColor(FOLDER_COLOR_PALETTE[0]);
    setModalError(null);
  }

  function openEditModal(folder: Folder) {
    setActiveFolder(null);
    setModalMode("edit");
    setEditingFolder(folder);
    setModalName(folder.name);
    setModalDescription("");
    setModalColor(folder.color ?? FOLDER_COLOR_PALETTE[0]);
    setModalError(null);
  }

  function closeModal() {
    setModalMode(null);
    setEditingFolder(null);
    setModalName("");
    setModalDescription("");
    setModalError(null);
  }

  function handleSaveFolder() {
    const trimmedName = modalName.trim();
    if (!trimmedName) {
      setModalError("Folder name can't be empty.");
      return;
    }

    if (modalMode === "edit" && editingFolder) {
      const nameChanged = trimmedName !== editingFolder.name;
      const colorChanged = modalColor !== editingFolder.color;

      if (!nameChanged && !colorChanged) {
        closeModal();
        return;
      }

      renameFolderMutation.mutate(
        {
          folderId: editingFolder.id,
          newName: nameChanged ? trimmedName : undefined,
          color: colorChanged ? modalColor : undefined,
        },
        {
          onSuccess: closeModal,
          onError: (err: any) => {
            const message = err?.response?.data?.message;
            setModalError(
              message ??
                "Something went wrong updating this folder. Please try again.",
            );
          },
        },
      );
      return;
    }

    // Create mode — description is required by the backend.
    const trimmedDescription = modalDescription.trim();
    if (!trimmedDescription) {
      setModalError("Add a short description for this folder.");
      return;
    }

    createFolderMutation.mutate(
      {
        folderName: trimmedName,
        description: trimmedDescription,
        color: modalColor,
      },
      {
        onSuccess: closeModal,
        onError: (err: any) => {
          const message = err?.response?.data?.message;
          setModalError(
            message ??
              "Something went wrong creating this folder. Please try again.",
          );
        },
      },
    );
  }

  function handleDeleteFolder(folder: Folder) {
    setActiveFolder(null);
    setDeleteError(null);
    setFolderPendingDelete(folder);
  }

  function closeDeleteConfirm() {
    setFolderPendingDelete(null);
    setDeleteError(null);
  }

  function confirmDeleteFolder() {
    if (!folderPendingDelete) return;
    deleteFolderMutation.mutate(
      { folderId: folderPendingDelete.id },
      {
        onSuccess: closeDeleteConfirm,
        onError: () =>
          setDeleteError(
            "Something went wrong deleting this folder. Please try again.",
          ),
      },
    );
  }

  const isSavingFolder =
    createFolderMutation.isPending || renameFolderMutation.isPending;

  console.log(folderList);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Folders</Text>

          <View style={styles.headerActions}>
            <View>
              <TouchableOpacity
                style={styles.sortButton}
                activeOpacity={0.7}
                onPress={() => setSortMenuOpen((v) => !v)}
              >
                <Feather name="sliders" size={19} color={theme.textMuted} />
              </TouchableOpacity>

              {sortMenuOpen && (
                <View
                  style={[
                    styles.sortMenu,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  {SORT_OPTIONS.map((opt) => {
                    const isActive = sortBy === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={styles.sortMenuItem}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSortBy(opt.key as SortKey);
                          setSortMenuOpen(false);
                        }}
                      >
                        <Feather
                          name={opt.icon}
                          size={14}
                          color={isActive ? theme.accent : theme.textMuted}
                        />
                        <Text
                          style={[
                            styles.sortMenuText,
                            { color: isActive ? theme.accent : theme.text },
                          ]}
                        >
                          {opt.label}
                        </Text>
                        {isActive && (
                          <Feather
                            name="check"
                            size={13}
                            color={theme.accent}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.newFolderButton,
                { backgroundColor: theme.accentSolid },
              ]}
              activeOpacity={0.85}
              onPress={openCreateModal}
            >
              <Feather name="plus" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.inputBg, borderColor: theme.border },
          ]}
        >
          <Feather name="search" size={18} color={theme.textMuted} />
          <TextInput
            placeholder="Search folders..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x-circle" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {hasAnyFolders && (
          <Text style={[styles.resultsCount, { color: theme.textMuted }]}>
            {sortedFolders.length}{" "}
            {sortedFolders.length === 1 ? "folder" : "folders"}
          </Text>
        )}

        {/* Grid */}
        <FlatList
          data={sortedFolders}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !hasAnyFolders ? (
              <View style={styles.emptyContainer}>
                <View
                  style={[
                    styles.emptyIconCircle,
                    { backgroundColor: theme.accentChip },
                  ]}
                >
                  <Feather name="folder-plus" size={26} color={theme.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  No folders yet
                </Text>
                <Text
                  style={[styles.emptySubtitle, { color: theme.textMuted }]}
                >
                  Create folders to keep your scans and documents organized the
                  way you work.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.emptyCta,
                    { backgroundColor: theme.accentSolid },
                  ]}
                  activeOpacity={0.85}
                  onPress={openCreateModal}
                >
                  <Feather name="folder-plus" size={15} color="#ffffff" />
                  <Text style={styles.emptyCtaText}>
                    Create Your First Folder
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Feather name="search" size={36} color={theme.textMuted} />
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: theme.text, marginTop: 14 },
                  ]}
                >
                  No matching folders
                </Text>
                <Text
                  style={[styles.emptySubtitle, { color: theme.textMuted }]}
                >
                  Try a different search term.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.clearFiltersBtn,
                    { borderColor: theme.border },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSearchQuery("")}
                >
                  <Text
                    style={[styles.clearFiltersText, { color: theme.text }]}
                  >
                    Clear Search
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.folderCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/documents",
                  params: { folder: item.name },
                })
              }
            >
              <View style={styles.folderCardTop}>
                <View
                  style={[
                    styles.folderIconTile,
                    {
                      backgroundColor: hexToRgba(
                        item?.color || "#059669",
                        isDark ? 0.2 : 0.12,
                      ),
                    },
                  ]}
                >
                  <Feather
                    name="folder"
                    size={21}
                    color={item?.color || "#059669"}
                  />
                </View>
                <TouchableOpacity
                  hitSlop={8}
                  onPress={() => setActiveFolder(item)}
                >
                  <Feather
                    name="more-vertical"
                    size={16}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={[styles.folderName, { color: theme.text }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text style={[styles.folderMeta, { color: theme.textMuted }]}>
                {item.documentCount ?? 0}{" "}
                {item.documentCount === 1 ? "document" : "documents"}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Three-dot action sheet */}
      <Modal
        visible={!!activeFolder}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveFolder(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setActiveFolder(null)}
          />
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />

            {activeFolder && (
              <View
                style={[
                  styles.actionSheetHeader,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View
                  style={[
                    styles.actionSheetIconTile,
                    {
                      backgroundColor: hexToRgba(
                        activeFolder.color || "#059669",
                        isDark ? 0.2 : 0.12,
                      ),
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Feather
                    name="folder"
                    size={20}
                    color={activeFolder.color || "#059669"}
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
                    {activeFolder.name}
                  </Text>
                  <Text
                    style={[
                      styles.actionSheetSubtitle,
                      { color: theme.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {activeFolder.documentCount ?? 0}{" "}
                    {activeFolder.documentCount === 1
                      ? "document"
                      : "documents"}
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
                onPress={() => activeFolder && openEditModal(activeFolder)}
              >
                <View
                  style={[styles.actionIconChip, { backgroundColor: theme.bg }]}
                >
                  <Feather name="edit-2" size={16} color={theme.text} />
                </View>
                <Text style={[styles.actionRowText, { color: theme.text }]}>
                  Rename / Change Color
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
                onPress={() => activeFolder && handleDeleteFolder(activeFolder)}
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
                  Delete Folder
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.actionCancelButton,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              activeOpacity={0.6}
              onPress={() => setActiveFolder(null)}
            >
              <Text style={[styles.actionCancelText, { color: theme.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete-folder confirmation — a custom modal instead of
          Alert.alert, since Alert.alert's multi-button dialog is
          unreliable on web (the confirm button's onPress may never
          fire, which is why "nothing happened" before). */}
      <Modal
        visible={!!folderPendingDelete}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteConfirm}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeDeleteConfirm}
          />
          <View
            style={[styles.folderPickerSheet, { backgroundColor: theme.card }]}
          >
            <View style={styles.folderPickerHandle} />

            <View style={styles.deleteWarningIconWrap}>
              <Feather name="alert-triangle" size={22} color="#dc2626" />
            </View>

            <Text
              style={[
                styles.actionSheetTitle,
                { color: theme.text, textAlign: "center" },
              ]}
            >
              Delete "{folderPendingDelete?.name}"?
            </Text>

            <Text
              style={[styles.deleteWarningText, { color: theme.textMuted }]}
            >
              {(folderPendingDelete?.documentCount ?? 0) > 0
                ? `This folder contains ${folderPendingDelete?.documentCount} ${
                    folderPendingDelete?.documentCount === 1
                      ? "document"
                      : "documents"
                  }. Deleting it will permanently delete ${
                    folderPendingDelete?.documentCount === 1
                      ? "that document"
                      : "all of them"
                  } too — this cannot be undone.`
                : "This cannot be undone."}
            </Text>

            {deleteError && (
              <View style={styles.formErrorRow}>
                <Feather name="alert-circle" size={13} color="#dc2626" />
                <Text style={styles.formErrorText}>{deleteError}</Text>
              </View>
            )}

            <View style={styles.formButtonRow}>
              <TouchableOpacity
                style={[styles.formCancelBtn, { borderColor: theme.border }]}
                onPress={closeDeleteConfirm}
                disabled={deleteFolderMutation.isPending}
              >
                <Text style={[styles.formCancelText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formSaveBtn, styles.dangerButton]}
                disabled={deleteFolderMutation.isPending}
                onPress={confirmDeleteFolder}
              >
                {deleteFolderMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.formSaveText}>Delete Permanently</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create / edit folder form */}
      <Modal
        visible={modalMode !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        {/* KeyboardAvoidingView is required here — a Modal with a
            flex-end sheet does NOT reposition itself for the keyboard on
            its own. Without this, the keyboard simply overlaps the sheet. */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={closeModal}
            />
            <View style={[styles.formSheet, { backgroundColor: theme.card }]}>
              <Text style={[styles.formTitle, { color: theme.text }]}>
                {modalMode === "edit" ? "Rename Folder" : "New Folder"}
              </Text>

              <TextInput
                value={modalName}
                onChangeText={(text) => {
                  setModalName(text);
                  if (modalError) setModalError(null);
                }}
                placeholder="Folder name"
                placeholderTextColor={theme.textMuted}
                autoFocus
                style={[
                  styles.formInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.inputBg,
                  },
                ]}
              />

              {modalMode === "create" && (
                <TextInput
                  value={modalDescription}
                  onChangeText={(text) => {
                    setModalDescription(text);
                    if (modalError) setModalError(null);
                  }}
                  placeholder="Short description"
                  placeholderTextColor={theme.textMuted}
                  multiline
                  style={[
                    styles.formInput,
                    styles.formTextArea,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.inputBg,
                    },
                  ]}
                />
              )}

              {modalError && (
                <View style={styles.formErrorRow}>
                  <Feather name="alert-circle" size={13} color="#dc2626" />
                  <Text style={styles.formErrorText}>{modalError}</Text>
                </View>
              )}

              <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                Color
              </Text>
              <View style={styles.colorRow}>
                {FOLDER_COLOR_PALETTE.map((c) => {
                  const isActive = modalColor === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setModalColor(c)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c },
                        isActive && styles.colorSwatchActive,
                      ]}
                    >
                      {isActive && (
                        <Feather name="check" size={14} color="#ffffff" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.formButtonRow}>
                <TouchableOpacity
                  style={[styles.formCancelBtn, { borderColor: theme.border }]}
                  onPress={closeModal}
                  disabled={isSavingFolder}
                >
                  <Text style={[styles.formCancelText, { color: theme.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.formSaveBtn,
                    {
                      backgroundColor: theme.accentSolid,
                      opacity: modalName.trim() ? 1 : 0.5,
                    },
                  ]}
                  disabled={!modalName.trim() || isSavingFolder}
                  onPress={handleSaveFolder}
                >
                  {isSavingFolder ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.formSaveText}>
                      {modalMode === "edit" ? "Save" : "Create"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sortButton: {
    padding: 6,
  },
  sortMenu: {
    position: "absolute",
    top: 34,
    right: 0,
    width: 190,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    zIndex: 30,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sortMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sortMenuText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  newFolderButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  resultsCount: {
    fontSize: 12.5,
    fontWeight: "600",
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 100,
    gap: 12,
  },
  folderCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  folderCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  folderIconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  folderName: {
    fontSize: 14.5,
    fontWeight: "700",
    marginBottom: 4,
  },
  folderMeta: {
    fontSize: 11.5,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    width: "100%",
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
    maxWidth: 280,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: "#10b981",
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
  clearFiltersBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
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
  formSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  folderPickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  folderPickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(148,163,184,0.5)",
    alignSelf: "center",
    marginBottom: 14,
  },
  deleteWarningIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(220,38,38,0.12)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  deleteWarningText: {
    fontSize: 13.5,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  dangerButton: {
    backgroundColor: "#dc2626",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 16,
  },
  formInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 14,
  },
  formTextArea: {
    height: 72,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  formErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
    marginTop: -4,
    paddingHorizontal: 2,
  },
  formErrorText: { color: "#dc2626", fontSize: 12.5, flexShrink: 1 },
  formLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  colorSwatchActive: {
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  formButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  formCancelBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  formCancelText: {
    fontSize: 14,
    fontWeight: "700",
  },
  formSaveBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 14,
  },
  formSaveText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
