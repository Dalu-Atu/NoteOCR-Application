// import { Feather } from "@expo/vector-icons";
// import * as ImagePicker from "expo-image-picker";
// import { Stack, useLocalSearchParams, useRouter } from "expo-router";
// import { useMemo, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Image,
//   Platform,
//   SafeAreaView,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";

// import { useAuth } from "@/contexts/AuthContext";
// import { useTranscribe } from "@/hooks/useTranscribe";
// import {
//   compressAndEncode,
//   MAX_IMAGES_PER_CONVERSION,
// } from "@/utils/imageUtils";
// import { useAppTheme } from "../contexts/ThemeContext";

// // ASSUMPTION: adjust this to whatever your actual preview route is named —
// // this is the only place the redirect target is defined.
// const PREVIEW_ROUTE = "/documentPreview";

// type ConversionType = "imageToWord" | "imageToExcel";

// interface CapturedPage {
//   id: string;
//   uri: string;
// }

// interface FolderOption {
//   id: string;
//   name: string;
//   documentCount: number;
// }

// function getTheme(isDark: boolean) {
//   return {
//     isDark,
//     bg: isDark ? "#0f172a" : "#f8fafc",
//     card: isDark ? "#1e293b" : "#ffffff",
//     chip: isDark ? "#0f172a" : "#f8fafc",
//     border: isDark ? "#334155" : "#f1f5f9",
//     divider: isDark ? "#334155" : "#f1f5f9",
//     textPrimary: isDark ? "#f8fafc" : "#0f172a",
//     textSecondary: isDark ? "#94a3b8" : "#64748b",
//     textMuted: isDark ? "#64748b" : "#94a3b8",
//     emerald: "#10b981",
//     emeraldSolid: "#059669",
//     emeraldChip: isDark ? "rgba(16,185,129,0.14)" : "#ecfdf5",
//     danger: "#ef4444",
//     dangerChip: isDark ? "rgba(239,68,68,0.14)" : "#fef2f2",
//   };
// }

// export default function ScanScreen() {
//   const { format } = useLocalSearchParams<{ format?: "word" | "excel" }>();
//   const { user, folders } = useAuth();
//   const { isDark } = useAppTheme();
//   const router = useRouter();
//   const transcribeMutation = useTranscribe();

//   const theme = useMemo(() => getTheme(isDark), [isDark]);
//   const styles = useMemo(() => createStyles(theme), [theme]);

//   const conversionType: ConversionType =
//     format === "excel" ? "imageToExcel" : "imageToWord";

//   const [step, setStep] = useState<"capture" | "details">("capture");
//   const [pages, setPages] = useState<CapturedPage[]>([]);
//  const [documentName, setDocumentName] = useState(
//    () =>
//      `Scan ${new Date().toLocaleDateString("en-GB", {
//        day: "2-digit",
//        month: "short",
//      })} ${new Date().toLocaleTimeString("en-GB", {
//        hour: "2-digit",
//        minute: "2-digit",
//      })}`,
//  );
//   const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
//   const [converting, setConverting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const atLimit = pages.length >= MAX_IMAGES_PER_CONVERSION;

//   const addPages = (uris: string[]) => {
//     const room = MAX_IMAGES_PER_CONVERSION - pages.length;
//     if (room <= 0) return;
//     const next = uris.slice(0, room).map((uri) => ({
//       id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
//       uri,
//     }));
//     setPages((prev) => [...prev, ...next]);
//   };

//   const handleTakePhoto = async () => {
//     if (atLimit) return;
//     try {
//       const permission = await ImagePicker.requestCameraPermissionsAsync();
//       if (!permission.granted) {
//         // On iOS, a missing NSCameraUsageDescription (set via the
//         // expo-image-picker config plugin) makes this resolve to
//         // granted: false immediately, with no OS dialog ever shown —
//         // if you never see a permission prompt at all, that's the cause.
//         Alert.alert(
//           "Camera access needed",
//           "Enable camera access in Settings to scan a document.",
//         );
//         return;
//       }
//       const result = await ImagePicker.launchCameraAsync({
//         quality: 0.9,
//         allowsEditing: true, // native crop before the page is added
//       });
//       if (!result.canceled && result.assets?.[0]?.uri) {
//         addPages([result.assets[0].uri]);
//       }
//     } catch (err) {
//       console.error("[scan] camera launch failed:", err);
//       Alert.alert(
//         "Couldn't open camera",
//         "Something went wrong opening the camera. Please try again.",
//       );
//     }
//   };

//   const handleChooseFromLibrary = async () => {
//     if (atLimit) return;
//     try {
//       const permission =
//         await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!permission.granted) {
//         Alert.alert(
//           "Photo access needed",
//           "Enable photo library access in Settings to choose an image.",
//         );
//         return;
//       }
//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         quality: 0.9,
//         allowsMultipleSelection: true,
//         selectionLimit: MAX_IMAGES_PER_CONVERSION - pages.length,
//       });
//       if (!result.canceled && result.assets?.length) {
//         addPages(result.assets.map((asset) => asset.uri));
//       }
//     } catch (err) {
//       console.error("[scan] library picker failed:", err);
//       Alert.alert(
//         "Couldn't open photo library",
//         "Something went wrong opening your photos. Please try again.",
//       );
//     }
//   };

