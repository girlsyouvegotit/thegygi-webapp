import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Banknote,
  BookOpen,
  FolderTree,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  MessageCircle,
  PlayCircle,
  Radio,
  Settings,
  Settings2,
  Shield,
  TrendingUp,
  Users,
  Workflow,
  CircleUser,
  HardDrive,
  Scale,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  Cpu,
  ArrowLeftRight,
} from "lucide-react";

export type SaNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export type SaNavGroup = {
  label: string;
  items: SaNavItem[];
};

/** Super-admin native modules */
export const SA_COMMAND_NAV: SaNavGroup[] = [
  {
    label: "Command",
    items: [
      { title: "Command Center", url: "/super-admin/dashboard", icon: LayoutDashboard },
      { title: "Growth", url: "/super-admin/growth", icon: TrendingUp },
      { title: "Live Ops", url: "/super-admin/live-ops", icon: Radio },
    ],
  },
  {
    label: "People & trust",
    items: [
      { title: "Admins", url: "/super-admin/admins", icon: Shield },
      { title: "People", url: "/super-admin/people", icon: Users },
      { title: "Moderation", url: "/super-admin/moderation", icon: ShieldAlert },
      { title: "Trust & Safety", url: "/super-admin/trust", icon: Scale },
      { title: "Security", url: "/super-admin/security", icon: Activity },
      { title: "Support", url: "/super-admin/support", icon: LifeBuoy },
    ],
  },
  {
    label: "Money & work",
    items: [
      { title: "Finance", url: "/super-admin/finance", icon: Banknote },
      { title: "Mentorship", url: "/super-admin/mentorship", icon: HeartHandshake },
      { title: "Workforce", url: "/super-admin/workforce", icon: Workflow },
    ],
  },
  {
    label: "Learning ops",
    items: [
      { title: "Academics", url: "/super-admin/academics", icon: BookOpen },
      { title: "Content", url: "/super-admin/content", icon: HardDrive },
      { title: "Comms", url: "/super-admin/comms", icon: Megaphone },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Org Controls", url: "/super-admin/org", icon: Settings2 },
      { title: "System", url: "/super-admin/system", icon: Cpu },
    ],
  },
];

/** Full admin portal feature set, kept inside Super Admin shell */
export const SA_ADMIN_OPS_NAV: SaNavItem[] = [
  { title: "Admin Dashboard", url: "/super-admin/ops/dashboard", icon: LayoutDashboard },
  { title: "Categories", url: "/super-admin/ops/categories", icon: FolderTree },
  { title: "Users (Admin)", url: "/super-admin/ops/users", icon: Users },
  { title: "Mentorship Assign", url: "/super-admin/ops/mentorship", icon: HeartHandshake },
  { title: "Recordings", url: "/super-admin/ops/recordings", icon: PlayCircle },
  { title: "Analytics", url: "/super-admin/ops/analytics", icon: TrendingUp },
  {
    title: "Student Performance",
    url: "/super-admin/ops/student-performance",
    icon: GraduationCap,
  },
  { title: "Finance (Admin)", url: "/super-admin/ops/finance", icon: Banknote },
  {
    title: "Testimonials",
    url: "/super-admin/ops/testimonials",
    icon: MessageCircle,
  },
  {
    title: "Alumni Ops",
    url: "/super-admin/ops/alumni-ops",
    icon: Briefcase,
  },
  {
    title: "Category Changes",
    url: "/super-admin/ops/category-changes",
    icon: ArrowLeftRight,
  },
  { title: "Activity Logs", url: "/super-admin/ops/activity-logs", icon: Activity },
  { title: "Settings", url: "/super-admin/ops/settings", icon: Settings },
  { title: "Profile", url: "/super-admin/ops/profile", icon: CircleUser },
];

export const SUPER_ADMIN_FEATURE_CATALOG: Array<{
  id: string;
  title: string;
  hub: string;
}> = [
  { id: "F01", title: "CSV people export", hub: "People" },
  { id: "F02", title: "Bulk activate / deactivate", hub: "People" },
  { id: "F03", title: "Bulk role change", hub: "People" },
  { id: "F04", title: "Force password reset", hub: "People" },
  { id: "F05", title: "Soft-delete / restore accounts", hub: "People" },
  { id: "F06", title: "Unlock locked accounts", hub: "People" },
  { id: "F07", title: "Override 30-day photo lock", hub: "People" },
  { id: "F08", title: "Revoke all sessions", hub: "Trust" },
  { id: "F09", title: "Signup funnel analytics", hub: "Growth" },
  { id: "F10", title: "Churn / inactive risk list", hub: "Growth" },
  { id: "F11", title: "Retention cohorts", hub: "Growth" },
  { id: "F12", title: "Presence by role (today)", hub: "Growth" },
  { id: "F13", title: "Category growth leaderboard", hub: "Growth" },
  { id: "F14", title: "Enrollment capacity board", hub: "Academics" },
  { id: "F15", title: "Academic year roll-forward", hub: "Academics" },
  { id: "F16", title: "Certificate audit + revoke", hub: "Academics" },
  { id: "F17", title: "Quiz integrity anomalies", hub: "Academics" },
  { id: "F18", title: "Assignment late-spike detector", hub: "Academics" },
  { id: "F19", title: "Recording storage overview", hub: "Content" },
  { id: "F20", title: "Purge failed recordings", hub: "Content" },
  { id: "F21", title: "Community moderation feed", hub: "Content" },
  { id: "F22", title: "Hide / delete community message", hub: "Content" },
  { id: "F23", title: "Class fill-rate heatmap", hub: "Workforce" },
  { id: "F24", title: "Tutor utilization scoreboard", hub: "Workforce" },
  { id: "F25", title: "Attendance / no-show risk", hub: "Workforce" },
  { id: "F26", title: "Schedule conflict detector", hub: "Workforce" },
  { id: "F27", title: "Emergency platform broadcast", hub: "Comms" },
  { id: "F28", title: "Force-end all live rooms", hub: "Live Ops" },
  { id: "F29", title: "Overdue fee action queue", hub: "Finance" },
  { id: "F30", title: "Fee status override", hub: "Finance" },
  { id: "F31", title: "Tutor payout approval queue", hub: "Finance" },
  { id: "F32", title: "Approve / reject salary", hub: "Finance" },
  { id: "F33", title: "Expense review queue", hub: "Finance" },
  { id: "F34", title: "Expense flagging", hub: "Finance" },
  { id: "F35", title: "Revenue MTD vs prior month", hub: "Finance" },
  { id: "F36", title: "Finance CSV export", hub: "Finance" },
  { id: "F37", title: "Mentorship load balancer", hub: "Workforce" },
  { id: "F38", title: "Reassign mentee", hub: "Mentorship" },
  { id: "F39", title: "Role-targeted announcement blast", hub: "Comms" },
  { id: "F40", title: "Notification campaign composer", hub: "Comms" },
  { id: "F41", title: "Scheduled maintenance windows", hub: "System" },
  { id: "F42", title: "Module kill-switches", hub: "System" },
  { id: "F43", title: "Feature flag % rollout", hub: "System" },
  { id: "F44", title: "IP / email blocklist", hub: "Trust" },
  { id: "F45", title: "Failed-login abuse board", hub: "Trust" },
  { id: "F46", title: "GDPR data export package", hub: "Trust" },
  { id: "F47", title: "GDPR anonymize / erase", hub: "Trust" },
  { id: "F48", title: "Support ticket inbox", hub: "Support" },
  { id: "F49", title: "Staff changelog / release notes", hub: "System" },
  { id: "F50", title: "Custom report preset runner", hub: "System" },
];
