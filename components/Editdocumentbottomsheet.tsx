import { Feather } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export type EditDocumentMode = "upload" | "blank";

export default function EditDocumentBottomSheet({
  visible,
  theme,
  styles,
  onClose,
  onSelect,
}: {
  visible: boolean;
  theme: any;
  styles: any;
  onClose: () => void;
  onSelect: (mode: EditDocumentMode) => void;
}) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Holds the mode the user tapped, so we can fire onSelect only once the
  // *native* modal has actually finished dismissing (iOS refuses to present
  // a new modal — like the document picker — while one is still animating
  // out, which is why "Upload existing document" silently failed to open
  // the file explorer).
  const pendingModeRef = useRef<EditDocumentMode | null>(null);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Runs the JS slide-down/backdrop-fade animation, then closes the Modal's
  // `visible` prop. It does NOT call onSelect directly — that's handled by
  // onModalDismiss below, once the native dismissal is confirmed complete.
  const animateOut = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      after?.();
    });
  };

  const handleClose = () => {
    pendingModeRef.current = null;
    animateOut();
  };

  const handleSelect = (mode: EditDocumentMode) => {
    pendingModeRef.current = mode;
    animateOut();
  };

  // iOS: fires once the native modal view controller has fully finished
  // dismissing — the correct moment to safely present another native
  // surface (like the document picker) without it silently no-op'ing.
  // Android's Modal doesn't reliably fire onDismiss, so we fall back to
  // firing right after animateOut's JS callback there instead, since
  // Android doesn't share iOS's "one modal transition at a time" rule.
  const handleModalDismiss = () => {
    const mode = pendingModeRef.current;
    pendingModeRef.current = null;
    if (mode) onSelect(mode);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onShow={animateIn}
      onRequestClose={handleClose}
      onDismiss={Platform.OS === "ios" ? handleModalDismiss : undefined}
    >
      <Animated.View
        style={[styles.sheetOverlay, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={[styles.sheetContainer, { transform: [{ translateY }] }]}
      >
        <View style={styles.sheetHandle} />

        <Text style={styles.sheetTitle}>Edit document</Text>
        <Text style={styles.sheetSubtitle}>
          Upload a file to edit, or start from a blank document
        </Text>

        <TouchableOpacity
          style={styles.sheetOption}
          activeOpacity={0.7}
          onPress={() => handleSelect("upload")}
        >
          <View
            style={[
              styles.sheetOptionIcon,
              { backgroundColor: theme.amberChip },
            ]}
          >
            <Feather name="upload" size={20} color={theme.amber} />
          </View>
          <View style={styles.sheetOptionText}>
            <Text style={styles.sheetOptionTitle}>
              Upload existing document
            </Text>
            <Text style={styles.sheetOptionSubtitle}>
              Choose a file from your device to edit
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sheetOption}
          activeOpacity={0.7}
          onPress={() => handleSelect("blank")}
        >
          <View
            style={[
              styles.sheetOptionIcon,
              { backgroundColor: theme.emeraldChip },
            ]}
          >
            <Feather name="file-plus" size={20} color={theme.emerald} />
          </View>
          <View style={styles.sheetOptionText}>
            <Text style={styles.sheetOptionTitle}>Create blank document</Text>
            <Text style={styles.sheetOptionSubtitle}>
              Start fresh with Word, Excel, or PDF
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sheetCancel}
          activeOpacity={0.7}
          onPress={handleClose}
        >
          <Text style={styles.sheetCancelText}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}
