import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DocumentItem } from "../data/mockDocuments";
import { getFileVisual } from "../utils/fileVisuals";

export interface DocumentCardTheme {
  card: string;
  border: string;
  text: string;
  textMuted: string;
}

interface DocumentCardProps {
  doc: DocumentItem;
  theme: DocumentCardTheme;
  onPress: () => void;
  onMorePress: () => void;
}

export function DocumentCard({
  doc,
  theme,
  onPress,
  onMorePress,
}: DocumentCardProps) {
  const visual = getFileVisual(doc.title);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.docCard,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
      onPress={onPress}
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
          {doc.title}
        </Text>
        <Text style={[styles.docMeta, { color: theme.textMuted }]}>
          {doc.date} • {doc.folder} • {doc.size}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.moreButton}
        onPress={onMorePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="more-vertical" size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