//   const removePage = (id: string) => {
//     setPages((prev) => prev.filter((page) => page.id !== id));
//   };

//   const handleConvert = async () => {
//     if (!user?.id || !selectedFolder || !documentName.trim()) return;

//     setConverting(true);
//     setError(null);

//     let base64Images: string[];
//     try {
//       base64Images = await Promise.all(
//         pages.map((page) => compressAndEncode(page.uri)),
//       );
//     } catch {
//       setConverting(false);
//       setError("Couldn't process one or more images. Please try again.");
//       return;
//     }

//     // Conversion time scales with page count (each page is a real AI
//     // call server-side) — give the request enough runway instead of
//     // racing a fixed timeout against variable-length work. Capped at
//     // 5 minutes so a genuinely dead connection still fails eventually.
//     const timeoutMs = Math.min(300000, 100000 + pages.length * 20000);

//     transcribeMutation.mutate(
//       {
//         payload: {
//           images: base64Images,
//           userId: user.id,
//           conversionType,
//           documentName: documentName.trim(),
//           folder: selectedFolder,
//         },
//         timeoutMs,
//       },
//       {
//         onSuccess: (data) => {
//           setConverting(false);
//           router.replace({
//             pathname: PREVIEW_ROUTE,
//             params: {
//               folder: data.document.folder,
//               fileName: data.document.name,
//             },
//           });
//         },
//         onError: (err: any) => {
//             console.error("[scan] conversion failed:", err);
//           setConverting(false);
//           const isTimeout = err?.code === "ECONNABORTED";
//           setError(
//             isTimeout
//               ? "This is taking longer than expected. The document may still finish processing — check Recent Documents in a moment."
//               : err?.response?.data?.error ||
//                   "Conversion failed. Please try again.",
//           );
//         },
//       },
//     );
//   };

//   const canContinue = pages.length > 0;
//   const canConvert = !!selectedFolder && documentName.trim().length > 0;

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <Stack.Screen options={{ headerShown: false }} />
//       <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

//       {/* HEADER */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() =>
//             step === "details" ? setStep("capture") : router.back()
//           }
//           hitSlop={10}
//           style={styles.headerIconButton}
//         >
//           <Feather
//             name={step === "details" ? "arrow-left" : "x"}
//             size={20}
//             color={theme.textPrimary}
//           />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>
//           {step === "capture" ? "Scan document" : "Name & save"}
//         </Text>
//         <View style={styles.headerIconButton} />
//       </View>

//       {step === "capture" ? (
//         <CaptureStep
//           theme={theme}
//           styles={styles}
//           pages={pages}
//           atLimit={atLimit}
//           onTakePhoto={handleTakePhoto}
//           onChooseFromLibrary={handleChooseFromLibrary}
//           onRemovePage={removePage}
//           onContinue={() => setStep("details")}
//           canContinue={canContinue}
//         />
//       ) : (
//         <DetailsStep
//           theme={theme}
//           styles={styles}
//           pages={pages}
//           documentName={documentName}
//           onChangeDocumentName={setDocumentName}
//           folders={folders}
//           selectedFolder={selectedFolder}
//           onSelectFolder={setSelectedFolder}
//           converting={converting}
//           error={error}
//           canConvert={canConvert}
//           onConvert={handleConvert}
//         />
//       )}
//     </SafeAreaView>
//   );
// }

// /* ---------------------------------------------------------
//    STEP 1 — CAPTURE
//    Camera-first: "Take photo" is the primary action, library is
//    secondary. Supports repeated capture for multi-page notes.
// --------------------------------------------------------- */
// function CaptureStep({
//   theme,
//   styles,
//   pages,
//   atLimit,
//   onTakePhoto,
//   onChooseFromLibrary,
//   onRemovePage,
//   onContinue,
//   canContinue,
// }: {
//   theme: ReturnType<typeof getTheme>;
//   styles: ReturnType<typeof createStyles>;
//   pages: CapturedPage[];
//   atLimit: boolean;
//   onTakePhoto: () => void;
//   onChooseFromLibrary: () => void;
//   onRemovePage: (id: string) => void;
//   onContinue: () => void;
//   canContinue: boolean;
// }) {
//   return (
//     <View style={styles.flexFill}>
//       <ScrollView
//         contentContainerStyle={styles.captureScrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         {pages.length === 0 ? (
//           <View style={styles.captureEmptyState}>
//             <View style={styles.captureEmptyIcon}>
//               <Feather name="camera" size={28} color={theme.emerald} />
//             </View>
//             <Text style={styles.captureEmptyTitle}>Scan your first page</Text>
//             <Text style={styles.captureEmptySubtitle}>
//               Snap a photo of a handwritten page, or pick existing images from
//               your library.
//             </Text>
//           </View>
//         ) : (
//           <>
//             <View style={styles.pageCounterRow}>
//               <Text style={styles.pageCounterText}>
//                 {pages.length} of {MAX_IMAGES_PER_CONVERSION} pages
//               </Text>
//             </View>
//             <View style={styles.pageGrid}>
//               {pages.map((page, i) => (
//                 <View key={page.id} style={styles.pageThumbWrap}>
//                   <Image source={{ uri: page.uri }} style={styles.pageThumb} />
//                   <View style={styles.pageThumbBadge}>
//                     <Text style={styles.pageThumbBadgeText}>{i + 1}</Text>
//                   </View>
//                   <TouchableOpacity
//                     style={styles.pageThumbRemove}
//                     onPress={() => onRemovePage(page.id)}
//                     hitSlop={8}
//                   >
//                     <Feather name="x" size={12} color="#ffffff" />
//                   </TouchableOpacity>
//                 </View>
//               ))}
//             </View>
//           </>
//         )}
//       </ScrollView>

