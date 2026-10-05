/**
 * Calendar of celebratory occasions shown as sticky dashboard toasts.
 * Ranges use month/day (1-indexed). Multi-day windows are inclusive.
 * Lunar holidays include explicit year overrides where dates shift.
 */

export type Occasion = {
  id: string;
  title: string;
  message: string;
  emoji: string;
  /** Inclusive start month (1-12) */
  startMonth: number;
  startDay: number;
  /** Inclusive end month/day (defaults to start) */
  endMonth?: number;
  endDay?: number;
  /** Optional year-specific windows for lunar / movable holidays */
  yearOverrides?: Record<
    number,
    { startMonth: number; startDay: number; endMonth: number; endDay: number }
  >;
  accent: string;
  accentSoft: string;
};

export const OCCASIONS: Occasion[] = [
  {
    id: "new-year",
    title: "Happy New Year!",
    message:
      "A fresh chapter on GYGI — set bold learning goals and lift someone with you this year.",
    emoji: "🎆",
    startMonth: 1,
    startDay: 1,
    endMonth: 1,
    endDay: 3,
    accent: "#c147e9",
    accentSoft: "#F3E8FF",
  },
  {
    id: "valentines",
    title: "Happy Valentine’s Day!",
    message:
      "Share the love of learning — encourage a classmate or mentee today.",
    emoji: "💜",
    startMonth: 2,
    startDay: 14,
    endMonth: 2,
    endDay: 14,
    accent: "#EC4899",
    accentSoft: "#FCE7F3",
  },
  {
    id: "womens-day",
    title: "Happy International Women’s Day!",
    message:
      "Celebrating every girl and young woman growing with GYGI. You’ve got it!",
    emoji: "🌸",
    startMonth: 3,
    startDay: 8,
    endMonth: 3,
    endDay: 8,
    accent: "#c147e9",
    accentSoft: "#FDF2F8",
  },
  {
    id: "eid-fitr",
    title: "Eid Mubarak!",
    message:
      "Warm Eid greetings from the GYGI family — may your season be peaceful and full of growth.",
    emoji: "🌙",
    startMonth: 3,
    startDay: 30,
    endMonth: 3,
    endDay: 31,
    yearOverrides: {
      2025: { startMonth: 3, startDay: 30, endMonth: 3, endDay: 31 },
      2026: { startMonth: 3, startDay: 19, endMonth: 3, endDay: 21 },
      2027: { startMonth: 3, startDay: 9, endMonth: 3, endDay: 11 },
    },
    accent: "#059669",
    accentSoft: "#ECFDF5",
  },
  {
    id: "eid-adha",
    title: "Eid al-Adha Mubarak!",
    message:
      "Wishing you a blessed Eid filled with kindness, community, and renewed purpose.",
    emoji: "🕌",
    startMonth: 6,
    startDay: 6,
    endMonth: 6,
    endDay: 7,
    yearOverrides: {
      2025: { startMonth: 6, startDay: 6, endMonth: 6, endDay: 7 },
      2026: { startMonth: 5, startDay: 26, endMonth: 5, endDay: 28 },
      2027: { startMonth: 5, startDay: 16, endMonth: 5, endDay: 18 },
    },
    accent: "#0D9488",
    accentSoft: "#F0FDFA",
  },
  {
    id: "africa-day",
    title: "Happy Africa Day!",
    message:
      "Celebrating African excellence, creativity, and the learners shaping our future with GYGI.",
    emoji: "🌍",
    startMonth: 5,
    startDay: 25,
    endMonth: 5,
    endDay: 25,
    accent: "#F59E0B",
    accentSoft: "#FFFBEB",
  },
  {
    id: "youth-day",
    title: "Happy International Youth Day!",
    message:
      "Here’s to curious minds and bold builders — keep showing up for your goals.",
    emoji: "⚡",
    startMonth: 8,
    startDay: 12,
    endMonth: 8,
    endDay: 12,
    accent: "#6366F1",
    accentSoft: "#EEF2FF",
  },
  {
    id: "teachers-day",
    title: "Happy World Teachers’ Day!",
    message:
      "Thank you to every tutor and mentor lighting the path for GYGI learners.",
    emoji: "📚",
    startMonth: 10,
    startDay: 4,
    endMonth: 10,
    endDay: 6,
    accent: "#8B5CF6",
    accentSoft: "#F5F3FF",
  },
  {
    id: "christmas",
    title: "Merry Christmas!",
    message:
      "Joy, rest, and warm wishes from GYGI — may your season sparkle with hope and kindness.",
    emoji: "🎄",
    startMonth: 12,
    startDay: 24,
    endMonth: 12,
    endDay: 26,
    accent: "#DC2626",
    accentSoft: "#FEF2F2",
  },
  {
    id: "boxing-day",
    title: "Happy Boxing Day!",
    message:
      "A gentle day to recharge — your next learning win is waiting when you’re ready.",
    emoji: "🎁",
    startMonth: 12,
    startDay: 26,
    endMonth: 12,
    endDay: 26,
    accent: "#c147e9",
    accentSoft: "#F3E8FF",
  },
];

function toOrdinal(month: number, day: number) {
  return month * 100 + day;
}

function windowForYear(occasion: Occasion, year: number) {
  const override = occasion.yearOverrides?.[year];
  if (override) return override;
  return {
    startMonth: occasion.startMonth,
    startDay: occasion.startDay,
    endMonth: occasion.endMonth ?? occasion.startMonth,
    endDay: occasion.endDay ?? occasion.startDay,
  };
}

export function getActiveOccasion(now = new Date()): Occasion | null {
  const year = now.getFullYear();
  const today = toOrdinal(now.getMonth() + 1, now.getDate());

  for (const occasion of OCCASIONS) {
    const win = windowForYear(occasion, year);
    const start = toOrdinal(win.startMonth, win.startDay);
    const end = toOrdinal(win.endMonth, win.endDay);
    if (today >= start && today <= end) return occasion;
  }
  return null;
}

export function occasionDismissKey(occasion: Occasion, year?: number) {
  const y = year ?? new Date().getFullYear();
  return `gygi:occasion-dismissed:${occasion.id}:${y}`;
}

export function isOccasionDismissed(occasion: Occasion): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(occasionDismissKey(occasion)) === "1";
  } catch {
    return false;
  }
}

export function dismissOccasion(occasion: Occasion) {
  try {
    localStorage.setItem(occasionDismissKey(occasion), "1");
  } catch {
    /* ignore quota / private mode */
  }
}
