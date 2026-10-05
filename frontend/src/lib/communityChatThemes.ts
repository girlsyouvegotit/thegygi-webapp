import type { CSSProperties } from "react";

export type CommunityChatTheme = {
  id: string;
  name: string;
  header: string;
  headerText: string;
  accent: string;
  accentHover: string;
  bubbleMine: string;
  bubbleMineText: string;
  bubbleTheirs: string;
  bubbleTheirsText: string;
  channelActive: string;
  channelActiveText: string;
  panel: string;
  chatWash: string;
  swatch: string;
};

type ThemeSeed = {
  id: string;
  name: string;
  header: string;
  accent: string;
  accentHover: string;
  bubbleMine: string;
  bubbleMineText?: string;
  chatWash: string;
  panel?: string;
  channelActive?: string;
  dark?: boolean;
};

function buildTheme(seed: ThemeSeed): CommunityChatTheme {
  const dark = Boolean(seed.dark);
  return {
    id: seed.id,
    name: seed.name,
    header: seed.header,
    headerText: "#ffffff",
    accent: seed.accent,
    accentHover: seed.accentHover,
    bubbleMine: seed.bubbleMine,
    bubbleMineText: seed.bubbleMineText || (dark ? "#F8FAFC" : "#1C1C21"),
    bubbleTheirs: dark ? "#1F1F24" : "#ffffff",
    bubbleTheirsText: dark ? "#F8FAFC" : "#1C1C21",
    channelActive: seed.channelActive || seed.bubbleMine,
    channelActiveText: seed.bubbleMineText || (dark ? "#F8FAFC" : "#1C1C21"),
    panel: seed.panel || (dark ? "#141418" : "#F7F6FA"),
    chatWash: seed.chatWash,
    swatch: `linear-gradient(135deg,${seed.accent},${seed.header})`,
  };
}