//       <View style={styles.captureFooter}>
//         <View style={styles.captureActionRow}>
//           <TouchableOpacity
//             style={[
//               styles.captureActionButton,
//               atLimit && styles.disabledButton,
//             ]}
//             activeOpacity={0.8}
//             onPress={onTakePhoto}
//             disabled={atLimit}
//           >
//             <Feather name="camera" size={18} color={theme.emeraldSolid} />
//             <Text style={styles.captureActionText}>
//               {pages.length === 0 ? "Take photo" : "Add page"}
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               styles.captureActionButton,
//               atLimit && styles.disabledButton,
//             ]}
//             activeOpacity={0.8}
//             onPress={onChooseFromLibrary}
//             disabled={atLimit}
//           >
//             <Feather name="image" size={18} color={theme.emeraldSolid} />
//             <Text style={styles.captureActionText}>Choose from library</Text>
//           </TouchableOpacity>
//         </View>

//         <TouchableOpacity
//           style={[
//             styles.primaryButton,
//             !canContinue && styles.primaryButtonDisabled,
//           ]}
//           activeOpacity={0.85}
//           onPress={onContinue}
//           disabled={!canContinue}
//         >
//           <Text style={styles.primaryButtonText}>
//             Continue{pages.length > 0 ? ` · ${pages.length}` : ""}
//           </Text>
//           <Feather name="arrow-right" size={16} color="#ffffff" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// /* ---------------------------------------------------------
//    STEP 2 — DETAILS
//    Document name + folder grid, mirrors the web "Convert Image"
//    modal's second view. Convert button sends the request.
// --------------------------------------------------------- */
// function DetailsStep({
//   theme,
//   styles,
//   pages,
//   documentName,
//   onChangeDocumentName,
//   folders,
//   selectedFolder,
//   onSelectFolder,
//   converting,
//   error,
//   canConvert,
//   onConvert,
// }: {
//   theme: ReturnType<typeof getTheme>;
//   styles: ReturnType<typeof createStyles>;
//   pages: CapturedPage[];
//   documentName: string;
//   onChangeDocumentName: (value: string) => void;
//   folders: FolderOption[];
//   selectedFolder: string | null;
//   onSelectFolder: (name: string) => void;
//   converting: boolean;
//   error: string | null;
//   canConvert: boolean;
//   onConvert: () => void;
// }) {
//   return (
//     <View style={styles.flexFill}>
//       <ScrollView
//         contentContainerStyle={styles.detailsScrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={styles.pagesPreviewRow}>
//           {pages.slice(0, 4).map((page) => (
//             <Image
//               key={page.id}
//               source={{ uri: page.uri }}
//               style={styles.pagesPreviewThumb}
//             />
//           ))}
//           {pages.length > 4 && (
//             <View style={styles.pagesPreviewMore}>
//               <Text style={styles.pagesPreviewMoreText}>
//                 +{pages.length - 4}
//               </Text>
//             </View>
//           )}
//         </View>

//         <Text style={styles.fieldLabel}>Document name</Text>
//         <TextInput
//           value={documentName}
//           onChangeText={onChangeDocumentName}
//           style={styles.textInput}
//           placeholder="Document name"
//           placeholderTextColor={theme.textMuted}
//           editable={!converting}
//         />

//         <Text style={styles.fieldLabel}>Save to folder</Text>
//         {folders.length === 0 ? (
//           <Text style={styles.noFoldersText}>
//             No folders yet — create one from the Documents tab first.
//           </Text>
//         ) : (
//           <View style={styles.folderGrid}>
//             {folders.map((folder) => {
//               const isSelected = selectedFolder === folder.name;
//               return (
//                 <TouchableOpacity
//                   key={folder.id}
//                   style={[
//                     styles.folderChip,
//                     isSelected && styles.folderChipSelected,
//                   ]}
//                   activeOpacity={0.8}
//                   onPress={() => onSelectFolder(folder.name)}
//                   disabled={converting}
//                 >
//                   <Text
//                     style={[
//                       styles.folderChipName,
//                       isSelected && styles.folderChipNameSelected,
//                     ]}
//                     numberOfLines={1}
//                   >
//                     {folder.name}
//                   </Text>
//                   <Text
//                     style={[
//                       styles.folderChipCount,
//                       isSelected && styles.folderChipCountSelected,
//                     ]}
//                   >
//                     {folder.documentCount} files
//                   </Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//         )}

