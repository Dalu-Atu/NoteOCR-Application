import { useAuth } from "@/contexts/AuthContext";
import { useDocumentActions } from "@/hooks/useDocumentActions";
import { getAuthToken } from "@/services/api";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { PaywallModal } from "./PaywallModal";
import { DocumentItem } from "../data/mockDocuments";
import { getFileVisual } from "../utils/fileVisuals";

interface FolderItem {
  id: string;
  name: string;
  documentCount: number;
}

export interface DocumentActionSheetTheme {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  inputBg: string;
  accent: string;
  accentSolid: string;
  accentChip: string;
}

export interface DocumentActionSheetHandle {
  open: (doc: DocumentItem) => void;
}

interface Props {
  theme: DocumentActionSheetTheme;
  isFreePlan: boolean;
}

const BANNER_TOP = Platform.OS === "ios" ? 54 : 18;

export const DocumentActionSheet = forwardRef<DocumentActionSheetHandle, Props>(
  function DocumentActionSheet({ theme, isFreePlan }, ref) {
    const { user, folders } = useAuth();
    const router = useRouter();
    const {
      deleteFile: deleteFileMutation,
      moveFile: moveFileMutation,
      renameFile: renameFileMutation,
    } = useDocumentActions();

    const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

    const [docToRename, setDocToRename] = useState<DocumentItem | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [renameError, setRenameError] = useState<string | null>(null);

    const [docToMove, setDocToMove] = useState<DocumentItem | null>(null);
    const [folderPickerVisible, setFolderPickerVisible] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
      null,
    );
    const [folderSearch, setFolderSearch] = useState("");

    const [paywallVisible, setPaywallVisible] = useState(false);
    const [sharingDocId, setSharingDocId] = useState<string | null>(null);
    const [downloadingDocId, setDownloadingDocId] = useState<string | null>(
      null,
    );
    const [banner, setBanner] = useState<{
      text: string;
      state: "loading" | "success" | "error";
    } | null>(null);

    useImperativeHandle(ref, () => ({
      open: (doc: DocumentItem) => setActiveDoc(doc),
    }));

    const showBanner = (
      text: string,
      state: "loading" | "success" | "error",
    ) => {
      setBanner({ text, state });
      if (state !== "loading") setTimeout(() => setBanner(null), 2200);
    };

    const pickerFolders: FolderItem[] = useMemo(() => {
      const list = (folders ?? []) as FolderItem[];
      const withoutCurrent = docToMove
        ? list.filter((f) => f.name !== docToMove.folder)
        : list;
      if (!folderSearch.trim()) return withoutCurrent;
      const q = folderSearch.trim().toLowerCase();
      return withoutCurrent.filter((f) => f.name.toLowerCase().includes(q));
    }, [folders, docToMove, folderSearch]);

    const splitExt = (filename: string) => {
      const idx = filename.lastIndexOf(".");
      if (idx <= 0) return { base: filename, ext: "" };
      return { base: filename.slice(0, idx), ext: filename.slice(idx) };
    };

    const showPaywall = () => {
      setActiveDoc(null);
      setPaywallVisible(true);
    };

    const handleUpgrade = () => {
      setPaywallVisible(false);
      router.push("/billing");
    };

    const handleDelete = () => {
      if (!activeDoc) return;
      Alert.alert(
        "Delete document?",
        `"${activeDoc.title}" will be permanently deleted.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
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
            },
          },
        ],
      );
    };

    const handleShare = async (doc: DocumentItem) => {
      setActiveDoc(null);
      if (isFreePlan) {
        setPaywallVisible(true);
        return;
      }
      if (!user?.id) {
        Alert.alert(
          "Couldn't share",
          "You need to be signed in to share files.",
        );
        return;
      }

      setSharingDocId(doc.id);
      showBanner(`Preparing ${doc.title}…`, "loading");
      try {
        const token = await getAuthToken();
        const url = `${process.env.EXPO_PUBLIC_API_URL}/users/download-document/${user.id}/${encodeURIComponent(
          doc.folder,
        )}/${encodeURIComponent(doc.title)}`;

        const destination = new File(Paths.cache, doc.title);
        const output = await File.downloadFileAsync(url, destination, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          idempotent: true,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
          showBanner(`Couldn't prepare ${doc.title}`, "error");
          Alert.alert(
            "Sharing isn't available",
            "This device can't open the share sheet.",
          );
          return;
        }

        setBanner(null);
        await Sharing.shareAsync(output.uri);
      } catch (err) {
        showBanner(`Couldn't prepare ${doc.title}`, "error");
        Alert.alert(
          "Couldn't share",
          "Something went wrong preparing this document.",
        );
      } finally {
        setSharingDocId(null);
      }
    };

    const handleDownload = async (doc: DocumentItem) => {
      setActiveDoc(null);
      if (isFreePlan) {
        setPaywallVisible(true);
        return;
      }
      if (!user?.id) {
        Alert.alert(
          "Couldn't download",
          "You need to be signed in to download files.",
        );
        return;
      }

      setDownloadingDocId(doc.id);
      showBanner(`Downloading ${doc.title}…`, "loading");
      try {
        const token = await getAuthToken();
        const url = `${process.env.EXPO_PUBLIC_API_URL}/users/download-document/${user.id}/${encodeURIComponent(
          doc.folder,
        )}/${encodeURIComponent(doc.title)}`;

        const destination = new File(Paths.document, doc.title);
        const output = await File.downloadFileAsync(url, destination, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          idempotent: true,
        });

        showBanner(`Downloaded ${doc.title}`, "success");

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(output.uri, { dialogTitle: "Save file" });
        }
      } catch (err) {
        showBanner(`Couldn't download ${doc.title}`, "error");
        Alert.alert(
          "Couldn't download",
          "Something went wrong downloading this document.",
        );
      } finally {
        setDownloadingDocId(null);
      }
    };

    const handleOpenMoveModal = () => {
      if (!activeDoc) return;
      setDocToMove(activeDoc);
      setActiveDoc(null);
      setFolderSearch("");
      setSelectedFolderId(null);
      setFolderPickerVisible(true);
    };

    const closeFolderPicker = () => {
      setFolderPickerVisible(false);
      setDocToMove(null);
      setSelectedFolderId(null);
      setFolderSearch("");
    };

    const handleFolderPickerConfirm = () => {
      const folder = (folders as FolderItem[] | undefined)?.find(
        (f) => f.id === selectedFolderId,
      );
      if (!folder || !docToMove) return;
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
    };

    const handleOpenRenameModal = () => {
      if (!activeDoc) return;
      setDocToRename(activeDoc);
      const { base } = splitExt(activeDoc.title);
      setRenameValue(base);
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
            setRenameError(
              status === 409
                ? (message ??
                    "A file with that name already exists in this folder.")
                : (message ??
                    "Something went wrong renaming this document. Please try again."),
            );
          },
        },
      );
    };

    return (
      <>
        {banner && (
          <View
            style={[
              styles.banner,
              { backgroundColor: theme.card, borderColor: "#10b981" },
            ]}
          >
            {banner.state === "loading" && (
              <ActivityIndicator size="small" color={theme.accent} />
            )}
            {banner.state === "success" && (
              <Feather name="check-circle" size={16} color={theme.accent} />
            )}
            {banner.state === "error" && (
              <Feather name="alert-circle" size={16} color="#dc2626" />
            )}
            <Text
              style={[styles.bannerText, { color: theme.text }]}
              numberOfLines={1}
            >
              {banner.text}
            </Text>
          </View>
        )}

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
                    style={[
                      styles.actionIconChip,
                      { backgroundColor: theme.bg },
                    ]}
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
                  onPress={() =>
                    activeDoc &&
                    (isFreePlan ? showPaywall() : handleDownload(activeDoc))
                  }
                  disabled={!!activeDoc && downloadingDocId === activeDoc.id}
                >
                  <View
                    style={[
                      styles.actionIconChip,
                      {
                        backgroundColor: isFreePlan
                          ? theme.bg
                          : theme.accentChip,
                      },
                    ]}
                  >
                    {activeDoc && downloadingDocId === activeDoc.id ? (
                      <ActivityIndicator size="small" color={theme.accent} />
                    ) : (
                      <Feather
                        name="download"
                        size={16}
                        color={isFreePlan ? theme.textMuted : theme.accent}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.actionRowText,
                      { color: isFreePlan ? theme.textMuted : theme.text },
                    ]}
                  >
                    {activeDoc && downloadingDocId === activeDoc.id
                      ? "Downloading…"
                      : "Download"}
                  </Text>
                  {isFreePlan && (
                    <Feather
                      name="lock"
                      size={13}
                      color={theme.textMuted}
                      style={styles.lockBadge}
                    />
                  )}
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
                  onPress={() =>
                    activeDoc &&
                    (isFreePlan ? showPaywall() : handleShare(activeDoc))
                  }
                  disabled={!!activeDoc && sharingDocId === activeDoc.id}
                >
                  <View
                    style={[
                      styles.actionIconChip,
                      {
                        backgroundColor: isFreePlan
                          ? theme.bg
                          : theme.accentChip,
                      },
                    ]}
                  >
                    {activeDoc && sharingDocId === activeDoc.id ? (
                      <ActivityIndicator size="small" color={theme.accent} />
                    ) : (
                      <Feather
                        name="share-2"
                        size={16}
                        color={isFreePlan ? theme.textMuted : theme.accent}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.actionRowText,
                      { color: isFreePlan ? theme.textMuted : theme.text },
                    ]}
                  >
                    {activeDoc && sharingDocId === activeDoc.id
                      ? "Preparing…"
                      : "Share"}
                  </Text>
                  {isFreePlan && (
                    <Feather
                      name="lock"
                      size={13}
                      color={theme.textMuted}
                      style={styles.lockBadge}
                    />
                  )}
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

        {/* Folder picker (move) */}
        <Modal
          visible={folderPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={closeFolderPicker}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={closeFolderPicker}
            />
            <View
              style={[
                styles.folderPickerSheet,
                { backgroundColor: theme.card },
              ]}
            >
              <View style={styles.folderPickerHandle} />
              <Text style={[styles.actionSheetTitle, { color: theme.text }]}>
                Move "{docToMove?.title}" to…
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
                            borderColor: isSelected
                              ? theme.accent
                              : theme.border,
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
                            {item.documentCount === 1
                              ? "document"
                              : "documents"}
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
                  styles.confirmButton,
                  {
                    backgroundColor: theme.accentSolid,
                    opacity: selectedFolderId ? 1 : 0.5,
                  },
                ]}
                activeOpacity={0.85}
                disabled={!selectedFolderId || moveFileMutation.isPending}
                onPress={handleFolderPickerConfirm}
              >
                {moveFileMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Feather name="folder" size={15} color="#ffffff" />
                    <Text style={styles.confirmButtonText}>Move Here</Text>
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
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={closeRenameModal}
            />
            <View
              style={[
                styles.folderPickerSheet,
                { backgroundColor: theme.card },
              ]}
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
                  <Text
                    style={[styles.actionCancelText, { color: theme.text }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
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
                    <Text style={styles.confirmButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <PaywallModal
          visible={paywallVisible}
          onClose={() => setPaywallVisible(false)}
          onUpgrade={handleUpgrade}
        />
      </>
    );
  },
);

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: BANNER_TOP,
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
  },
  bannerText: { fontSize: 13, fontWeight: "600", flexShrink: 1 },
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
  actionSheetTitle: { fontSize: 15, fontWeight: "700", marginBottom: 14 },
  actionGroup: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  actionDivider: { height: StyleSheet.hairlineWidth, marginLeft: 56 },
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
  lockBadge: { marginLeft: "auto" },
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 15 },
  folderPickerList: { marginBottom: 6 },
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
  folderEmptyState: { alignItems: "center", gap: 8, paddingVertical: 30 },
  folderEmptyText: { fontSize: 13 },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  confirmButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  renameErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  renameErrorText: { color: "#dc2626", fontSize: 12.5, flexShrink: 1 },
  renameButtonRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  renameButtonHalf: { flex: 1, marginTop: 0 },
});
