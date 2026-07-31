import { useAuth } from "@/contexts/AuthContext";
import { useDocumentActions } from "@/hooks/useDocumentActions";
import { getAuthToken } from "@/services/api";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useMemo, useState } from "react";
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
import { DocumentItem } from "../../data/mockDocuments";
import { getFileVisual, parseSizeToMB } from "../../utils/fileVisuals";
import { useAppTheme } from "@/contexts/ThemeContext";

const FILTERS = ["All", "Word", "Excel", "PDF"] as const;

const SORT_OPTIONS = [
  { key: "recent", label: "Most Recent", icon: "clock" as const },
  { key: "name", label: "Name (A–Z)", icon: "type" as const },
  { key: "size", label: "File Size", icon: "hard-drive" as const },
];

type SortKey = "recent" | "name" | "size";
type FolderPickerMode = "move" | "upload" | null;

interface FolderItem {
  id: string;
  name: string;
  documentCount: number;
}

export default function DocumentsScreen() {
  const { documents: docs, folders, user } = useAuth();
  const {
    deleteFile: deleteFileMutation,
    moveFile: moveFileMutation,
    uploadFile: uploadFileMutation,
    renameFile: renameFileMutation,
  } = useDocumentActions();

  // --- Rename modal state ---
  const [docToRename, setDocToRename] = useState<DocumentItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const { isDark } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ folder?: string }>();

  const [documents, setDocuments] = useState<DocumentItem[]>(docs);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<(typeof FILTERS)[number]>("All");
  const [folderFilter, setFolderFilter] = useState<string | null>(
    params.folder ?? null,
  );
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

  // Folder picker — shared between "Move to Folder" and the upload button.
  const [docToMove, setDocToMove] = useState<DocumentItem | null>(null);
  const [folderPickerVisible, setFolderPickerVisible] = useState(false);
  const [folderPickerMode, setFolderPickerMode] =
    useState<FolderPickerMode>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderSearch, setFolderSearch] = useState("");
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    fileName: string;
    state: "uploading" | "success" | "error";
  } | null>(null);

  // Visible feedback while a document is being downloaded ahead of the
  // share sheet — the action sheet itself closes immediately on tap, so
  // without this the person has no indication anything is happening
  // during a slow network download.
  const [shareStatus, setShareStatus] = useState<{
    fileName: string;
    state: "preparing" | "error";
  } | null>(null);

  // When a folder is chosen for upload, we stash the target folder name
  // here instead of firing the native document picker immediately. On
  // iOS, presenting a new native view controller (the document picker)
  // while the folder-picker Modal is still mid-dismiss-animation causes
  // the native picker to silently never appear — the upload button just
  // spins forever. So we wait for the Modal to fully close (via its
  // onDismiss on iOS, or a short fallback delay elsewhere) before
  // actually invoking DocumentPicker.getDocumentAsync().
  const [pendingUploadFolder, setPendingUploadFolder] = useState<string | null>(
    null,
  );

  // Which document (by id) is currently being downloaded ahead of
  // handing it to the native share sheet.
  const [sharingDocId, setSharingDocId] = useState<string | null>(null);

  // Keep local list in sync with whatever the auth context has, since
  // mutations refresh user data there rather than mutating local state.
  useEffect(() => {
    setDocuments(docs);
  }, [docs]);

  // Arriving from the Folders screen with a different folder param (while
  // this screen is already mounted) should update the active filter.
  useEffect(() => {
    if (params.folder) setFolderFilter(params.folder);
  }, [params.folder]);

  // Android/web don't get Modal's onDismiss callback, so fall back to
  // firing the pending upload shortly after the Modal reports it's no
  // longer visible.
  useEffect(() => {
    if (Platform.OS === "ios") return; // handled by Modal's onDismiss instead
    if (!folderPickerVisible && pendingUploadFolder) {
      const t = setTimeout(() => {
        runPendingUpload();
      }, 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderPickerVisible, pendingUploadFolder]);

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

  const hasAnyDocuments = documents.length > 0;

  const filteredDocs = documents.filter((doc) => {
    if (folderFilter && doc.folder !== folderFilter) return false;
    const matchesSearch = doc.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === "All") return true;
    return getFileVisual(doc.title).category === activeFilter.toLowerCase();
  });

  const sortedFilteredDocs = useMemo(() => {
    const arr = [...filteredDocs];
    if (sortBy === "name") {
      arr.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "size") {
      arr.sort((a, b) => parseSizeToMB(b.size) - parseSizeToMB(a.size));
    } else {
      arr.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    }
    return arr;
  }, [filteredDocs, sortBy]);

  // Folders eligible for the picker: for a move, hide the doc's current
  // folder (moving "into" the same folder is a no-op); filter by search.
  const pickerFolders: FolderItem[] = useMemo(() => {
    const list = (folders ?? []) as FolderItem[];
    const withoutCurrent =
      folderPickerMode === "move" && docToMove
        ? list.filter((f) => f.name !== docToMove.folder)
        : list;
    if (!folderSearch.trim()) return withoutCurrent;
    const q = folderSearch.trim().toLowerCase();
    return withoutCurrent.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, folderPickerMode, docToMove, folderSearch]);

  const handleDelete = () => {
    if (!activeDoc) return;
    deleteFileMutation.mutate(
      { folder: activeDoc.folder, file: activeDoc.title },
      {
        onSuccess: () => setActiveDoc(null),
        onError: () =>
          Alert.alert(
            "Couldn't delete",
            "Something went wrong deleting this document. Please try again.",
          ),
      },
    );
  };

  const handleStub = (label: string) => {
    setActiveDoc(null);
    Alert.alert(label, "This action isn't wired up yet — coming soon.");
  };

  // The native share sheet (WhatsApp, AirDrop, Save to Files, etc.) needs
  // an actual local file, not a remote URL — so this downloads the file
  // from the backend to a local cache path first, then hands that local
  // uri to expo-sharing. Uses the SDK 54+ class-based File API
  // (File.downloadFileAsync) since the old FileSystem.downloadAsync
  // function now throws instead of working.
  const handleShare = async (doc: DocumentItem) => {
    setActiveDoc(null);

    if (!user?.id) {
      Alert.alert("Couldn't share", "You need to be signed in to share files.");
      return;
    }

    setSharingDocId(doc.id);
    setShareStatus({ fileName: doc.title, state: "preparing" });
    try {
      const token = await getAuthToken();
      const url = `${process.env.EXPO_PUBLIC_API_URL}/users/download-document/${user.id}/${encodeURIComponent(
        doc.folder,
      )}/${encodeURIComponent(doc.title)}`;

      // Naming the destination File explicitly (rather than a bare
      // Directory) keeps the local filename in our control instead of
      // relying on the server's Content-Disposition header.
      const destination = new File(Paths.cache, doc.title);
      const output = await File.downloadFileAsync(url, destination, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        idempotent: true, // overwrite if a previous share left this file behind
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        setShareStatus({ fileName: doc.title, state: "error" });
        setTimeout(() => setShareStatus(null), 2200);
        Alert.alert(
          "Sharing isn't available",
          "This device can't open the share sheet.",
        );
        return;
      }

      // Clear the banner right as the native share sheet takes over —
      // no need for a "success" state here since the share sheet itself
      // is the visible confirmation that the file is ready.
      setShareStatus(null);
      await Sharing.shareAsync(output.uri);
    } catch (err) {
      setShareStatus({ fileName: doc.title, state: "error" });
      setTimeout(() => setShareStatus(null), 2200);
      Alert.alert(
        "Couldn't share",
        "Something went wrong preparing this document.",
      );
    } finally {
      setSharingDocId(null);
    }
  };

  const openFolderPicker = (
    mode: FolderPickerMode,
    presetFolderName?: string | null,
  ) => {
    setFolderPickerMode(mode);
    setFolderSearch("");
    const preset = presetFolderName
      ? (folders as FolderItem[] | undefined)?.find(
          (f) => f.name === presetFolderName,
        )
      : undefined;
    setSelectedFolderId(preset?.id ?? null);
    setFolderPickerVisible(true);
  };

  const handleOpenMoveModal = () => {
    if (!activeDoc) return;
    setDocToMove(activeDoc);
    setActiveDoc(null);
    openFolderPicker("move");
  };

  const handleUploadPress = () => {
    openFolderPicker("upload", folderFilter);
  };

  const closeFolderPicker = () => {
    setFolderPickerVisible(false);
    setFolderPickerMode(null);
    setDocToMove(null);
    setSelectedFolderId(null);
    setFolderSearch("");
  };

  // Actually invokes the native document picker and runs the upload.
  // Only ever called once the folder-picker Modal has fully dismissed —
  // see the onDismiss prop on the Modal below and the Android/web
  // fallback effect above.
  const runPendingUpload = async () => {
    const folderName = pendingUploadFolder;
    setPendingUploadFolder(null);
    if (!folderName) return;

    setIsPickingFile(true);
    let asset: DocumentPicker.DocumentPickerAsset | undefined;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      asset = result.assets[0];
    } catch (err) {
      Alert.alert("Upload failed", "Something went wrong picking the file.");
      return;
    } finally {
      setIsPickingFile(false);
    }

    // On web, expo-document-picker's `uri` is a blob: URL that the
    // browser's FormData can't upload — the real payload is the `.file`
    // property (an actual browser File object). On native, there is no
    // `.file`, so this stays undefined and we fall back to the RN `uri`
    // descriptor automatically.
    const webFile = (asset as unknown as { file?: File }).file;

    setUploadStatus({ fileName: asset.name, state: "uploading" });
    try {
      await uploadFileMutation.mutateAsync({
        folderName,
        fileUri: asset.uri,
        fileName: asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream",
        webFile,
      });
      setUploadStatus({ fileName: asset.name, state: "success" });
    } catch (err) {
      setUploadStatus({ fileName: asset.name, state: "error" });
    } finally {
      setTimeout(() => setUploadStatus(null), 2200);
    }
  };

  const handleFolderPickerConfirm = async () => {
    const folder = (folders as FolderItem[] | undefined)?.find(
      (f) => f.id === selectedFolderId,
    );
    if (!folder) return;

    if (folderPickerMode === "move") {
      if (!docToMove) return;
      moveFileMutation.mutate(
        {
          previousDestination: docToMove.folder,
          newDestination: folder.name,
          file: docToMove.title,
        },
        {
          onSuccess: closeFolderPicker,
          onError: () =>
            Alert.alert(
              "Couldn't move",
              "Something went wrong moving this document. Please try again.",
            ),
        },
      );
      return;
    }

    if (folderPickerMode === "upload") {
      // Don't fire the native document picker in the same tick as
      // closing this Modal — queue the target folder and let it run
      // once the Modal has actually finished dismissing (see
      // runPendingUpload, the Modal's onDismiss prop, and the fallback
      // effect above).
      setPendingUploadFolder(folder.name);
      closeFolderPicker();
      return;
    }
  };
  const handleOpenRenameModal = () => {
    if (!activeDoc) return;
    setDocToRename(activeDoc);
    const { base } = splitExt(activeDoc.title);
    setRenameValue(base); // only the editable part, no extension
    setRenameError(null);
    setActiveDoc(null);
  };

  const closeRenameModal = () => {
    setDocToRename(null);
    setRenameValue("");
    setRenameError(null);
  };

  const handleRenameConfirm = () => {
    if (!docToRename) return;

    const trimmedBase = renameValue.trim();
    if (!trimmedBase) {
      setRenameError("Name can't be empty.");
      return;
    }

    const { ext } = splitExt(docToRename.title);
    const newName = `${trimmedBase}${ext}`;

    if (newName === docToRename.title) {
      closeRenameModal();
      return;
    }

    setRenameError(null);
    renameFileMutation.mutate(
      { folder: docToRename.folder, file: docToRename.title, newName },
      {
        onSuccess: closeRenameModal,
        onError: (err: any) => {
          const status = err?.response?.status;
          const message = err?.response?.data?.message;
          if (status === 409) {
            setRenameError(
              message ?? "A file with that name already exists in this folder.",
            );
          } else {
            setRenameError(
              message ??
                "Something went wrong renaming this document. Please try again.",
            );
          }
        },
      },
    );
  };
  const splitExt = (filename: string) => {
    const idx = filename.lastIndexOf(".");
    if (idx <= 0) return { base: filename, ext: "" };
    return { base: filename.slice(0, idx), ext: filename.slice(idx) };
  };

  const isConfirming =
    folderPickerMode === "move"
      ? moveFileMutation.isPending
      : isPickingFile || uploadFileMutation.isPending;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {uploadStatus && (
        <View
          style={[
            styles.uploadBanner,
            { backgroundColor: theme.card, borderColor: "#10b981" },
          ]}
        >
          {uploadStatus.state === "uploading" && (
            <ActivityIndicator size="small" color={theme.accent} />
          )}
          {uploadStatus.state === "success" && (
            <Feather name="check-circle" size={16} color={theme.accent} />
          )}
          {uploadStatus.state === "error" && (
            <Feather name="alert-circle" size={16} color="#dc2626" />
          )}
          <Text
            style={[styles.uploadBannerText, { color: theme.text }]}
            numberOfLines={1}
          >
            {uploadStatus.state === "uploading" &&
              `Uploading ${uploadStatus.fileName}…`}
            {uploadStatus.state === "success" &&
              `Uploaded ${uploadStatus.fileName}`}
            {uploadStatus.state === "error" &&
              `Couldn't upload ${uploadStatus.fileName}`}
          </Text>
        </View>
      )}

      {shareStatus && (
        <View
          style={[
            styles.uploadBanner,
            {
              backgroundColor: theme.card,
              borderColor: "#10b981",
              top: uploadStatus
                ? (Platform.OS === "ios" ? 54 : 18) + 50
                : Platform.OS === "ios"
                  ? 54
                  : 18,
            },
          ]}
        >
          {shareStatus.state === "preparing" && (
            <ActivityIndicator size="small" color={theme.accent} />
          )}
          {shareStatus.state === "error" && (
            <Feather name="alert-circle" size={16} color="#dc2626" />
          )}
          <Text
            style={[styles.uploadBannerText, { color: theme.text }]}
            numberOfLines={1}
          >
            {shareStatus.state === "preparing" &&
              `Preparing ${shareStatus.fileName}…`}
            {shareStatus.state === "error" &&
              `Couldn't prepare ${shareStatus.fileName}`}
          </Text>
        </View>
      )}

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Documents</Text>
            {folderFilter && (
              <TouchableOpacity
                style={styles.folderFilterRow}
                activeOpacity={0.7}
                onPress={() => setFolderFilter(null)}
              >
                <Feather name="folder" size={12} color={theme.accent} />
                <Text
                  style={[styles.folderFilterText, { color: theme.accent }]}
                >
                  {folderFilter}
                </Text>
                <Feather name="x" size={12} color={theme.accent} />
              </TouchableOpacity>
            )}
          </View>

          <View>
            <TouchableOpacity
              style={styles.sortButton}
              activeOpacity={0.7}
              onPress={() => setSortMenuOpen((v) => !v)}
            >
              <Feather name="sliders" size={20} color={theme.textMuted} />
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
                        size={15}
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
                        <Feather name="check" size={14} color={theme.accent} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Search Input */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.inputBg, borderColor: theme.border },
          ]}
        >
          <Ionicons name="search-outline" size={20} color={theme.textMuted} />
          <TextInput
            placeholder="Search documents..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills + Upload */}
        <View style={styles.filterRow}>
          <View style={styles.filterContainer}>
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isActive ? theme.accent : theme.card,
                      borderColor: isActive ? theme.accent : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: isActive ? "#ffffff" : theme.textMuted },
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.uploadButton,
              { backgroundColor: theme.accentSolid },
            ]}
            activeOpacity={0.85}
            onPress={handleUploadPress}
            disabled={isPickingFile || uploadStatus?.state === "uploading"}
          >
            {isPickingFile || uploadStatus?.state === "uploading" ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Feather name="upload" size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        {hasAnyDocuments && (
          <Text style={[styles.resultsCount, { color: theme.textMuted }]}>
            {sortedFilteredDocs.length}{" "}
            {sortedFilteredDocs.length === 1 ? "document" : "documents"}
          </Text>
        )}

        {/* Documents List */}
        <FlatList
          data={sortedFilteredDocs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !hasAnyDocuments ? (
              <View style={styles.emptyContainer}>
                <View
                  style={[
                    styles.emptyIconCircle,
                    { backgroundColor: theme.accentChip },
                  ]}
                >
                  <Feather name="file-plus" size={26} color={theme.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  No documents yet
                </Text>
                <Text
                  style={[styles.emptySubtitle, { color: theme.textMuted }]}
                >
                  Turn handwritten notes into clean, editable documents in
                  seconds. Scan your first page to see NoteOCR in action.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.emptyCta,
                    { backgroundColor: theme.accentSolid },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => router.push("/scan")}
                >
                  <Feather name="camera" size={15} color="#ffffff" />
                  <Text style={styles.emptyCtaText}>
                    Scan Your First Document
                  </Text>
                </TouchableOpacity>
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
                  No matching documents
                </Text>
                <Text
                  style={[styles.emptySubtitle, { color: theme.textMuted }]}
                >
                  Try a different search term or clear your filters.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.clearFiltersBtn,
                    { borderColor: theme.border },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSearchQuery("");
                    setActiveFilter("All");
                    setFolderFilter(null);
                  }}
                >
                  <Text
                    style={[styles.clearFiltersText, { color: theme.text }]}
                  >
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }
          renderItem={({ item }) => {
            const visual = getFileVisual(item.title);
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.docCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/documentEditor",
                    params: { folder: item.folder, fileName: item.title },
                  })
                }
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
                    {item.date} • {item.folder} • {item.size}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => setActiveDoc(item)}
                >
                  <Feather
                    name="more-vertical"
                    size={18}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Action sheet */}
      <Modal
        visible={!!activeDoc}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDoc(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setActiveDoc(null)}
          />
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />

            {activeDoc && (
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
                    name={getFileVisual(activeDoc.title).icon}
                    size={22}
                    color={getFileVisual(activeDoc.title).color}
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
                    {activeDoc.title}
                  </Text>
                  <Text
                    style={[
                      styles.actionSheetSubtitle,
                      { color: theme.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {activeDoc.folder} • {activeDoc.size}
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
                onPress={handleOpenRenameModal}
              >
                <View
                  style={[styles.actionIconChip, { backgroundColor: theme.bg }]}
                >
                  <Feather name="edit-2" size={16} color={theme.text} />
                </View>
                <Text style={[styles.actionRowText, { color: theme.text }]}>
                  Rename
                </Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.actionDivider,
                  { backgroundColor: theme.border },
                ]}
              />

              <TouchableOpacity
                style={styles.actionRow}
                activeOpacity={0.6}
                onPress={handleOpenMoveModal}
              >
                <View
                  style={[
                    styles.actionIconChip,
                    { backgroundColor: theme.accentChip },
                  ]}
                >
                  <Feather name="folder" size={16} color={theme.accent} />
                </View>
                <Text style={[styles.actionRowText, { color: theme.text }]}>
                  Move to Folder
                </Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.actionDivider,
                  { backgroundColor: theme.border },
                ]}
              />

              <TouchableOpacity
                style={styles.actionRow}
                activeOpacity={0.6}
                onPress={() => activeDoc && handleShare(activeDoc)}
                disabled={!!activeDoc && sharingDocId === activeDoc.id}
              >
                <View
                  style={[
                    styles.actionIconChip,
                    { backgroundColor: theme.accentChip },
                  ]}
                >
                  {activeDoc && sharingDocId === activeDoc.id ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : (
                    <Feather name="share-2" size={16} color={theme.accent} />
                  )}
                </View>
                <Text style={[styles.actionRowText, { color: theme.text }]}>
                  {activeDoc && sharingDocId === activeDoc.id
                    ? "Preparing…"
                    : "Share"}
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
                onPress={handleDelete}
                disabled={deleteFileMutation.isPending}
              >
                <View
                  style={[
                    styles.actionIconChip,
                    { backgroundColor: "rgba(220,38,38,0.12)" },
                  ]}
                >
                  {deleteFileMutation.isPending ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <Feather name="trash-2" size={16} color="#dc2626" />
                  )}
                </View>
                <Text style={[styles.actionRowText, { color: "#dc2626" }]}>
                  {deleteFileMutation.isPending ? "Deleting…" : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.actionCancelButton,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              activeOpacity={0.6}
              onPress={() => setActiveDoc(null)}
            >
              <Text style={[styles.actionCancelText, { color: theme.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Folder picker — used for both "Move to Folder" and Upload */}
      <Modal
        visible={folderPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={closeFolderPicker}
        // iOS-only: fires after the modal has fully finished dismissing.
        // We use this to safely kick off the native document picker
        // without stacking view-controller presentations, which is what
        // was causing the upload button to spin forever with no picker
        // ever appearing. Android/web fall back to the timeout-based
        // effect near the top of the component instead.
        onDismiss={
          Platform.OS === "ios"
            ? () => {
                if (pendingUploadFolder) runPendingUpload();
              }
            : undefined
        }
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeFolderPicker}
          />
          <View
            style={[styles.folderPickerSheet, { backgroundColor: theme.card }]}
          >
            <View style={styles.folderPickerHandle} />

            <Text style={[styles.actionSheetTitle, { color: theme.text }]}>
              {folderPickerMode === "move"
                ? `Move "${docToMove?.title}" to…`
                : "Choose a folder to upload to"}
            </Text>

            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.border,
                  marginBottom: 10,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={theme.textMuted}
              />
              <TextInput
                placeholder="Search folders..."
                placeholderTextColor={theme.textMuted}
                value={folderSearch}
                onChangeText={setFolderSearch}
                style={[styles.searchInput, { color: theme.text }]}
              />
            </View>

            {pickerFolders.length === 0 ? (
              <View style={styles.folderEmptyState}>
                <Feather name="folder" size={22} color={theme.textMuted} />
                <Text
                  style={[styles.folderEmptyText, { color: theme.textMuted }]}
                >
                  No folders match your search.
                </Text>
              </View>
            ) : (
              <FlatList
                data={pickerFolders}
                keyExtractor={(f) => f.id}
                style={styles.folderPickerList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = selectedFolderId === item.id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.folderRow,
                        {
                          backgroundColor: isSelected
                            ? theme.accentChip
                            : "transparent",
                          borderColor: isSelected ? theme.accent : theme.border,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setSelectedFolderId(item.id)}
                    >
                      <View
                        style={[
                          styles.folderIconWrap,
                          {
                            backgroundColor: isSelected
                              ? theme.accent
                              : theme.bg,
                          },
                        ]}
                      >
                        <Feather
                          name="folder"
                          size={16}
                          color={isSelected ? "#ffffff" : theme.textMuted}
                        />
                      </View>

                      <View style={styles.folderRowInfo}>
                        <Text
                          style={[styles.folderName, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={[
                            styles.folderCount,
                            { color: theme.textMuted },
                          ]}
                        >
                          {item.documentCount}{" "}
                          {item.documentCount === 1 ? "document" : "documents"}
                        </Text>
                      </View>

                      {isSelected && (
                        <Feather
                          name="check-circle"
                          size={20}
                          color={theme.accent}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <TouchableOpacity
              style={[
                styles.emptyCta,
                styles.folderConfirmButton,
                {
                  backgroundColor: theme.accentSolid,
                  opacity: selectedFolderId ? 1 : 0.5,
                },
              ]}
              activeOpacity={0.85}
              disabled={!selectedFolderId || isConfirming}
              onPress={handleFolderPickerConfirm}
            >
              {isConfirming ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Feather
                    name={folderPickerMode === "move" ? "folder" : "upload"}
                    size={15}
                    color="#ffffff"
                  />
                  <Text style={styles.emptyCtaText}>
                    {folderPickerMode === "move" ? "Move Here" : "Upload Here"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rename modal */}
      <Modal
        visible={!!docToRename}
        transparent
        animationType="fade"
        onRequestClose={closeRenameModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeRenameModal}
          />
          <View
            style={[styles.folderPickerSheet, { backgroundColor: theme.card }]}
          >
            <View style={styles.folderPickerHandle} />

            <Text style={[styles.actionSheetTitle, { color: theme.text }]}>
              Rename document
            </Text>

            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: renameError ? "#dc2626" : theme.border,
                  marginBottom: renameError ? 6 : 16,
                },
              ]}
            >
              <Feather name="file-text" size={16} color={theme.textMuted} />
              <TextInput
                value={renameValue}
                onChangeText={(text) => {
                  setRenameValue(text);
                  if (renameError) setRenameError(null);
                }}
                placeholder="File name"
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.text }]}
                autoFocus
                selectTextOnFocus
              />
            </View>

            {renameError && (
              <View style={styles.renameErrorRow}>
                <Feather name="alert-circle" size={13} color="#dc2626" />
                <Text style={styles.renameErrorText}>{renameError}</Text>
              </View>
            )}

            <View style={styles.renameButtonRow}>
              <TouchableOpacity
                style={[
                  styles.actionCancelButton,
                  styles.renameButtonHalf,
                  { borderColor: theme.border },
                ]}
                activeOpacity={0.7}
                onPress={closeRenameModal}
                disabled={renameFileMutation.isPending}
              >
                <Text style={[styles.actionCancelText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.emptyCta,
                  styles.renameButtonHalf,
                  {
                    backgroundColor: theme.accentSolid,
                    opacity: renameValue.trim() ? 1 : 0.5,
                  },
                ]}
                activeOpacity={0.85}
                disabled={!renameValue.trim() || renameFileMutation.isPending}
                onPress={handleRenameConfirm}
              >
                {renameFileMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.emptyCtaText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  uploadBanner: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 18,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: "88%",
    zIndex: 50,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderColor: "#10b981",
  },
  uploadBannerText: { fontSize: 13, fontWeight: "600", flexShrink: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "700" },
  folderFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  folderFilterText: { fontSize: 13, fontWeight: "600" },
  sortButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sortMenu: {
    position: "absolute",
    right: 0,
    top: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 6,
    minWidth: 170,
    zIndex: 10,
    elevation: 6,
  },
  sortMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sortMenuText: { flex: 1, fontSize: 14, fontWeight: "500" },
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
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: "600" },
  uploadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
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
  moreButton: { padding: 6 },
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
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  emptyCtaText: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  clearFiltersBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  clearFiltersText: { fontSize: 14, fontWeight: "600" },
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
  actionSheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 14,
  },
  actionGroup: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56, // aligns with the text, not under the icon chip
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
  folderPickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
    maxHeight: "78%",
  },
  folderPickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(148,163,184,0.5)",
    alignSelf: "center",
    marginBottom: 14,
  },
  folderPickerList: {
    marginBottom: 6,
  },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  folderIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  folderRowInfo: { flex: 1 },
  folderName: { fontSize: 14, fontWeight: "600" },
  folderCount: { fontSize: 12, marginTop: 2 },
  folderEmptyState: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 30,
  },
  folderEmptyText: { fontSize: 13 },
  folderConfirmButton: {
    justifyContent: "center",
    marginTop: 4,
  },
  renameErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  renameErrorText: { color: "#dc2626", fontSize: 12.5, flexShrink: 1 },
  renameButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  renameButtonHalf: {
    flex: 1,
    marginTop: 0,
  },
});
