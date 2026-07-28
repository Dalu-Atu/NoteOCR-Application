import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
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

;

import { useAppTheme } from "@/contexts/ThemeContext";
import { AppTheme, getTheme } from "@/utils/theme";

export default function AccountScreen() {
  const { isDark } = useAppTheme();
  const router = useRouter();

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Local form state — not yet wired to a real backend/auth call.
  const [name, setName] = useState("Joe Doe");
  const [email, setEmail] = useState("joe@example.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordsMismatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword !== confirmPassword;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Hide the default native header — we build our own below to match
          the rest of the app instead of the system default back bar */}
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Custom header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar with change-photo affordance */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
                }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.cameraBadge} activeOpacity={0.8}>
                <Feather name="camera" size={13} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Profile Info</Text>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.saveButton} activeOpacity={0.85}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>

          {/* Password */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Change Password</Text>

            <Text style={styles.fieldLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
            />

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
              New Password
            </Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
            />

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
              Confirm New Password
            </Text>
            <TextInput
              style={[
                styles.input,
                passwordsMismatch && { borderColor: theme.danger },
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
            />
            {passwordsMismatch && (
              <Text style={styles.errorText}>Passwords don't match</Text>
            )}

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!currentPassword || !newPassword || passwordsMismatch) && {
                  opacity: 0.5,
                },
              ]}
              activeOpacity={0.85}
              disabled={!currentPassword || !newPassword || passwordsMismatch}
            >
              <Text style={styles.saveButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    backButton: {
      width: 34,
      height: 34,
      justifyContent: "center",
      alignItems: "flex-start",
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.textPrimary,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 50,
    },
    avatarSection: {
      alignItems: "center",
      marginBottom: 20,
    },
    avatarWrap: {
      position: "relative",
    },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 2,
      borderColor: theme.emerald,
    },
    cameraBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.emeraldSolid,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.bg,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 18,
      marginBottom: 16,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 12,
      elevation: theme.isDark ? 0 : 2,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: theme.textPrimary,
      marginBottom: 14,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 6,
    },
    input: {
      backgroundColor: theme.chip,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 13.5,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    errorText: {
      fontSize: 11.5,
      color: theme.danger,
      marginTop: 6,
    },
    saveButton: {
      backgroundColor: theme.emeraldSolid,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: "center",
      marginTop: 18,
    },
    saveButtonText: {
      color: "#ffffff",
      fontSize: 13.5,
      fontWeight: "700",
    },
  });
}
