import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  // Defaults to following the OS. Note: this resets to "system" on every
  // app restart — there's no persistence yet. Add
  // @react-native-async-storage/async-storage and read/write themeMode
  // through it if you want the choice to survive a relaunch.
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  const isDark =
    themeMode === "system" ? systemScheme === "dark" : themeMode === "dark";

  const value = useMemo(
    () => ({ themeMode, setThemeMode, isDark }),
    [themeMode, isDark],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return ctx;
}
