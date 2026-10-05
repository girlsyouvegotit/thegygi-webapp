import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CreditCard,
  Key,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserPlus,
} from "lucide-react";

export interface ActivityTypeConfig {
  icon: LucideIcon;
  label: string;
  filterKey: string;
  /** Pastel card surface (calendar-event style) */
  cardBg: string;
  cardBorder: string;
  accent: string;
  iconBg: string;
  iconColor: string;
}

export const ACTIVITY_FILTERS = [
  { value: "all", label: "All activity" },
  { value: "creation", label: "Created" },
  { value: "update", label: "Updated" },
  { value: "deletion", label: "Deleted" },
  { value: "authentication", label: "Authentication" },
  { value: "assignment", label: "Assignments" },
  { value: "finance", label: "Finance" },
  { value: "moderation", label: "Moderation" },
] as const;

export const getActivityConfig = (action: string): ActivityTypeConfig => {
  const lower = action.toLowerCase();

  if (
    lower.includes("delete") ||
    lower.includes("remove") ||
    lower.includes("drop")
  ) {
    return {
      icon: Trash2,
      label: "Deleted",
      filterKey: "deletion",
      cardBg: "bg-[#FDE8EF]",
      cardBorder: "border-[#F9C2D4]",
      accent: "bg-[#F472B6]",
      iconBg: "bg-white/70",
      iconColor: "text-rose-600",
    };
  }

  if (
    lower.includes("login") ||
    lower.includes("logout") ||
    lower.includes("sign")
  ) {
    return {
      icon: Key,
      label: "Auth",
      filterKey: "authentication",
      cardBg: "bg-[#E8F3F1]",
      cardBorder: "border-[#B7D9D2]",
      accent: "bg-[#0F766E]",
      iconBg: "bg-white/70",
      iconColor: "text-teal-700",
    };
  }

  if (
    lower.includes("enroll") ||
    lower.includes("assign") ||
    lower.includes("mentor")
  ) {
    return {
      icon: UserPlus,
      label: "Assign",
      filterKey: "assignment",
      cardBg: "bg-[#E0F2FE]",
      cardBorder: "border-[#BAE6FD]",
      accent: "bg-[#38BDF8]",
      iconBg: "bg-white/70",
      iconColor: "text-sky-700",
    };
  }

  if (
    lower.includes("create") ||
    lower.includes("add") ||
    lower.includes("schedule") ||
    lower.includes("upload") ||
    lower.includes("record")
  ) {
    return {
      icon: Plus,
      label: "Created",
      filterKey: "creation",
      cardBg: "bg-[#E8EEFB]",
      cardBorder: "border-[#C7D4F5]",
      accent: "bg-[#6366F1]",
      iconBg: "bg-white/70",
      iconColor: "text-indigo-600",
    };
  }

  if (
    lower.includes("update") ||
    lower.includes("edit") ||
    lower.includes("change") ||
    lower.includes("reschedule")
  ) {
    return {
      icon: Pencil,
      label: "Updated",
      filterKey: "update",
      cardBg: "bg-[#FFE8D6]",
      cardBorder: "border-[#FDC9A5]",
      accent: "bg-[#FB923C]",
      iconBg: "bg-white/70",
      iconColor: "text-orange-700",
    };
  }

  if (
    lower.includes("suspend") ||
    lower.includes("activate") ||
    lower.includes("ban") ||
    lower.includes("role")
  ) {
    return {
      icon: Shield,
      label: "Moderation",
      filterKey: "moderation",
      cardBg: "bg-[#F3E8FF]",
      cardBorder: "border-[#E9D5FF]",
      accent: "bg-[#A78BFA]",
      iconBg: "bg-white/70",
      iconColor: "text-violet-700",
    };
  }

  if (
    lower.includes("fee") ||
    lower.includes("payment") ||
    lower.includes("salary") ||
    lower.includes("expense")
  ) {
    return {
      icon: CreditCard,
      label: "Finance",
      filterKey: "finance",
      cardBg: "bg-[#FEF3C7]",
      cardBorder: "border-[#FDE68A]",
      accent: "bg-[#F59E0B]",
      iconBg: "bg-white/70",
      iconColor: "text-amber-700",
    };
  }

  return {
    icon: Activity,
    label: "Activity",
    filterKey: "all",
    cardBg: "bg-[#ECFDF5]",
    cardBorder: "border-[#A7F3D0]",
    accent: "bg-[#34D399]",
    iconBg: "bg-white/70",
    iconColor: "text-emerald-700",
  };
};

export const getInitials = (name?: string): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const matchesActivityFilter = (
  action: string,
  filter: string,
): boolean => {
  if (!filter || filter === "all") return true;
  return getActivityConfig(action).filterKey === filter;
};
