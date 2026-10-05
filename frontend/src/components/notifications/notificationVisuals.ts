import type { NotificationType } from "@/types";
import {
  Video,
  CalendarClock,
  Ban,
  Radio,
  PlayCircle,
  FileQuestion,
  Trophy,
  FileText,
  AlarmClock,
  CheckCircle2,
  HeartHandshake,
  Calendar,
  MessageSquare,
  Target,
  AtSign,
  Megaphone,
  Banknote,
  Shield,
  ShieldAlert,
  HandHeart,
  type LucideIcon,
} from "lucide-react";

export type NotificationVisual = {
  icon: LucideIcon;
  label: string;
  /** Soft card / row background tint */
  surface: string;
  /** Accent bar / icon chip */
  accent: string;
  iconChip: string;
  /** Unread border/glow hint */
  unreadRing: string;
};

const DEFAULT_VISUAL: NotificationVisual = {
  icon: Megaphone,
  label: "Update",
  surface: "bg-primary/5",
  accent: "bg-primary",
  iconChip: "bg-primary/15 text-primary",
  unreadRing: "ring-primary/25",
};

export const NOTIFICATION_VISUALS: Record<NotificationType, NotificationVisual> =
  {
    class_scheduled: {
      icon: Video,
      label: "Class",
      surface: "bg-violet-50",
      accent: "bg-violet-500",
      iconChip: "bg-violet-100 text-violet-700",
      unreadRing: "ring-violet-200",
    },
    class_rescheduled: {
      icon: CalendarClock,
      label: "Rescheduled",
      surface: "bg-amber-50",
      accent: "bg-amber-500",
      iconChip: "bg-amber-100 text-amber-700",
      unreadRing: "ring-amber-200",
    },
    class_cancelled: {
      icon: Ban,
      label: "Cancelled",
      surface: "bg-rose-50",
      accent: "bg-rose-500",
      iconChip: "bg-rose-100 text-rose-700",
      unreadRing: "ring-rose-200",
    },
    class_starting: {
      icon: Radio,
      label: "Starting soon",
      surface: "bg-fuchsia-50",
      accent: "bg-fuchsia-500",
      iconChip: "bg-fuchsia-100 text-fuchsia-700",
      unreadRing: "ring-fuchsia-200",
    },
    recording_available: {
      icon: PlayCircle,
      label: "Recording",
      surface: "bg-indigo-50",
      accent: "bg-indigo-500",
      iconChip: "bg-indigo-100 text-indigo-700",
      unreadRing: "ring-indigo-200",
    },
    quiz_available: {
      icon: FileQuestion,
      label: "Quiz",
      surface: "bg-sky-50",
      accent: "bg-sky-500",
      iconChip: "bg-sky-100 text-sky-700",
      unreadRing: "ring-sky-200",
    },
    quiz_result: {
      icon: Trophy,
      label: "Result",
      surface: "bg-emerald-50",
      accent: "bg-emerald-500",
      iconChip: "bg-emerald-100 text-emerald-700",
      unreadRing: "ring-emerald-200",
    },
    assignment_created: {
      icon: FileText,
      label: "Assignment",
      surface: "bg-primary/5",
      accent: "bg-primary",
      iconChip: "bg-primary/15 text-primary",
      unreadRing: "ring-primary/25",
    },
    assignment_due: {
      icon: AlarmClock,
      label: "Due soon",
      surface: "bg-orange-50",
      accent: "bg-orange-500",
      iconChip: "bg-orange-100 text-orange-700",
      unreadRing: "ring-orange-200",
    },
    assignment_graded: {
      icon: CheckCircle2,
      label: "Graded",
      surface: "bg-teal-50",
      accent: "bg-teal-500",
      iconChip: "bg-teal-100 text-teal-700",
      unreadRing: "ring-teal-200",
    },
    mentor_assigned: {
      icon: HeartHandshake,
      label: "Mentor",
      surface: "bg-pink-50",
      accent: "bg-pink-500",
      iconChip: "bg-pink-100 text-pink-700",
      unreadRing: "ring-pink-200",
    },
    session_scheduled: {
      icon: Calendar,
      label: "Session",
      surface: "bg-violet-50",
      accent: "bg-violet-500",
      iconChip: "bg-violet-100 text-violet-700",
      unreadRing: "ring-violet-200",
    },
    session_reminder: {
      icon: AlarmClock,
      label: "Reminder",
      surface: "bg-amber-50",
      accent: "bg-amber-500",
      iconChip: "bg-amber-100 text-amber-700",
      unreadRing: "ring-amber-200",
    },
    mentor_feedback: {
      icon: MessageSquare,
      label: "Feedback",
      surface: "bg-primary/5",
      accent: "bg-primary",
      iconChip: "bg-primary/15 text-primary",
      unreadRing: "ring-primary/25",
    },
    goal_updated: {
      icon: Target,
      label: "Goal",
      surface: "bg-lime-50",
      accent: "bg-lime-600",
      iconChip: "bg-lime-100 text-lime-700",
      unreadRing: "ring-lime-200",
    },
    community_mention: {
      icon: AtSign,
      label: "Mention",
      surface: "bg-cyan-50",
      accent: "bg-cyan-500",
      iconChip: "bg-cyan-100 text-cyan-700",
      unreadRing: "ring-cyan-200",
    },
    announcement: {
      icon: Megaphone,
      label: "Announcement",
      surface: "bg-slate-100",
      accent: "bg-slate-700",
      iconChip: "bg-slate-200 text-slate-700",
      unreadRing: "ring-slate-200",
    },
    moderation_message: {
      icon: Shield,
      label: "Official",
      surface: "bg-violet-50",
      accent: "bg-[#2D2D44]",
      iconChip: "bg-[#2D2D44]/10 text-[#2D2D44]",
      unreadRing: "ring-violet-200",
    },
    moderation_warning: {
      icon: ShieldAlert,
      label: "Warning",
      surface: "bg-amber-50",
      accent: "bg-amber-500",
      iconChip: "bg-amber-100 text-amber-700",
      unreadRing: "ring-amber-200",
    },
    account_suspended: {
      icon: Ban,
      label: "Suspended",
      surface: "bg-orange-50",
      accent: "bg-orange-500",
      iconChip: "bg-orange-100 text-orange-700",
      unreadRing: "ring-orange-200",
    },
    account_banned: {
      icon: Ban,
      label: "Banned",
      surface: "bg-red-50",
      accent: "bg-red-500",
      iconChip: "bg-red-100 text-red-700",
      unreadRing: "ring-red-200",
    },
    salary_paid: {
      icon: Banknote,
      label: "Salary paid",
      surface: "bg-emerald-50",
      accent: "bg-emerald-500",
      iconChip: "bg-emerald-100 text-emerald-700",
      unreadRing: "ring-emerald-200",
    },
    get_involved_inquiry: {
      icon: HandHeart,
      label: "Get Involved",
      surface: "bg-fuchsia-50",
      accent: "bg-fuchsia-500",
      iconChip: "bg-fuchsia-100 text-fuchsia-700",
      unreadRing: "ring-fuchsia-200",
    },
  };

export function getNotificationVisual(
  type: NotificationType | string,
): NotificationVisual {
  return (
    NOTIFICATION_VISUALS[type as NotificationType] || DEFAULT_VISUAL
  );
}