//         {error && (
//           <View style={styles.errorBanner}>
//             <Feather name="alert-circle" size={16} color={theme.danger} />
//             <Text style={styles.errorBannerText}>{error}</Text>
//           </View>
//         )}
//       </ScrollView>

//       <View style={styles.detailsFooter}>
//         <TouchableOpacity
//           style={[
//             styles.primaryButton,
//             (!canConvert || converting) && styles.primaryButtonDisabled,
//           ]}
//           activeOpacity={0.85}
//           onPress={onConvert}
//           disabled={!canConvert || converting}
//         >
//           {converting ? (
//             <>
//               <ActivityIndicator size="small" color="#ffffff" />
//               <Text style={styles.primaryButtonText}>Converting…</Text>
//             </>
//           ) : (
//             <Text style={styles.primaryButtonText}>
//               Convert {pages.length} page{pages.length === 1 ? "" : "s"}
//             </Text>
//           )}
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// function createStyles(theme: ReturnType<typeof getTheme>) {
//   return StyleSheet.create({
//     safeArea: {
//       flex: 1,
//       backgroundColor: theme.bg,
//       paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
//     },
//     flexFill: {
//       flex: 1,
//     },

//     /* HEADER */
//     header: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//       paddingHorizontal: 12,
//       paddingVertical: 10,
//     },
//     headerIconButton: {
//       width: 38,
//       height: 38,
//       borderRadius: 19,
//       justifyContent: "center",
//       alignItems: "center",
//     },
//     headerTitle: {
//       fontSize: 15,
//       fontWeight: "800",
//       color: theme.textPrimary,
//     },

//     /* CAPTURE STEP */
//     captureScrollContent: {
//       flexGrow: 1,
//       paddingHorizontal: 20,
//       paddingBottom: 24,
//     },
//     captureEmptyState: {
//       flex: 1,
//       alignItems: "center",
//       justifyContent: "center",
//       paddingVertical: 60,
//       paddingHorizontal: 16,
//     },
//     captureEmptyIcon: {
//       width: 64,
//       height: 64,
//       borderRadius: 32,
//       backgroundColor: theme.emeraldChip,
//       justifyContent: "center",
//       alignItems: "center",
//       marginBottom: 18,
//     },
//     captureEmptyTitle: {
//       fontSize: 17,
//       fontWeight: "800",
//       color: theme.textPrimary,
//       marginBottom: 8,
//     },
//     captureEmptySubtitle: {
//       fontSize: 13,
//       color: theme.textSecondary,
//       textAlign: "center",
//       lineHeight: 19,
//       maxWidth: 260,
//     },
//     pageCounterRow: {
//       marginTop: 8,
//       marginBottom: 14,
//     },
//     pageCounterText: {
//       fontSize: 12.5,
//       fontWeight: "700",
//       color: theme.textSecondary,
//     },
//     pageGrid: {
//       flexDirection: "row",
//       flexWrap: "wrap",
//       gap: 12,
//     },
//     pageThumbWrap: {
//       width: "31%",
//       aspectRatio: 0.75,
//       borderRadius: 14,
//       overflow: "hidden",
//       backgroundColor: theme.chip,
//     },
//     pageThumb: {
//       width: "100%",
//       height: "100%",
//     },
//     pageThumbBadge: {
//       position: "absolute",
//       left: 6,
//       bottom: 6,
//       backgroundColor: "rgba(15,23,42,0.65)",
//       borderRadius: 10,
//       paddingHorizontal: 7,
//       paddingVertical: 2,
//     },
//     pageThumbBadgeText: {
//       fontSize: 10.5,
//       fontWeight: "700",
//       color: "#ffffff",
//     },
//     pageThumbRemove: {
//       position: "absolute",
//       top: 6,
//       right: 6,
//       width: 20,
//       height: 20,
//       borderRadius: 10,
//       backgroundColor: "rgba(15,23,42,0.65)",
//       justifyContent: "center",
//       alignItems: "center",
//     },
//     captureFooter: {
//       paddingHorizontal: 20,
//       paddingTop: 12,
//       paddingBottom: Platform.OS === "ios" ? 30 : 20,
//       borderTopWidth: 1,
//       borderTopColor: theme.divider,
//       gap: 12,
//     },
//     captureActionRow: {
//       flexDirection: "row",
//       gap: 10,
//     },
//     captureActionButton: {
//       flex: 1,
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "center",
//       gap: 8,
//       paddingVertical: 13,
//       borderRadius: 14,
//       backgroundColor: theme.emeraldChip,
//     },
//     captureActionText: {
//       fontSize: 12.5,
//       fontWeight: "700",
//       color: theme.emeraldSolid,
//     },
//     disabledButton: {
//       opacity: 0.45,
//     },