const SEEDS: ThemeSeed[] = [
  // GYGI default
  {
    id: "gygi",
    name: "GYGI Classic",
    header: "#2D2D44",
    accent: "#c147e9",
    accentHover: "#b03fd4",
    bubbleMine: "#F3E8FF",
    chatWash: "#F3F2F8",
    panel: "#F7F6FA",
  },
  // Core colors requested
  {
    id: "yellow",
    name: "Yellow",
    header: "#854D0E",
    accent: "#EAB308",
    accentHover: "#CA8A04",
    bubbleMine: "#FEF9C3",
    chatWash: "#FEFCE8",
  },
  {
    id: "red",
    name: "Red",
    header: "#7F1D1D",
    accent: "#EF4444",
    accentHover: "#DC2626",
    bubbleMine: "#FEE2E2",
    chatWash: "#FEF2F2",
  },
  {
    id: "black",
    name: "Black",
    header: "#0A0A0A",
    accent: "#525252",
    accentHover: "#404040",
    bubbleMine: "#262626",
    bubbleMineText: "#FAFAFA",
    chatWash: "#111111",
    panel: "#171717",
    dark: true,
  },
  {
    id: "green",
    name: "Green",
    header: "#14532D",
    accent: "#22C55E",
    accentHover: "#16A34A",
    bubbleMine: "#DCFCE7",
    chatWash: "#F0FDF4",
  },
  {
    id: "blue",
    name: "Blue",
    header: "#1E3A8A",
    accent: "#3B82F6",
    accentHover: "#2563EB",
    bubbleMine: "#DBEAFE",
    chatWash: "#EFF6FF",
  },
  // 20+ additional colors
  {
    id: "orange",
    name: "Orange",
    header: "#7C2D12",
    accent: "#F97316",
    accentHover: "#EA580C",
    bubbleMine: "#FFEDD5",
    chatWash: "#FFF7ED",
  },
  {
    id: "pink",
    name: "Pink",
    header: "#831843",
    accent: "#EC4899",
    accentHover: "#DB2777",
    bubbleMine: "#FCE7F3",
    chatWash: "#FDF2F8",
  },
  {
    id: "teal",
    name: "Teal",
    header: "#134E4A",
    accent: "#14B8A6",
    accentHover: "#0D9488",
    bubbleMine: "#CCFBF1",
    chatWash: "#F0FDFA",
  },
  {
    id: "cyan",
    name: "Cyan",
    header: "#164E63",
    accent: "#06B6D4",
    accentHover: "#0891B2",
    bubbleMine: "#CFFAFE",
    chatWash: "#ECFEFF",
  },
  {
    id: "lime",
    name: "Lime",
    header: "#365314",
    accent: "#84CC16",
    accentHover: "#65A30D",
    bubbleMine: "#ECFCCB",
    chatWash: "#F7FEE7",
  },
  {
    id: "brown",
    name: "Brown",
    header: "#431407",
    accent: "#A16207",
    accentHover: "#854D0E",
    bubbleMine: "#FEF3C7",
    chatWash: "#FFFBEB",
  },
  {
    id: "navy",
    name: "Navy",
    header: "#0F172A",
    accent: "#1D4ED8",
    accentHover: "#1E40AF",
    bubbleMine: "#DBEAFE",
    chatWash: "#E2E8F0",
  },
  {
    id: "gold",
    name: "Gold",
    header: "#713F12",
    accent: "#F59E0B",
    accentHover: "#D97706",
    bubbleMine: "#FEF3C7",
    chatWash: "#FFFBEB",
  },
  {
    id: "silver",
    name: "Silver",
    header: "#334155",
    accent: "#94A3B8",
    accentHover: "#64748B",
    bubbleMine: "#E2E8F0",
    chatWash: "#F1F5F9",
  },
  {
    id: "crimson",
    name: "Crimson",
    header: "#4C0519",
    accent: "#E11D48",
    accentHover: "#BE123C",
    bubbleMine: "#FFE4E6",
    chatWash: "#FFF1F2",
  },
  {
    id: "forest",
    name: "Forest",
    header: "#052E16",
    accent: "#15803D",
    accentHover: "#166534",
    bubbleMine: "#BBF7D0",
    chatWash: "#ECFDF5",
  },
  {
    id: "sky",
    name: "Sky",
    header: "#0C4A6E",
    accent: "#38BDF8",
    accentHover: "#0EA5E9",
    bubbleMine: "#E0F2FE",
    chatWash: "#F0F9FF",
  },
  {
    id: "lavender",
    name: "Lavender",
    header: "#4C1D95",
    accent: "#A78BFA",
    accentHover: "#8B5CF6",
    bubbleMine: "#EDE9FE",
    chatWash: "#F5F3FF",
  },
  {
    id: "mint",
    name: "Mint",
    header: "#064E3B",
    accent: "#34D399",
    accentHover: "#10B981",
    bubbleMine: "#D1FAE5",
    chatWash: "#ECFDF5",
  },
  {
    id: "burgundy",
    name: "Burgundy",
    header: "#4C0519",
    accent: "#9F1239",
    accentHover: "#881337",
    bubbleMine: "#FFE4E6",
    chatWash: "#FFF1F2",
  },
  {
    id: "charcoal",
    name: "Charcoal",
    header: "#18181B",
    accent: "#71717A",
    accentHover: "#52525B",
    bubbleMine: "#27272A",
    bubbleMineText: "#FAFAFA",
    chatWash: "#09090B",
    panel: "#18181B",
    dark: true,
  },
  {
    id: "peach",
    name: "Peach",
    header: "#9A3412",
    accent: "#FB923C",
    accentHover: "#F97316",
    bubbleMine: "#FFEDD5",
    chatWash: "#FFF7ED",
  },
  {
    id: "grape",
    name: "Grape",
    header: "#3B0764",
    accent: "#A855F7",
    accentHover: "#9333EA",
    bubbleMine: "#F3E8FF",
    chatWash: "#FAF5FF",
  },
  {
    id: "ocean",
    name: "Ocean",
    header: "#164E63",
    accent: "#0891B2",
    accentHover: "#0E7490",
    bubbleMine: "#CFFAFE",
    chatWash: "#ECFEFF",
  },
  {
    id: "sunset",
    name: "Sunset",
    header: "#7C2D12",
    accent: "#F43F5E",
    accentHover: "#E11D48",
    bubbleMine: "#FFE4E6",
    chatWash: "#FFF1F2",
  },
  {
    id: "indigo",
    name: "Indigo",
    header: "#1E1B4B",
    accent: "#6366F1",
    accentHover: "#4F46E5",
    bubbleMine: "#E0E7FF",
    chatWash: "#EEF2FF",
  },
  {
    id: "magenta",
    name: "Magenta",
    header: "#701A75",
    accent: "#D946EF",
    accentHover: "#C026D3",
    bubbleMine: "#FAE8FF",
    chatWash: "#FDF4FF",
  },
  {
    id: "olive",
    name: "Olive",
    header: "#365314",
    accent: "#65A30D",
    accentHover: "#4D7C0F",
    bubbleMine: "#ECFCCB",
    chatWash: "#F7FEE7",
  },
  {
    id: "slate",
    name: "Slate",
    header: "#1E293B",
    accent: "#64748B",
    accentHover: "#475569",
    bubbleMine: "#E2E8F0",
    chatWash: "#F8FAFC",
  },
  {
    id: "rose",
    name: "Rose",
    header: "#881337",
    accent: "#FB7185",
    accentHover: "#F43F5E",
    bubbleMine: "#FFE4E6",
    chatWash: "#FFF1F2",
  },
  {
    id: "emerald",
    name: "Emerald",
    header: "#064E3B",
    accent: "#10B981",
    accentHover: "#059669",
    bubbleMine: "#A7F3D0",
    chatWash: "#ECFDF5",
  },
  {
    id: "violet",
    name: "Violet",
    header: "#2E1065",
    accent: "#8B5CF6",
    accentHover: "#7C3AED",
    bubbleMine: "#DDD6FE",
    chatWash: "#F5F3FF",
  },
  {
    id: "amber",
    name: "Amber",
    header: "#78350F",
    accent: "#FBBF24",
    accentHover: "#F59E0B",
    bubbleMine: "#FEF3C7",
    chatWash: "#FFFBEB",
  },
  {
    id: "white",
    name: "White",
    header: "#E5E7EB",
    accent: "#c147e9",
    accentHover: "#b03fd4",
    bubbleMine: "#F3E8FF",
    bubbleMineText: "#2D2D44",
    chatWash: "#FFFFFF",
    panel: "#F9FAFB",
    channelActive: "#F3E8FF",
  },
];

