import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import {
  useCreateBlankDocument,
  useUploadDocument,
} from "@/hooks/Usedocumentcreation ";
import { useAppTheme } from "../contexts/ThemeContext";

// ASSUMPTION: same editor route your DocumentPreviewScreen's Edit button
// already pushes to — kept as one constant so it's a one-line change if not.
const PREVIEW_ROUTE = "/documentPreview";

type EditDocumentMode = "upload" | "blank";
type BlankDocType = "docx" | "xlsx" | "pdf";
type Step = "picking" | "type" | "details";

interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
  webFile?: File;
}

interface FolderOption {
  id: string;
  name: string;
  documentCount: number;
}

// Matches the getDocumentType categories from your web app's
// documentService — restricts the native picker to the same set.
const ALLOWED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
];

const BLANK_TYPES: {
  type: BlankDocType;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}[] = [
  {
    type: "docx",
    title: "Word document",
    subtitle: "Blank .docx document",
    icon: "file-word-outline",
    color: "#2563eb",
  },
  {
    type: "xlsx",
    title: "Excel spreadsheet",
    subtitle: "Blank .xlsx spreadsheet",
    icon: "file-excel-outline",
    color: "#059669",
  },
  {
    type: "pdf",
    title: "PDF document",
    subtitle: "Blank .pdf document",
    icon: "file-pdf-box",
    color: "#dc2626",
  },
];

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
    emerald: "#10b981",
    emeraldSolid: "#059669",
    emeraldChip: isDark ? "rgba(16,185,129,0.14)" : "#ecfdf5",
    amber: "#f59e0b",
    amberChip: isDark ? "rgba(245,158,11,0.14)" : "#fffbeb",
    danger: "#ef4444",
    dangerChip: isDark ? "rgba(239,68,68,0.14)" : "#fef2f2",
  };
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function CreateDocumentScreen() {
  const { mode: rawMode } = useLocalSearchParams<{ mode?: string }>();
  const mode: EditDocumentMode = rawMode === "upload" ? "upload" : "blank";

  const { user, folders } = useAuth();
  const { isDark } = useAppTheme();
  const router = useRouter();
  const uploadMutation = useUploadDocument();
  const createMutation = useCreateBlankDocument();
  const isPickingRef = useRef(false);

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [step, setStep] = useState<Step>(
    mode === "upload" ? "picking" : "type",
  );
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [selectedType, setSelectedType] = useState<BlankDocType | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "error";
    message: string;
  } | null>(null);

  const handlePickFile = async () => {
    // Bail out if a pick is already in progress — prevents the
    // "Different document picking in progress" native error that
    // fires when getDocumentAsync is called twice concurrently
    // (e.g. React 18 double-invoking effects in dev, or a fast
    // double-tap on "Browse files").
    if (isPickingRef.current) return;
    isPickingRef.current = true;

    setStatus(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_MIME_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setPickedFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType || "application/octet-stream",
        size: asset.size ?? 0,
        webFile: Platform.OS === "web" ? (asset as any).file : undefined,
      });
      setStep("details");
    } catch (err) {
      console.error("[create-document] file pick failed:", err);
      setStatus({
        type: "error",
        message: "Couldn't open the file picker. Please try again.",
      });
    } finally {
      isPickingRef.current = false;
    }
  };

  useEffect(() => {
    if (mode === "upload" && step === "picking" && !pickedFile) {
      handlePickFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Upload mode opens the native file picker immediately, matching the
  // web app's "click it, straight to your file explorer" behavior.
  useEffect(() => {
    if (mode === "upload" && step === "picking" && !pickedFile) {
      handlePickFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectType = (type: BlankDocType) => {
    setSelectedType(type);
    setStep("details");
  };

  const canSubmit =
    !!selectedFolder &&
    (mode === "upload" ? !!pickedFile : documentName.trim().length > 0);

  const handleSubmit = () => {
    if (!user?.id || !selectedFolder) return;

    setSubmitting(true);
    setStatus(null);

    if (mode === "upload") {
      if (!pickedFile) return;
      uploadMutation.mutate(
        {
          userId: user.id,
          folderName: selectedFolder,
          fileName: pickedFile.name,
          mimeType: pickedFile.mimeType,
          fileUri: pickedFile.webFile ? undefined : pickedFile.uri,
          webFile: pickedFile.webFile,
        },
        {
          onSuccess: (data: any) => {
            setSubmitting(false);
            router.replace({
              pathname: PREVIEW_ROUTE,
              params: {
                folder: data.document.dest,
                fileName: data.document.name,
              },
            });
          },
          onError: (err: any) => {
            setSubmitting(false);
            setStatus({
              type: "error",
              message:
                err?.response?.data?.message ||
                "Upload failed. Please try again.",
            });
          },
        },
      );
    } else {
      if (!selectedType || !documentName.trim()) return;
      createMutation.mutate(
        {
          userId: user.id,
          folderName: selectedFolder,
          documentName: documentName.trim(),
          fileType: selectedType,
        },
        {
          onSuccess: (data: any) => {
            setSubmitting(false);
            router.replace({
              pathname: PREVIEW_ROUTE,
              params: {
                folder: data.document.dest ?? data.document.folder,
                fileName: data.document.name,
              },
            });
          },
          onError: (err: any) => {
            setSubmitting(false);
            setStatus({
              type: "error",
              message:
                err?.response?.data?.message ||
                "Couldn't create the document. Please try again.",
            });
          },
        },
      );
    }
  };

  const headerTitle =
    step === "picking"
      ? "Choose a file"
      : step === "type"
        ? "Create blank document"
        : mode === "upload"
          ? "Save to folder"
          : "Name & save";

  const handleBack = () => {
    if (step === "details" && mode === "blank") {
      setStep("type");
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={10}
          style={styles.headerIconButton}
        >
          <Feather
            name={step === "details" && mode === "blank" ? "arrow-left" : "x"}
            size={20}
            color={theme.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={styles.headerIconButton} />
      </View>

      {step === "picking" && (
        <View style={styles.centerState}>
          <View style={styles.centerIcon}>
            <Feather name="upload" size={26} color={theme.amber} />
          </View>
          <Text style={styles.centerTitle}>Choose a document</Text>
          <Text style={styles.centerSubtitle}>
            Pick a Word, Excel, PDF, CSV, or PowerPoint file from your device
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handlePickFile}
            disabled={isPickingRef.current}
          >
            <Feather name="folder" size={16} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Browse files</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === "type" && (
        <ScrollView
          contentContainerStyle={styles.typeScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.typeIntro}>
            What kind of document do you want to start with?
          </Text>
          {BLANK_TYPES.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={styles.typeCard}
              activeOpacity={0.8}
              onPress={() => handleSelectType(option.type)}
            >
              <View style={styles.typeCardIcon}>
                <MaterialCommunityIcons
                  name={option.icon}
                  size={26}
                  color={option.color}
                />
              </View>
              <View style={styles.typeCardText}>
                <Text style={styles.typeCardTitle}>{option.title}</Text>
                <Text style={styles.typeCardSubtitle}>{option.subtitle}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {step === "details" && (
        <View style={styles.flexFill}>
          <ScrollView
            contentContainerStyle={styles.detailsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {mode === "upload" && pickedFile ? (
              <View style={styles.filePreviewCard}>
                <View style={styles.filePreviewIcon}>
                  <Feather name="file" size={20} color={theme.amber} />
                </View>
                <View style={styles.filePreviewText}>
                  <Text style={styles.filePreviewName} numberOfLines={1}>
                    {pickedFile.name}
                  </Text>
                  <Text style={styles.filePreviewMeta}>
                    {formatBytes(pickedFile.size)}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Document name</Text>
                <TextInput
                  value={documentName}
                  onChangeText={setDocumentName}
                  style={styles.textInput}
                  placeholder="Document name"
                  placeholderTextColor={theme.textMuted}
                  editable={!submitting}
                  autoFocus
                />
              </>
            )}

            <Text style={styles.fieldLabel}>Save to folder</Text>
            {folders.length === 0 ? (
              <Text style={styles.noFoldersText}>
                No folders yet — create one from the Documents tab first.
              </Text>
            ) : (
              <View style={styles.folderGrid}>
                {folders.map((folder: FolderOption) => {
                  const isSelected = selectedFolder === folder.name;
                  return (
                    <TouchableOpacity
                      key={folder.id}
                      style={[
                        styles.folderChip,
                        isSelected && styles.folderChipSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedFolder(folder.name)}
                      disabled={submitting}
                    >
                      <Text
                        style={[
                          styles.folderChipName,
                          isSelected && styles.folderChipNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {folder.name}
                      </Text>
                      <Text
                        style={[
                          styles.folderChipCount,
                          isSelected && styles.folderChipCountSelected,
                        ]}
                      >
                        {folder.documentCount} files
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {status && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color={theme.danger} />
                <Text style={styles.errorBannerText}>{status.message}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.detailsFooter}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!canSubmit || submitting) && styles.primaryButtonDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              {submitting ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.primaryButtonText}>
                    {mode === "upload" ? "Uploading…" : "Creating…"}
                  </Text>
                </>
              ) : (
                <Text style={styles.primaryButtonText}>
                  {mode === "upload" ? "Upload & edit" : "Create document"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    flexFill: { flex: 1 },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    headerIconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: theme.textPrimary,
    },

    /* PICKING STATE */
    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    centerIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.amberChip,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 18,
    },
    centerTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: theme.textPrimary,
      marginBottom: 8,
    },
    centerSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 19,
      marginBottom: 24,
    },

    /* TYPE STEP */
    typeScrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 24,
      gap: 12,
    },
    typeIntro: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 6,
    },
    typeCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    typeCardIcon: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor: theme.chip,
      justifyContent: "center",
      alignItems: "center",
    },
    typeCardText: { flex: 1 },
    typeCardTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 2,
    },
    typeCardSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
    },

    /* DETAILS STEP */
    detailsScrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    filePreviewCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginTop: 6,
      marginBottom: 22,
    },
    filePreviewIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.amberChip,
      justifyContent: "center",
      alignItems: "center",
    },
    filePreviewText: { flex: 1 },
    filePreviewName: {
      fontSize: 13.5,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 2,
    },
    filePreviewMeta: {
      fontSize: 11.5,
      color: theme.textMuted,
    },
    fieldLabel: {
      fontSize: 12.5,
      fontWeight: "700",
      color: theme.textSecondary,
      marginBottom: 8,
      marginTop: 4,
    },
    textInput: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 13,
      fontSize: 14,
      fontWeight: "600",
      color: theme.textPrimary,
      marginBottom: 20,
    },
    folderGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 8,
    },
    folderChip: {
      width: "47%",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    folderChipSelected: {
      backgroundColor: theme.emeraldChip,
      borderColor: theme.emerald,
    },
    folderChipName: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.textPrimary,
      marginBottom: 2,
    },
    folderChipNameSelected: { color: theme.emeraldSolid },
    folderChipCount: {
      fontSize: 11,
      color: theme.textMuted,
    },
    folderChipCountSelected: { color: theme.emeraldSolid },
    noFoldersText: {
      fontSize: 12.5,
      color: theme.textMuted,
      marginBottom: 8,
    },
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.dangerChip,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: 8,
    },
    errorBannerText: {
      flex: 1,
      fontSize: 12.5,
      color: theme.danger,
      fontWeight: "600",
    },
    detailsFooter: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === "ios" ? 30 : 20,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
    },

    /* SHARED */
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.emeraldSolid,
      paddingVertical: 15,
      borderRadius: 14,
    },
    primaryButtonDisabled: { opacity: 0.45 },
    primaryButtonText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "700",
    },
  });
}