//     /* DETAILS STEP */
//     detailsScrollContent: {
//       paddingHorizontal: 20,
//       paddingBottom: 24,
//     },
//     pagesPreviewRow: {
//       flexDirection: "row",
//       gap: 8,
//       marginTop: 6,
//       marginBottom: 22,
//     },
//     pagesPreviewThumb: {
//       width: 52,
//       height: 68,
//       borderRadius: 10,
//       backgroundColor: theme.chip,
//     },
//     pagesPreviewMore: {
//       width: 52,
//       height: 68,
//       borderRadius: 10,
//       backgroundColor: theme.chip,
//       justifyContent: "center",
//       alignItems: "center",
//     },
//     pagesPreviewMoreText: {
//       fontSize: 12.5,
//       fontWeight: "700",
//       color: theme.textSecondary,
//     },
//     fieldLabel: {
//       fontSize: 12.5,
//       fontWeight: "700",
//       color: theme.textSecondary,
//       marginBottom: 8,
//       marginTop: 4,
//     },
//     textInput: {
//       backgroundColor: theme.card,
//       borderWidth: 1,
//       borderColor: theme.border,
//       borderRadius: 14,
//       paddingHorizontal: 16,
//       paddingVertical: 13,
//       fontSize: 14,
//       fontWeight: "600",
//       color: theme.textPrimary,
//       marginBottom: 20,
//     },
//     folderGrid: {
//       flexDirection: "row",
//       flexWrap: "wrap",
//       gap: 10,
//       marginBottom: 8,
//     },
//     folderChip: {
//       width: "47%",
//       backgroundColor: theme.card,
//       borderWidth: 1,
//       borderColor: theme.border,
//       borderRadius: 14,
//       paddingHorizontal: 14,
//       paddingVertical: 12,
//     },
//     folderChipSelected: {
//       backgroundColor: theme.emeraldChip,
//       borderColor: theme.emerald,
//     },
//     folderChipName: {
//       fontSize: 13,
//       fontWeight: "700",
//       color: theme.textPrimary,
//       marginBottom: 2,
//     },
//     folderChipNameSelected: {
//       color: theme.emeraldSolid,
//     },
//     folderChipCount: {
//       fontSize: 11,
//       color: theme.textMuted,
//     },
//     folderChipCountSelected: {
//       color: theme.emeraldSolid,
//     },
//     noFoldersText: {
//       fontSize: 12.5,
//       color: theme.textMuted,
//       marginBottom: 8,
//     },
//     errorBanner: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: 8,
//       backgroundColor: theme.dangerChip,
//       borderRadius: 12,
//       paddingHorizontal: 14,
//       paddingVertical: 12,
//       marginTop: 8,
//     },
//     errorBannerText: {
//       flex: 1,
//       fontSize: 12.5,
//       color: theme.danger,
//       fontWeight: "600",
//     },
//     detailsFooter: {
//       paddingHorizontal: 20,
//       paddingTop: 12,
//       paddingBottom: Platform.OS === "ios" ? 30 : 20,
//       borderTopWidth: 1,
//       borderTopColor: theme.divider,
//     },

//     /* SHARED */
//     primaryButton: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "center",
//       gap: 8,
//       backgroundColor: theme.emeraldSolid,
//       paddingVertical: 15,
//       borderRadius: 14,
//     },
//     primaryButtonDisabled: {
//       opacity: 0.45,
//     },
//     primaryButtonText: {
//       color: "#ffffff",
//       fontSize: 14,
//       fontWeight: "700",
//     },
//   });
// }

import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { useTranscribe } from "@/hooks/useTranscribe";
import {
  compressAndEncode,
  MAX_IMAGES_PER_CONVERSION,
} from "@/utils/imageUtils";
import { useAppTheme } from "../contexts/ThemeContext";

// ASSUMPTION: adjust this to whatever your actual preview route is named —
// this is the only place the redirect target is defined.
const PREVIEW_ROUTE = "/documentPreview";

// Polling config for the "timed out but might still finish" case below.
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 20; // ~80s of polling after the request times out

type ConversionType = "imageToWord" | "imageToExcel";

interface CapturedPage {
  id: string;
  uri: string;
}

interface FolderOption {
  id: string;
  name: string;
  documentCount: number;
}

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
    danger: "#ef4444",
    dangerChip: isDark ? "rgba(239,68,68,0.14)" : "#fef2f2",
  };
}

