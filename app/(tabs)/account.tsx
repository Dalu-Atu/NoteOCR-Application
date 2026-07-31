import { useAuth } from "@/contexts/AuthContext";
import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { useProfileActions } from "../../hooks/useProfileAction";

import { useAppTheme } from "@/contexts/ThemeContext";
import { AppTheme, getTheme } from "@/utils/theme";

// "John Doe" -> "JD", "Cher" -> "CH", "" -> "?"
function getInitials(fullName: string | undefined): string {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function AccountScreen() {
  const { isDark } = useAppTheme();
  const { user } = useAuth();
  const {
    updateName: updateNameMutation,
    updateEmail: updateEmailMutation,
    updatePassword: updatePasswordMutation,
  } = useProfileActions();
  const router = useRouter();

  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Prefilled from the real account instead of dummy placeholders.
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [hasPrefilled, setHasPrefilled] = useState(false);

  // If user data arrives after this screen has already mounted (e.g. a
  // cold app start), seed the fields once it's available. Guarded by
  // hasPrefilled so it never overwrites something the person is
  // actively typing.
  useEffect(() => {
    if (user && !hasPrefilled) {
      setName(user.name);
      setEmail(user.email);
      setHasPrefilled(true);
    }
  }, [user, hasPrefilled]);

  // Password required to confirm a name/email change — kept separate
  // from the "Change Password" card's fields below, since they're two
  // different actions.
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const passwordsMismatch =
    newPassword.length > 0 &&
    confirmNewPassword.length > 0 &&
    newPassword !== confirmNewPassword;

  const nameChanged = name.trim() !== (user?.name ?? "");
  const emailChanged = email.trim() !== (user?.email ?? "");
  const profileChanged = nameChanged || emailChanged;

  const canSaveProfile =
    profileChanged &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    confirmPassword.length > 0 &&
    !updateNameMutation.isPending &&
    !updateEmailMutation.isPending;

  const canUpdatePassword =
    !!currentPassword &&
    !!newPassword &&
    !passwordsMismatch &&
    !updatePasswordMutation.isPending;

  async function handleSaveProfile() {
    if (!canSaveProfile) return;
    setProfileError(null);

    try {
      // Both endpoints take the same currentPassword — call whichever
      // field(s) actually changed, sequentially, so a failure on one
      // (e.g. email already in use) doesn't silently swallow whether the
      // other one succeeded.
      if (nameChanged) {
        await updateNameMutation.mutateAsync({
          newName: name.trim(),
          currentPassword: confirmPassword,
        });
      }
      if (emailChanged) {
        await updateEmailMutation.mutateAsync({
          newEmail: email.trim(),
          currentPassword: confirmPassword,
        });
      }
      setConfirmPassword("");
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      if (status === 401 || status === 403) {
        setProfileError(message ?? "That password isn't correct.");
      } else if (status === 409) {
        setProfileError(message ?? "That email is already in use.");
      } else {
        setProfileError(
          message ??
            "Something went wrong saving your changes. Please try again.",
        );
      }
    }
  }

  function handleUpdatePassword() {
    if (!canUpdatePassword) return;
    setPasswordError(null);

    updatePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
        },
        onError: (err: any) => {
          const status = err?.response?.status;
          const message = err?.response?.data?.message;
          if (status === 401 || status === 403) {
            setPasswordError(message ?? "Your current password isn't correct.");
          } else {
            setPasswordError(
              message ??
                "Something went wrong updating your password. Please try again.",
            );
          }
        },
      },
    );
  }

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
          {/* Initials avatar — no photo, just the person's initials */}
          <View style={styles.avatarSection}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: hexToRgba(
                    theme.emeraldSolid,
                    isDark ? 0.22 : 0.12,
                  ),
                  borderColor: theme.emerald,
                },
              ]}
            >
              <Text
                style={[styles.avatarInitials, { color: theme.emeraldSolid }]}
              >
                {getInitials(user?.name)}
              </Text>
            </View>
          </View>

          {/* Profile info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Profile Info</Text>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (profileError) setProfileError(null);
              }}
              placeholder="Your name"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (profileError) setProfileError(null);
              }}
              placeholder="you@example.com"
              placeholderTextColor={theme.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Only appears once something's actually changed — asking
                for a password up front when nothing's being edited
                would just be friction for no reason. */}
            {profileChanged && (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                  Enter Your Password to Confirm
                </Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (profileError) setProfileError(null);
                  }}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry
                />
                <View style={styles.hintRow}>
                  <Feather name="lock" size={11.5} color={theme.textMuted} />
                  <Text style={styles.hintText}>
                    Required to change your name or email
                  </Text>
                </View>
              </>
            )}

            {profileError && (
              <Text style={styles.errorText}>{profileError}</Text>
            )}

            <TouchableOpacity
              style={[styles.saveButton, !canSaveProfile && { opacity: 0.5 }]}
              activeOpacity={0.85}
              disabled={!canSaveProfile}
              onPress={handleSaveProfile}
            >
              {updateNameMutation.isPending || updateEmailMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Password */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Change Password</Text>

            <Text style={styles.fieldLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={''}
              onChangeText={(text) => {
                setCurrentPassword(text);
                if (passwordError) setPasswordError(null);
              }}
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
              onChangeText={(text) => {
                setNewPassword(text);
                if (passwordError) setPasswordError(null);
              }}
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
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
            />
            {passwordsMismatch && (
              <Text style={styles.errorText}>Passwords don't match</Text>
            )}
            {passwordError && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.saveButton,
                !canUpdatePassword && { opacity: 0.5 },
              ]}
              activeOpacity={0.85}
              disabled={!canUpdatePassword}
              onPress={handleUpdatePassword}
            >
              {updatePasswordMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>Update Password</Text>
              )}
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
    avatarCircle: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitials: {
      fontSize: 26,
      fontWeight: "800",
      letterSpacing: 0.5,
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
    hintRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 6,
    },
    hintText: {
      fontSize: 11,
      color: theme.textMuted,
    },
    errorText: {
      fontSize: 11.5,
      color: theme.danger,
      marginTop: 8,
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
