import React from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FoldersScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Folders</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20 },
  title: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
});