export default function ScanScreen() {
  const { format } = useLocalSearchParams<{ format?: "word" | "excel" }>();
  const { user, folders, documents, refreshUserData } = useAuth();
  const { isDark } = useAppTheme();
  const router = useRouter();
  const transcribeMutation = useTranscribe();

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const conversionType: ConversionType =
    format === "excel" ? "imageToExcel" : "imageToWord";

  const [step, setStep] = useState<"capture" | "details">("capture");
  const [pages, setPages] = useState<CapturedPage[]>([]);
  const [documentName, setDocumentName] = useState(() => {
    const now = new Date();
    const datePart = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    const timePart = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Scan ${datePart} ${timePart}`;
  });
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [status, setStatus] = useState<{
    type: "error" | "info";
    message: string;
  } | null>(null);
  const [polling, setPolling] = useState(false);

  // Tracks the document we're waiting to appear once a request times out
  // but may still be finishing on the server.
  const pendingDocRef = useRef<{ name: string; folder: string } | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptsRef = useRef(0);

  const stopPolling = () => {
    setPolling(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    pendingDocRef.current = null;
    pollAttemptsRef.current = 0;
  };

  const startPolling = (name: string, folder: string) => {
    pendingDocRef.current = { name, folder };
    pollAttemptsRef.current = 0;
    setPolling(true);
    refreshUserData(); // kick off an immediate check, don't wait for the interval

    pollIntervalRef.current = setInterval(() => {
      pollAttemptsRef.current += 1;
      if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling();
        setConverting(false);
        setStatus({
          type: "info",
          message:
            "Still processing. Check Recent Documents in a moment — it should appear there once ready.",
        });
        return;
      }
      refreshUserData();
    }, POLL_INTERVAL_MS);
  };

  // Watches the live documents list while polling; the moment the file
  // we're waiting on shows up, redirect exactly like a normal success.
  useEffect(() => {
    if (!polling || !pendingDocRef.current) return;
    const target = pendingDocRef.current;
    const match = documents.find(
      (doc) => doc.folder === target.folder && doc.title === target.name,
    );
    if (match) {
      stopPolling();
      setConverting(false);
      router.replace({
        pathname: PREVIEW_ROUTE,
        params: { folder: match.folder, fileName: match.title },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, polling]);

  // Don't leave a live interval running if the user backs out of the screen.
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const atLimit = pages.length >= MAX_IMAGES_PER_CONVERSION;

  const addPages = (uris: string[]) => {
    const room = MAX_IMAGES_PER_CONVERSION - pages.length;
    if (room <= 0) return;
    const next = uris.slice(0, room).map((uri) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      uri,
    }));
    setPages((prev) => [...prev, ...next]);
  };

  const handleTakePhoto = async () => {
    if (atLimit) return;
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        // On iOS, a missing NSCameraUsageDescription (set via the
        // expo-image-picker config plugin) makes this resolve to
        // granted: false immediately, with no OS dialog ever shown —
        // if you never see a permission prompt at all, that's the cause.
        Alert.alert(
          "Camera access needed",
          "Enable camera access in Settings to scan a document.",
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.9,
        allowsEditing: true, // native crop before the page is added
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        addPages([result.assets[0].uri]);
      }
    } catch (err) {
      console.error("[scan] camera launch failed:", err);
      Alert.alert(
        "Couldn't open camera",
        "Something went wrong opening the camera. Please try again.",
      );
    }
  };

  const handleChooseFromLibrary = async () => {
    if (atLimit) return;
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Photo access needed",
          "Enable photo library access in Settings to choose an image.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES_PER_CONVERSION - pages.length,
      });
      if (!result.canceled && result.assets?.length) {
        addPages(result.assets.map((asset) => asset.uri));
      }
    } catch (err) {
      console.error("[scan] library picker failed:", err);
      Alert.alert(
        "Couldn't open photo library",
        "Something went wrong opening your photos. Please try again.",
      );
    }
  };

  const removePage = (id: string) => {
    setPages((prev) => prev.filter((page) => page.id !== id));
  };

  const handleConvert = async () => {
    if (!user?.id || !selectedFolder || !documentName.trim()) return;

    setConverting(true);
    setStatus(null);
    stopPolling();

    let base64Images: string[];
    try {
      base64Images = await Promise.all(
        pages.map((page) => compressAndEncode(page.uri)),
      );
    } catch {
      setConverting(false);
      setStatus({
        type: "error",
        message: "Couldn't process one or more images. Please try again.",
      });
      return;
    }

    // Conversion time scales with page count (each page is a real AI
    // call server-side) — give the request enough runway instead of
    // racing a fixed timeout against variable-length work. Capped at
    // 5 minutes so a genuinely dead connection still fails eventually.
    const timeoutMs = Math.min(300000, 45000 + pages.length * 20000);
    const trimmedName = documentName.trim();
    const ext = conversionType === "imageToWord" ? "docx" : "xlsx";

    transcribeMutation.mutate(
      {
        payload: {
          images: base64Images,
          userId: user.id,
          conversionType,
          documentName: trimmedName,
          folder: selectedFolder,
        },
        timeoutMs,
      },
      {
        onSuccess: (data) => {
          setConverting(false);
          router.replace({
            pathname: PREVIEW_ROUTE,
            params: {
              folder: data.document.folder,
              fileName: data.document.name,
            },
          });
        },
        onError: (err: any) => {
          const isTimeout = err?.code === "ECONNABORTED";
          if (isTimeout) {
            // The request gave up, but the backend often keeps working
            // and saves the document anyway — watch for it to appear
            // instead of just telling the user to go check manually.
            setStatus({
              type: "info",
              message:
                "This is taking longer than expected. We'll keep checking and take you there automatically once it's ready.",
            });
            startPolling(`${trimmedName}.${ext}`, selectedFolder);
          } else {
            setConverting(false);
            setStatus({
              type: "error",
              message:
                err?.response?.data?.error ||
                "Conversion failed. Please try again.",
            });
          }
        },
      },
    );
  };

  const canContinue = pages.length > 0;
  const canConvert = !!selectedFolder && documentName.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            step === "details" ? setStep("capture") : router.back()
          }
          hitSlop={10}
          style={styles.headerIconButton}
        >
          <Feather
            name={step === "details" ? "arrow-left" : "x"}
            size={20}
            color={theme.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === "capture" ? "Scan document" : "Name & save"}
        </Text>
        <View style={styles.headerIconButton} />
      </View>

      {step === "capture" ? (
        <CaptureStep
          theme={theme}
          styles={styles}
          pages={pages}
          atLimit={atLimit}
          onTakePhoto={handleTakePhoto}
          onChooseFromLibrary={handleChooseFromLibrary}
          onRemovePage={removePage}
          onContinue={() => setStep("details")}
          canContinue={canContinue}
        />
      ) : (
        <DetailsStep
          theme={theme}
          styles={styles}
          pages={pages}
          documentName={documentName}
          onChangeDocumentName={setDocumentName}
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          converting={converting}
          polling={polling}
          status={status}
          canConvert={canConvert}
          onConvert={handleConvert}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------------------------------------------------------
   STEP 1 — CAPTURE
   Camera-first: "Take photo" is the primary action, library is
   secondary. Supports repeated capture for multi-page notes.
--------------------------------------------------------- */
function CaptureStep({
  theme,
  styles,
  pages,
  atLimit,
  onTakePhoto,
  onChooseFromLibrary,
  onRemovePage,
  onContinue,
  canContinue,
}: {
  theme: ReturnType<typeof getTheme>;
  styles: ReturnType<typeof createStyles>;
  pages: CapturedPage[];
  atLimit: boolean;
  onTakePhoto: () => void;
  onChooseFromLibrary: () => void;
  onRemovePage: (id: string) => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <View style={styles.flexFill}>
      <ScrollView
        contentContainerStyle={styles.captureScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {pages.length === 0 ? (
          <View style={styles.captureEmptyState}>
            <View style={styles.captureEmptyIcon}>
              <Feather name="camera" size={28} color={theme.emerald} />
            </View>
            <Text style={styles.captureEmptyTitle}>Scan your first page</Text>
            <Text style={styles.captureEmptySubtitle}>
              Snap a photo of a handwritten page, or pick existing images from
              your library.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.pageCounterRow}>
              <Text style={styles.pageCounterText}>
                {pages.length} of {MAX_IMAGES_PER_CONVERSION} pages
              </Text>
            </View>
            <View style={styles.pageGrid}>
              {pages.map((page, i) => (
                <View key={page.id} style={styles.pageThumbWrap}>
                  <Image source={{ uri: page.uri }} style={styles.pageThumb} />
                  <View style={styles.pageThumbBadge}>
                    <Text style={styles.pageThumbBadgeText}>{i + 1}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.pageThumbRemove}
                    onPress={() => onRemovePage(page.id)}
                    hitSlop={8}
                  >
                    <Feather name="x" size={12} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.captureFooter}>
        <View style={styles.captureActionRow}>
          <TouchableOpacity
            style={[
              styles.captureActionButton,
              atLimit && styles.disabledButton,
            ]}
            activeOpacity={0.8}
            onPress={onTakePhoto}
            disabled={atLimit}
          >
            <Feather name="camera" size={18} color={theme.emeraldSolid} />
            <Text style={styles.captureActionText}>
              {pages.length === 0 ? "Take photo" : "Add page"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.captureActionButton,
              atLimit && styles.disabledButton,
            ]}
            activeOpacity={0.8}
            onPress={onChooseFromLibrary}
            disabled={atLimit}
          >
            <Feather name="image" size={18} color={theme.emeraldSolid} />
            <Text style={styles.captureActionText}>Choose from library</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !canContinue && styles.primaryButtonDisabled,
          ]}
          activeOpacity={0.85}
          onPress={onContinue}
          disabled={!canContinue}
        >
          <Text style={styles.primaryButtonText}>
            Continue{pages.length > 0 ? ` · ${pages.length}` : ""}
          </Text>
          <Feather name="arrow-right" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------------------------------------------------------
   STEP 2 — DETAILS
   Document name + folder grid, mirrors the web "Convert Image"
   modal's second view. Convert button sends the request.
--------------------------------------------------------- */
function DetailsStep({
  theme,
  styles,
  pages,
  documentName,
  onChangeDocumentName,
  folders,
  selectedFolder,
  onSelectFolder,
  converting,
  polling,
  status,
  canConvert,
  onConvert,
}: {
  theme: ReturnType<typeof getTheme>;
  styles: ReturnType<typeof createStyles>;
  pages: CapturedPage[];
  documentName: string;
  onChangeDocumentName: (value: string) => void;
  folders: FolderOption[];
  selectedFolder: string | null;
  onSelectFolder: (name: string) => void;
  converting: boolean;
  polling: boolean;
  status: { type: "error" | "info"; message: string } | null;
  canConvert: boolean;
  onConvert: () => void;
}) {
  return (
    <View style={styles.flexFill}>
      <ScrollView
        contentContainerStyle={styles.detailsScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pagesPreviewRow}>
          {pages.slice(0, 4).map((page) => (
            <Image
              key={page.id}
              source={{ uri: page.uri }}
              style={styles.pagesPreviewThumb}
            />
          ))}
          {pages.length > 4 && (
            <View style={styles.pagesPreviewMore}>
              <Text style={styles.pagesPreviewMoreText}>
                +{pages.length - 4}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.fieldLabel}>Document name</Text>
        <TextInput
          value={documentName}
          onChangeText={onChangeDocumentName}
          style={styles.textInput}
          placeholder="Document name"
          placeholderTextColor={theme.textMuted}
          editable={!converting}
        />

        <Text style={styles.fieldLabel}>Save to folder</Text>
        {folders.length === 0 ? (
          <Text style={styles.noFoldersText}>
            No folders yet — create one from the Documents tab first.
          </Text>
        ) : (
          <View style={styles.folderGrid}>
            {folders.map((folder) => {
              const isSelected = selectedFolder === folder.name;
              return (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.folderChip,
                    isSelected && styles.folderChipSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => onSelectFolder(folder.name)}
                  disabled={converting}
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
          <View
            style={
              status.type === "info" ? styles.infoBanner : styles.errorBanner
            }
          >
            <Feather
              name={status.type === "info" ? "clock" : "alert-circle"}
              size={16}
              color={status.type === "info" ? theme.emerald : theme.danger}
            />
            <Text
              style={
                status.type === "info"
                  ? styles.infoBannerText
                  : styles.errorBannerText
              }
            >
              {status.message}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.detailsFooter}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!canConvert || converting) && styles.primaryButtonDisabled,
          ]}
          activeOpacity={0.85}
          onPress={onConvert}
          disabled={!canConvert || converting}
        >
          {converting ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.primaryButtonText}>
                {polling ? "Still working…" : "Converting…"}
              </Text>
            </>
          ) : (
            <Text style={styles.primaryButtonText}>
              Convert {pages.length} page{pages.length === 1 ? "" : "s"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof getTheme>) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },
    flexFill: {
      flex: 1,
    },

    /* HEADER */
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

    /* CAPTURE STEP */
    captureScrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    captureEmptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      paddingHorizontal: 16,
    },
    captureEmptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.emeraldChip,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 18,
    },
    captureEmptyTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: theme.textPrimary,
      marginBottom: 8,
    },
    captureEmptySubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 19,
      maxWidth: 260,
    },
    pageCounterRow: {
      marginTop: 8,
      marginBottom: 14,
    },
    pageCounterText: {
      fontSize: 12.5,
      fontWeight: "700",
      color: theme.textSecondary,
    },
    pageGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    pageThumbWrap: {
      width: "31%",
      aspectRatio: 0.75,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: theme.chip,
    },
    pageThumb: {
      width: "100%",
      height: "100%",
    },
    pageThumbBadge: {
      position: "absolute",
      left: 6,
      bottom: 6,
      backgroundColor: "rgba(15,23,42,0.65)",
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    pageThumbBadgeText: {
      fontSize: 10.5,
      fontWeight: "700",
      color: "#ffffff",
    },
    pageThumbRemove: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "rgba(15,23,42,0.65)",
      justifyContent: "center",
      alignItems: "center",
    },
    captureFooter: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === "ios" ? 30 : 20,
      borderTopWidth: 1,
      borderTopColor: theme.divider,
      gap: 12,
    },
    captureActionRow: {
      flexDirection: "row",
      gap: 10,
    },
    captureActionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
      backgroundColor: theme.emeraldChip,
    },
    captureActionText: {
      fontSize: 12.5,
      fontWeight: "700",
      color: theme.emeraldSolid,
    },
    disabledButton: {
      opacity: 0.45,
    },

    /* DETAILS STEP */
    detailsScrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    pagesPreviewRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 6,
      marginBottom: 22,
    },
    pagesPreviewThumb: {
      width: 52,
      height: 68,
      borderRadius: 10,
      backgroundColor: theme.chip,
    },
    pagesPreviewMore: {
      width: 52,
      height: 68,
      borderRadius: 10,
      backgroundColor: theme.chip,
      justifyContent: "center",
      alignItems: "center",
    },
    pagesPreviewMoreText: {
      fontSize: 12.5,
      fontWeight: "700",
      color: theme.textSecondary,
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
    folderChipNameSelected: {
      color: theme.emeraldSolid,
    },
    folderChipCount: {
      fontSize: 11,
      color: theme.textMuted,
    },
    folderChipCountSelected: {
      color: theme.emeraldSolid,
    },
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
    infoBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.emeraldChip,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: 8,
    },
    infoBannerText: {
      flex: 1,
      fontSize: 12.5,
      color: theme.emeraldSolid,
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
    primaryButtonDisabled: {
      opacity: 0.45,
    },
    primaryButtonText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "700",
    },
  });
}
