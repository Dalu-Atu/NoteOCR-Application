// Shared color tokens for the whole app. Import this instead of redefining
// getTheme() per-screen — index.tsx currently has its own inline copy;
// worth migrating that to import from here too so the two never drift.

export function getTheme(isDark: boolean) {
  return {
    isDark,
    bg: isDark ? "#0f172a" : "#f8fafc",
    card: isDark ? "#1e293b" : "#ffffff",
    chip: isDark ? "#0f172a" : "#f8fafc",
    border: isDark ? "#334155" : "#f1f5f9",
    divider: isDark ? "#334155" : "#f1f5f9",
    textPrimary: isDark ? "#f8fafc" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    textMuted: isDark ? "#64748b" : "#94a3b8",
    iconMuted: isDark ? "#cbd5e1" : "#334155",
    emerald: "#10b981",
    emeraldSolid: "#059669",
    emeraldChip: isDark ? "rgba(16,185,129,0.14)" : "#ecfdf5",
    amberChip: isDark ? "rgba(245,158,11,0.14)" : "#fffbeb",
    amber: "#f59e0b",
    ripple: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
    // New tokens needed for the More/Settings screen
    danger: "#ef4444",
    dangerChip: isDark ? "rgba(239,68,68,0.14)" : "#fef2f2",

    sheetHandle: isDark ? "#475569" : "#e2e8f0",
    overlay: "rgba(15,23,42,0.55)",
  };
}

export type AppTheme = ReturnType<typeof getTheme>;
