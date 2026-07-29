import { Feather, Ionicons } from "@expo/vector-icons";
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

import { useAuth } from "../contexts/AuthContext";
import { useAppTheme } from "../contexts/ThemeContext";
import { AppTheme, getTheme } from "../utils/theme";

type Mode = "login" | "signup";

export default function AuthScreen() {
  const { isDark } = useAppTheme();
  // Ensure your AuthContext provides these exact functions
  const { login, signup, loginWithGoogle } = useAuth();
  const router = useRouter();
  const theme = useMemo(() => getTheme(isDark), [isDark]);
  const styles = useMemo(() => createStyles(theme), [theme]);
  // View state
  const [mode, setMode] = useState<Mode>("login");
  const isSignup = mode === "signup";
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Validates form inputs based on the current mode
   */
  function validate(): string | null {
    if (isSignup && name.trim().length === 0)
      return "Please enter your full name.";
    if (!email.includes("@") || email.length < 5)
      return "Please enter a valid email address.";
    if (password.length < 6)
      return "Password must be at least 6 characters long.";
    return null;
  }

  /**
   * Handles email/password form submission
   */
  async function handleSubmit() {
    console.log("authenticating...");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      if (isSignup) {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
      // Assuming context handles success and redirect; adjust as needed
      router.replace("/(tabs)");
    } catch (e: any) {
      const message =
        e.response?.data?.message ||
        "Authentication failed. Please check your credentials and Network connection.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Handles Google Sign-In
   */
  async function handleGoogle() {
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      await loginWithGoogle();
      // Assuming context handles success and redirect
      router.replace("/(tabs)");
    } catch (e) {
      setError("Google sign-in was not successful.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  /**
   * Toggles between Login and Signup modes
   */
  function toggleMode() {
    setMode(isSignup ? "login" : "signup");
    setError(null);
    // Optional: clear password/name on toggle
    setName("");
    setPassword("");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header - Centered Logo Only, no Hamburger */}
          <View style={styles.appHeader}>
            <Image
              source={
                isDark
                  ? require("../assets/images/logo-white.png") // Update path if needed
                  : require("../assets/images/logo-dark.png") // Update path if needed
              }
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>NoteOCR</Text>
          </View>

          {/* Centered Main Title section */}
          <View style={styles.centeredTitleSection}>
            <Text style={styles.welcomeTitle}>
              {isSignup ? "Create account" : "Welcome back"}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {isSignup
                ? "Sign up to start converting documents."
                : "Sign in to access your workspace."}
            </Text>
          </View>

          {/* Main Action Button - Google (now primary) */}
          <TouchableOpacity
            style={[
              styles.primaryGoogleBtn,
              isGoogleSubmitting && { opacity: 0.7 },
            ]}
            onPress={handleGoogle}
            disabled={isGoogleSubmitting}
            activeOpacity={0.8}
          >
            <Ionicons
              name="logo-google"
              size={18}
              color={theme.textPrimary}
              style={{ marginRight: 10 }}
            />
            <Text style={styles.primaryGoogleBtnText}>
              {isGoogleSubmitting ? "Connecting…" : "Continue with Google"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or continue with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form fields with proper labels and interaction styles */}
          <View style={styles.formContainer}>
            {isSignup && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View
                  style={[
                    styles.inputBox,
                    focusedInput === "name" && styles.inputBoxFocused,
                  ]}
                >
                  <TextInput
                    style={styles.inputField}
                    value={name}
                    onChangeText={setName}
                    placeholder="Joe Biden"
                    placeholderTextColor={theme.textMuted}
                    editable={!isSubmitting}
                    onFocus={() => setFocusedInput("name")}
                    onBlur={() => setFocusedInput(null)}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View
                style={[
                  styles.inputBox,
                  focusedInput === "email" && styles.inputBoxFocused,
                ]}
              >
                <TextInput
                  style={styles.inputField}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="joe@gmail.com"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSubmitting}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.fieldLabel}>Password</Text>
                {!isSignup && (
                  <TouchableOpacity
                    style={styles.forgotLink}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View
                style={[
                  styles.inputBox,
                  focusedInput === "password" && styles.inputBoxFocused,
                ]}
              >
                <TextInput
                  style={styles.inputField}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  editable={!isSubmitting}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={18}
                    color={
                      focusedInput === "password"
                        ? theme.emerald
                        : theme.textSecondary
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error message */}
            {error && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color={theme.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Submit Button - Your Emerald Color with Right Arrow */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: theme.emerald },
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting
                  ? "Please wait…"
                  : isSignup
                    ? "Create Account"
                    : "Sign In"}
              </Text>
              <Feather
                name="arrow-right"
                size={16}
                color="#ffffff"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </View>

          {/* Mode Toggle Footer - Text Based as requested */}
          <View style={styles.footerToggleContainer}>
            <Text style={styles.footerToggleText}>
              {isSignup ? "Already have an account?" : "Don't have an account?"}
            </Text>
            <TouchableOpacity
              onPress={toggleMode}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.footerToggleActionText}>
                {isSignup ? "Log In" : "Create one"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  // Using theme colors throughout (e.g., emerald for active/focus states, chip/border for backgrounds)
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 40,
    },

    appHeader: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      marginBottom: 60,
      // Pushing slightly higher for aesthetic balance
      transform: [{ translateY: -12 }],
    },
    logoImage: {
      width: 28,
      height: 28,
      marginRight: 10,
    },
    brandTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },

    /* Centered Title Section from design */
    centeredTitleSection: {
      marginBottom: 36,
      alignItems: "center",
      // Centering is crucial to match the reference
    },
    welcomeTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: theme.textPrimary,
      marginBottom: 10,
      letterSpacing: -0.5,
      textAlign: "center",
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      lineHeight: 24,
      textAlign: "center",
      paddingHorizontal: 16,
    },

    /* Primary Google Button (Now at the top) */
    primaryGoogleBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.bg,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 12,
      height: 52,
      marginBottom: 28,
      // Soft shadow for elevation
      shadowColor: theme.textPrimary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    primaryGoogleBtnText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.textPrimary,
    },

    /* Divider */
    divider: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 28,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    dividerLabel: {
      fontSize: 14,
      color: theme.textMuted,
      fontWeight: "500",
      textAlign: "center",
    },

    /* Form and Fields */
    formContainer: {
      marginBottom: 32,
    },
    fieldGroup: {
      marginBottom: 20,
    },
    passwordLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textPrimary,
      marginBottom: 8,
    },
    inputBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.chip, // Using your chip color as field bg
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 56,
      borderWidth: 1.5,
      borderColor: theme.border, // No border by default
      shadowColor: theme.textPrimary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 0,
    },
    inputBoxFocused: {
      borderColor: theme.emerald, // Active state uses emerald
      backgroundColor: theme.bg, // Optional: change bg on focus
      // Focused shadow
      shadowColor: theme.emerald,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    inputField: {
      flex: 1,
      fontSize: 16,
      color: theme.textPrimary,
      height: "100%", // Ensures full touch area
    },

    forgotLink: {
      marginBottom: 4,
    },
    forgotText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.emerald,
    },

    /* Error box */
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: `${theme.danger}15`, // 15% opacity of danger color
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 24,
    },
    errorText: {
      fontSize: 14,
      color: theme.danger,
      fontWeight: "600",
      flex: 1,
    },

    /* Submit Button (Emerald + Arrow) */
    submitBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      height: 56,
      marginTop: 20,
      // Shadow matching emerald
      shadowColor: theme.emerald,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    submitBtnText: {
      color: "#ffffff",
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: 0.3,
    },

    /* Bottom Text Toggle Link */
    footerToggleContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      marginTop: "auto", // Pushes to bottom if the screen is tall
    },
    footerToggleText: {
      fontSize: 15,
      color: theme.textSecondary,
    },
    footerToggleActionText: {
      fontSize: 15,
      color: theme.emerald,
      fontWeight: "700",
    },
  });
}