export const COMMUNITY_CHAT_THEMES: CommunityChatTheme[] = SEEDS.map(buildTheme);

export const COMMUNITY_CHAT_THEME_IDS = COMMUNITY_CHAT_THEMES.map((t) => t.id);

export type CommunityChatThemeId = (typeof COMMUNITY_CHAT_THEME_IDS)[number];

export function getCommunityChatTheme(id?: string | null): CommunityChatTheme {
  return (
    COMMUNITY_CHAT_THEMES.find((t) => t.id === id) || COMMUNITY_CHAT_THEMES[0]
  );
}

export function themeCssVars(theme: CommunityChatTheme): CSSProperties {
  return {
    ["--chat-header" as string]: theme.header,
    ["--chat-header-text" as string]: theme.headerText,
    ["--chat-accent" as string]: theme.accent,
    ["--chat-accent-hover" as string]: theme.accentHover,
    ["--chat-bubble-mine" as string]: theme.bubbleMine,
    ["--chat-bubble-mine-text" as string]: theme.bubbleMineText,
    ["--chat-bubble-theirs" as string]: theme.bubbleTheirs,
    ["--chat-bubble-theirs-text" as string]: theme.bubbleTheirsText,
    ["--chat-channel-active" as string]: theme.channelActive,
    ["--chat-channel-active-text" as string]: theme.channelActiveText,
    ["--chat-panel" as string]: theme.panel,
    ["--chat-wash" as string]: theme.chatWash,
  };
}
