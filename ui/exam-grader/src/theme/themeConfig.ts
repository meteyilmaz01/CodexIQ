import { useAppStore } from "../store/useAppStore";

export type ThemeColors = {
  pageBg: string;
  sidebarBg: string;
  headerBg: string;
  cardBg: string;
  loginWrapperBg: string;
  loginLeftBg: string;
  loginRightBg: string;
  containerBg: string;
  inputBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;
  textDimmed: string;
  textCode: string;
  textHint: string;
  borderPrimary: string;
  borderSubtle: string;
  borderInput: string;
  borderContainer: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentSubtle: string;
  accentBorderSolid: string;
  dividerColor: string;
  listItemBorder: string;
  listItemHoverBg: string;
  tooltipBg: string;
  drawerBg: string;
  drawerMask: string;
  messageSentBg: string;
  messageSentBorder: string;
  messageReceivedBg: string;
  messageReceivedBorder: string;
  draggerBg: string;
  draggerBorder: string;
  errorHighlightBg: string;
  logoText: string;
  adminBadgeBg: string;
  adminBadgeColor: string;
};

const darkTheme: ThemeColors = {
  // Backgrounds
  pageBg: "#0a0e17",
  sidebarBg: "linear-gradient(180deg, #091420 0%, #0c1a2e 100%)",
  headerBg: "rgba(9,20,32,0.8)",
  cardBg: "rgba(255,255,255,0.03)",
  loginWrapperBg: "linear-gradient(135deg, #0a0e17 0%, #0d1520 40%, #0a1628 100%)",
  loginLeftBg: "linear-gradient(160deg, #091420 0%, #0c1a2e 50%, #071018 100%)",
  loginRightBg: "rgba(10,16,26,0.6)",
  containerBg: "rgba(255,255,255,0.02)",
  inputBg: "rgba(255,255,255,0.04)",

  // Text
  textPrimary: "#f0f0f0",
  textSecondary: "#e0e0e0",
  textMuted: "#6a7a90",
  textSubtle: "#8a9ab5",
  textDimmed: "#555",
  textCode: "#e0e0e0",
  textHint: "#b0c4de",

  // Borders
  borderPrimary: "1px solid rgba(0,255,255,0.08)",
  borderSubtle: "1px solid rgba(255,255,255,0.06)",
  borderInput: "1px solid rgba(255,255,255,0.1)",
  borderContainer: "1px solid rgba(255,255,255,0.06)",

  // Accent
  accent: "#0ff",
  accentBg: "rgba(0,255,255,0.15)",
  accentBorder: "rgba(0,255,255,0.15)",
  accentSubtle: "rgba(0,255,255,0.06)",
  accentBorderSolid: "rgba(0,255,255,0.12)",

  // Components
  dividerColor: "rgba(255,255,255,0.06)",
  listItemBorder: "1px solid rgba(255,255,255,0.04)",
  listItemHoverBg: "rgba(0,255,255,0.06)",
  tooltipBg: "rgba(0,255,255,0.05)",

  // Drawer
  drawerBg: "linear-gradient(180deg, #091420 0%, #0c1a2e 100%)",
  drawerMask: "rgba(0,0,0,0.6)",

  // Messages
  messageSentBg: "linear-gradient(135deg, rgba(0,184,212,0.2), rgba(0,229,255,0.15))",
  messageSentBorder: "rgba(0,255,255,0.15)",
  messageReceivedBg: "rgba(255,255,255,0.06)",
  messageReceivedBorder: "rgba(255,255,255,0.06)",

  // Upload/Dragger
  draggerBg: "rgba(0,255,255,0.03)",
  draggerBorder: "2px dashed rgba(0,255,255,0.15)",

  // Error highlight
  errorHighlightBg: "rgba(255,77,79,0.08)",

  // Logo
  logoText: "#f0f0f0",

  // Admin badge
  adminBadgeBg: "rgba(255,77,79,0.2)",
  adminBadgeColor: "#ff4d4f",
};

const lightTheme: ThemeColors = {
  // Backgrounds
  pageBg: "#f5f7fa",
  sidebarBg: "linear-gradient(180deg, #ffffff 0%, #f0f4f8 100%)",
  headerBg: "rgba(255,255,255,0.92)",
  cardBg: "#ffffff",
  loginWrapperBg: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 40%, #f0f4f8 100%)",
  loginLeftBg: "linear-gradient(160deg, #1a3a5c 0%, #1e4976 50%, #0d2840 100%)",
  loginRightBg: "#ffffff",
  containerBg: "rgba(255,255,255,0.95)",
  inputBg: "rgba(0,0,0,0.02)",

  // Text
  textPrimary: "#1a1a2e",
  textSecondary: "#2d3748",
  textMuted: "#718096",
  textSubtle: "#4a5568",
  textDimmed: "#a0aec0",
  textCode: "#2d3748",
  textHint: "#4a5568",

  // Borders
  borderPrimary: "1px solid rgba(0,100,150,0.12)",
  borderSubtle: "1px solid rgba(0,0,0,0.06)",
  borderInput: "1px solid rgba(0,0,0,0.12)",
  borderContainer: "1px solid rgba(0,0,0,0.08)",

  // Accent
  accent: "#0891b2",
  accentBg: "rgba(8,145,178,0.1)",
  accentBorder: "rgba(8,145,178,0.2)",
  accentSubtle: "rgba(8,145,178,0.05)",
  accentBorderSolid: "rgba(8,145,178,0.15)",

  // Components
  dividerColor: "rgba(0,0,0,0.06)",
  listItemBorder: "1px solid rgba(0,0,0,0.06)",
  listItemHoverBg: "rgba(8,145,178,0.06)",
  tooltipBg: "rgba(8,145,178,0.05)",

  // Drawer
  drawerBg: "linear-gradient(180deg, #ffffff 0%, #f0f4f8 100%)",
  drawerMask: "rgba(0,0,0,0.25)",

  // Messages
  messageSentBg: "linear-gradient(135deg, rgba(8,145,178,0.12), rgba(6,182,212,0.08))",
  messageSentBorder: "rgba(8,145,178,0.2)",
  messageReceivedBg: "rgba(0,0,0,0.03)",
  messageReceivedBorder: "rgba(0,0,0,0.06)",

  // Upload/Dragger
  draggerBg: "rgba(8,145,178,0.03)",
  draggerBorder: "2px dashed rgba(8,145,178,0.2)",

  // Error highlight
  errorHighlightBg: "rgba(255,77,79,0.06)",

  // Logo - login panelinde koyu arkaplan kullanıldığı için beyaz kalacak
  logoText: "#1a1a2e",

  // Admin badge
  adminBadgeBg: "rgba(255,77,79,0.1)",
  adminBadgeColor: "#ff4d4f",
};

export const themeColors: Record<"dark" | "light", ThemeColors> = {
  dark: darkTheme,
  light: lightTheme,
};

export const useThemeColors = (): ThemeColors => {
  const theme = useAppStore((s) => s.theme);
  return themeColors[theme];
};

