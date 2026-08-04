import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import "react-native-reanimated";

import NetInfo from "@react-native-community/netinfo"; // npx expo install @react-native-community/netinfo
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { PostHogProvider } from "posthog-react-native";

import { AuthProvider } from "../contexts/AuthContext";
import {
  ThemeProvider as AppThemeProvider,
  useAppTheme,
} from "../contexts/ThemeContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // avoid duplicate fetches within 5s of each other
      retry: 2,
    },
  },
});

// RN has no browser "window focus" event — this wires app foreground/
// background to React Query's focus manager, so refetchOnWindowFocus-style
// behavior actually works when someone backgrounds and reopens the app.
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

// Lets React Query pause retries while offline and auto-resume/refetch
// the moment connectivity comes back.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <PostHogProvider
      apiKey="phc_wX9M5SRG3D8DsMjPHumE3j7aqbecKWbHr9PscGBF9oRf"
      options={{
        host: "https://us.i.posthog.com",
        captureScreens: true,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </PostHogProvider>
  );
}

function RootLayoutNav() {
  const { isDark } = useAppTheme();

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </NavigationThemeProvider>
  );
}
