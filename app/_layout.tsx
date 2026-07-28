import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import {
  DefaultTheme,
  DarkTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import {
  ThemeProvider as AppThemeProvider,
  useAppTheme,
} from "../contexts/ThemeContext";
import { AuthProvider } from "../contexts/AuthContext";

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

  if (!loaded) {
    return null;
  }

  // AuthProvider nested inside AppThemeProvider — order between these two
  // doesn't matter functionally since neither depends on the other, but
  // AuthProvider needs to sit above the (tabs) guard that will read it.
  return (
    <AppThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </AppThemeProvider>
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
