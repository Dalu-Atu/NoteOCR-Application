import { WebView } from "react-native-webview";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { SafeAreaView, StatusBar, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "@/contexts/ThemeContext";

export default function DocumentEditorScreen() {
  const { folder, fileName } = useLocalSearchParams<{
    folder: string;
    fileName: string;
  }>();
  const { token } = useAuth();
  const router = useRouter();
  const { isDark } = useAppTheme();
  console.log("folder:", folder, "fileName:", fileName, "token:", token);

  const url = `https://app.noteocr.com/app-editor/${encodeURIComponent(
    folder,
  )}/${encodeURIComponent(fileName)}?authToken=${encodeURIComponent(token ?? "")}`;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <WebView
        source={{ uri: url }}
        userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
}
