import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
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
import { DocumentItem, MOCK_DOCUMENTS } from "../../data/mockDocuments";
import { getFileVisual, parseSizeToMB } from "../../utils/fileVisuals";
import { useAuth } from "@/contexts/AuthContext";

const FILTERS = ["All", "Word", "Excel", "PDF"] as const;

const SORT_OPTIONS = [
  { key: "recent", label: "Most Recent", icon: "clock" as const },
  { key: "name", label: "Name (A–Z)", icon: "type" as const },
  { key: "size", label: "File Size", icon: "hard-drive" as const },
];

type SortKey = "recent" | "name" | "size";

export default function DocumentsScreen() {
    const { documents: docs } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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

  // Arriving from the Folders screen with a different folder param (while
  // this screen is already mounted) should update the active filter.
  useEffect(() => {
    if (params.folder) setFolderFilter(params.folder);
  }, [params.folder]);

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

  const handleDelete = () => {
    if (!activeDoc) return;
    setDocuments((prev) => prev.filter((d) => d.id !== activeDoc.id));
    setActiveDoc(null);
  };

  const handleStub = (label: string) => {
    setActiveDoc(null);
    Alert.alert(label, "This action isn't wired up yet — coming soon.");
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

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

        {/* Filter Pills */}
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
          <View style={[styles.actionSheet, { backgroundColor: theme.card }]}>
            <Text
              style={[styles.actionSheetTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {activeDoc?.title}
            </Text>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => handleStub("Rename")}
            >
              <Feather name="edit-2" size={18} color={theme.text} />
              <Text style={[styles.actionRowText, { color: theme.text }]}>
                Rename
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => handleStub("Move to Folder")}
            >
              <Feather name="folder" size={18} color={theme.text} />
              <Text style={[styles.actionRowText, { color: theme.text }]}>
                Move to Folder
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => handleStub("Share")}
            >
              <Feather name="share-2" size={18} color={theme.text} />
              <Text style={[styles.actionRowText, { color: theme.text }]}>
                Share
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
              <Feather name="trash-2" size={18} color="#dc2626" />
              <Text style={[styles.actionRowText, { color: "#dc2626" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    alignItems: "flex-start",
    paddingVertical: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  folderFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  folderFilterText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  sortButton: {
    padding: 6,
  },
  sortMenu: {
    position: "absolute",
    top: 40,
    right: 0,
    width: 190,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    zIndex: 30,
    shadowColor: "#000",
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
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
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  iconTile: {
    width: 46,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  docMeta: {
    fontSize: 12,
  },
  moreButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  actionSheetTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
  },
  actionRowText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
