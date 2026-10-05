import type { CSSProperties } from "react";

export type DashboardTheme = {
  id: string;
  name: string;
  description: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  accent: string;
  ring: string;
  sidebarPrimary: string;
  sidebarAccent: string;
  border: string;
  chart1: string;
  chart2: string;
  swatch: string;
};

type ThemeSeed = {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent?: string;
  border?: string;
  chart2?: string;
  primaryForeground?: string;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const n = Number.parseInt(clean, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mixWithWhite(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.round(rgb.r + (255 - rgb.r) * amount);
  const g = Math.round(rgb.g + (255 - rgb.g) * amount);
  const b = Math.round(rgb.b + (255 - rgb.b) * amount);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function buildTheme(seed: ThemeSeed): DashboardTheme {
  const secondary = seed.secondary;
  const accent = seed.accent || secondary;
  const border = seed.border || mixWithWhite(seed.primary, 0.72);
  return {
    id: seed.id,
    name: seed.name,
    description: seed.description,
    primary: seed.primary,
    primaryForeground: seed.primaryForeground || "#ffffff",
    secondary,
    accent,
    ring: seed.primary,
    sidebarPrimary: seed.primary,
    sidebarAccent: secondary,
    border,
    chart1: seed.primary,
    chart2: seed.chart2 || mixWithWhite(seed.primary, 0.25),
    swatch: `linear-gradient(135deg, ${seed.primary}, ${mixWithWhite(seed.primary, 0.35)})`,
  };
}

/** Exactly 15 Apple-inspired / aesthetic dashboard accents */
const SEEDS: ThemeSeed[] = [
  {
    id: "gygi-purple",
    name: "GYGI Purple",
    description: "Signature GYGI brand accent",
    primary: "#C147E9",
    secondary: "#E5B8F4",
    chart2: "#A91CC0",
  },
  {
    id: "ultramarine",
    name: "Ultramarine",
    description: "Deep system blue",
    primary: "#2F6BFF",
    secondary: "#C7D7FF",
    chart2: "#1D4ED8",
  },
  {
    id: "soft-sky",
    name: "Soft Sky",
    description: "Light airy blue",
    primary: "#0EA5E9",
    secondary: "#BAE6FD",
    chart2: "#0284C7",
  },
  {
    id: "teal",
    name: "Teal",
    description: "Calm clinical teal",
    primary: "#0F766E",
    secondary: "#99F6E4",
    chart2: "#115E59",
  },
  {
    id: "mint",
    name: "Mint",
    description: "Fresh mint green",
    primary: "#10B981",
    secondary: "#A7F3D0",
    chart2: "#059669",
  },
  {
    id: "green",
    name: "Green",
    description: "Classic leaf green",
    primary: "#22C55E",
    secondary: "#BBF7D0",
    chart2: "#16A34A",
  },
  {
    id: "yellow",
    name: "Yellow",
    description: "Warm sunshine yellow",
    primary: "#EAB308",
    secondary: "#FEF08A",
    primaryForeground: "#1C1917",
    chart2: "#CA8A04",
  },
  {
    id: "orange",
    name: "Orange",
    description: "Vibrant citrus orange",
    primary: "#F97316",
    secondary: "#FED7AA",
    chart2: "#EA580C",
  },
  {
    id: "coral-rose",
    name: "Coral Rose",
    description: "Soft coral accent",
    primary: "#F43F5E",
    secondary: "#FECDD3",
    chart2: "#E11D48",
  },
  {
    id: "red",
    name: "Red",
    description: "Bold apple red",
    primary: "#EF4444",
    secondary: "#FECACA",
    chart2: "#DC2626",
  },
  {
    id: "pink",
    name: "Pink",
    description: "Playful system pink",
    primary: "#EC4899",
    secondary: "#FBCFE8",
    chart2: "#DB2777",
  },
  {
    id: "indigo",
    name: "Indigo",
    description: "Deep indigo violet",
    primary: "#6366F1",
    secondary: "#C7D2FE",
    chart2: "#4F46E5",
  },
  {
    id: "graphite",
    name: "Graphite",
    description: "Neutral charcoal accent",
    primary: "#3F3F46",
    secondary: "#E4E4E7",
    chart2: "#52525B",
  },
  {
    id: "slate-blue",
    name: "Slate Blue",
    description: "Muted slate blue",
    primary: "#64748B",
    secondary: "#E2E8F0",
    chart2: "#475569",
  },
  {
    id: "copper",
    name: "Copper",
    description: "Warm sand copper",
    primary: "#B45309",
    secondary: "#FDE68A",
    chart2: "#92400E",
  },
];

export const DASHBOARD_THEMES: DashboardTheme[] = SEEDS.map(buildTheme);

export const DASHBOARD_THEME_IDS = DASHBOARD_THEMES.map((t) => t.id);

export const DEFAULT_DASHBOARD_THEME_ID = "gygi-purple";

export function getDashboardTheme(id?: string | null): DashboardTheme {
  return (
    DASHBOARD_THEMES.find((t) => t.id === id) ||
    DASHBOARD_THEMES.find((t) => t.id === DEFAULT_DASHBOARD_THEME_ID)!
  );
}

export function dashboardThemeCssVars(theme: DashboardTheme): CSSProperties {
  // Only set accent tokens. Borders / secondary surfaces stay mode-aware
  // via :root / .dark (and .dark [data-dashboard-theme] remaps).
  return {
    ["--primary" as string]: theme.primary,
    ["--primary-foreground" as string]: theme.primaryForeground,
    ["--ring" as string]: theme.ring,
    ["--sidebar-primary" as string]: theme.sidebarPrimary,
    ["--sidebar-primary-foreground" as string]: theme.primaryForeground,
    ["--sidebar-ring" as string]: theme.ring,
    ["--chart-1" as string]: theme.chart1,
    ["--chart-2" as string]: theme.chart2,
    // Light-mode soft tints (overridden in dark by CSS)
    ["--secondary" as string]: theme.secondary,
    ["--accent" as string]: theme.accent,
    ["--sidebar-accent" as string]: theme.sidebarAccent,
  };
}
