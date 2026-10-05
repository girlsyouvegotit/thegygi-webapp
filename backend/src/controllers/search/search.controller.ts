import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../middleware/error.middleware.js";
import User from "../../models/user.model.js";
import Category from "../../models/category.model.js";
import LiveClass from "../../models/live-class.model.js";
import Recording from "../../models/recording.model.js";
import Quiz from "../../models/quiz.model.js";
import Assignment from "../../models/assignment.model.js";
import MentorshipSession from "../../models/mentorship-session.model.js";
import MentorshipGoal from "../../models/mentorship-goal.model.js";
import MentorNote from "../../models/mentor-note.model.js";
import MentorFeedback from "../../models/mentor-feedback.model.js";
import MentorAssignment from "../../models/mentor-assignment.model.js";
import Fee from "../../models/fee.model.js";
import Expense from "../../models/expense.model.js";
import Salary from "../../models/salary.model.js";
import Certificate from "../../models/certificate.model.js";
import Notification from "../../models/notification.model.js";
import ActivityLog from "../../models/activity-log.model.js";
import Enrollment from "../../models/enrollment.model.js";
import Community from "../../models/community.model.js";
import CommunityMessage from "../../models/community-message.model.js";

export type SearchResultType =
  | "page"
  | "user"
  | "category"
  | "class"
  | "recording"
  | "quiz"
  | "assignment"
  | "session"
  | "goal"
  | "note"
  | "feedback"
  | "fee"
  | "expense"
  | "salary"
  | "certificate"
  | "notification"
  | "activity"
  | "community";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  href: string;
  badge?: string;
}

type Role = "student" | "tutor" | "mentor" | "admin";

const PER_BUCKET = 6;
const MAX_TOTAL = 40;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textMatch(q: string) {
  return { $regex: escapeRegex(q), $options: "i" as const };
}

function pageResults(role: Role, q: string): SearchResult[] {
  const pages: Array<{
    roles: Role[];
    title: string;
    subtitle: string;
    href: string;
    keywords: string[];
  }> = [
    {
      roles: ["admin", "super_admin"],
      title: "Dashboard",
      subtitle: "Admin overview",
      href: "/admin/dashboard",
      keywords: ["dashboard", "home", "overview"],
    },
    {
      roles: ["admin", "super_admin"],
      title: "Categories",
      subtitle: "Manage learning categories",
      href: "/admin/categories",
      keywords: ["categories", "courses", "programs"],
    },
    {
      roles: ["admin", "super_admin"],
      title: "Users",
      subtitle: "Manage accounts & roles",
      href: "/admin/users",
      keywords: ["users", "students", "tutors", "mentors", "accounts"],
    },
    {
      roles: ["admin", "super_admin"],
      title: "Mentorship",
      subtitle: "Assign mentors",
      href: "/admin/mentorship",
      keywords: ["mentorship", "mentor assignment"],
    },
    {
      roles: ["admin", "super_admin"],
      title: "Recordings",
      subtitle: "Recording library",
      href: "/admin/recordings",
      keywords: ["recordings", "videos"],
    },
    {
      roles: ["admin", "super_admin"],
      title: "Analytics",
      subtitle: "Platform analytics",
      href: "/admin/analytics",
      keywords: ["analytics", "metrics", "reports"],
    },
    {
      roles: ["admin", "super_admin"],
      title: "Finance",
      subtitle: "Fees, expenses & salaries",
      href: "/admin/finance",
      keywords: ["finance", "fees", "salary", "expenses", "payments", "payroll"],
    },
    {
      roles: ["admin", "super_admin"],
      title: "Activity Logs",
      subtitle: "Audit trail",
      href: "/admin/activity-logs",
      keywords: ["activity", "logs", "audit"],
    },
    {
      roles: ["admin", "super_admin"],
      title: "Settings",
      subtitle: "Platform settings",
      href: "/admin/settings",
      keywords: ["settings", "config"],
    },
    {
      roles: ["super_admin"],
      title: "Command Center",
      subtitle: "Super-admin mission control",
      href: "/super-admin/dashboard",
      keywords: ["super", "command", "mission", "pulse", "overview"],
    },
    {
      roles: ["super_admin"],
      title: "Admin Governance",
      subtitle: "Manage admins & capabilities",
      href: "/super-admin/admins",
      keywords: ["admins", "governance", "capabilities"],
    },
    {
      roles: ["super_admin"],
      title: "People Intelligence",
      subtitle: "User 360 & impersonation",
      href: "/super-admin/people",
      keywords: ["people", "users", "dossier", "impersonate"],
    },
    {
      roles: ["super_admin"],
      title: "Finance Command",
      subtitle: "Revenue truth & anomalies",
      href: "/super-admin/finance",
      keywords: ["finance", "fees", "salary", "payroll"],
    },
    {
      roles: ["super_admin"],
      title: "Live Ops",
      subtitle: "Rooms & class monitoring",
      href: "/super-admin/live-ops",
      keywords: ["live", "ops", "rooms", "classes"],
    },
    {
      roles: ["super_admin"],
      title: "Org Controls",
      subtitle: "Flags & maintenance mode",
      href: "/super-admin/org",
      keywords: ["org", "flags", "maintenance", "banner"],
    },
    {
      roles: ["super_admin"],
      title: "Security Audit",
      subtitle: "Privileged action trail",
      href: "/super-admin/security",
      keywords: ["security", "audit", "logs"],
    },
    {
      roles: ["super_admin"],
      title: "Moderation Desk",
      subtitle: "Warn, suspend, ban & message",
      href: "/super-admin/moderation",
      keywords: ["moderation", "ban", "suspend", "warn", "enforcement"],
    },
    {
      roles: ["super_admin"],
      title: "Growth Intelligence",
      subtitle: "Funnel, retention & churn",
      href: "/super-admin/growth",
      keywords: ["growth", "funnel", "churn", "retention", "signup"],
    },
    {
      roles: ["super_admin"],
      title: "Trust & Safety",
      subtitle: "Blocklists, GDPR & sessions",
      href: "/super-admin/trust",
      keywords: ["trust", "gdpr", "blocklist", "abuse", "sessions"],
    },
    {
      roles: ["super_admin"],
      title: "Support Inbox",
      subtitle: "Tickets & SLA",
      href: "/super-admin/support",
      keywords: ["support", "tickets", "sla", "helpdesk"],
    },
    {
      roles: ["super_admin"],
      title: "Workforce Ops",
      subtitle: "Tutors, fill rates & conflicts",
      href: "/super-admin/workforce",
      keywords: ["workforce", "utilization", "attendance", "conflicts"],
    },
    {
      roles: ["super_admin"],
      title: "Academics Control",
      subtitle: "Years, certificates & risk",
      href: "/super-admin/academics",
      keywords: ["academics", "certificates", "enrollment", "quiz"],
    },
    {
      roles: ["super_admin"],
      title: "Content & Storage",
      subtitle: "Recordings & moderation",
      href: "/super-admin/content",
      keywords: ["content", "recordings", "moderation", "community"],
    },
    {
      roles: ["super_admin"],
      title: "Communications",
      subtitle: "Blasts & emergency broadcast",
      href: "/super-admin/comms",
      keywords: ["comms", "broadcast", "announcement", "blast"],
    },
    {
      roles: ["super_admin"],
      title: "System Controls",
      subtitle: "Kill-switches, rollouts & reports",
      href: "/super-admin/system",
      keywords: ["system", "killswitch", "rollout", "changelog", "reports"],
    },
    {
      roles: ["super_admin"],
      title: "Admin Ops · Categories",
      subtitle: "Full admin categories tools",
      href: "/super-admin/ops/categories",
      keywords: ["categories", "programs", "ops"],
    },
    {
      roles: ["super_admin"],
      title: "Admin Ops · Users",
      subtitle: "Full admin user management",
      href: "/super-admin/ops/users",
      keywords: ["users", "suspend", "ops"],
    },
    {
      roles: ["super_admin"],
      title: "Admin Ops · Recordings",
      subtitle: "Full recording management",
      href: "/super-admin/ops/recordings",
      keywords: ["recordings", "download", "ops"],
    },
    {
      roles: ["super_admin"],
      title: "Admin Ops · Analytics",
      subtitle: "Platform analytics",
      href: "/super-admin/ops/analytics",
      keywords: ["analytics", "ops"],
    },
    {
      roles: ["tutor"],
      title: "Dashboard",
      subtitle: "Tutor overview",
      href: "/tutor/dashboard",
      keywords: ["dashboard", "home"],
    },
    {
      roles: ["tutor"],
      title: "My Classes",
      subtitle: "Live & scheduled sessions",
      href: "/tutor/classes",
      keywords: ["classes", "sessions", "live"],
    },
    {
      roles: ["tutor"],
      title: "Recordings",
      subtitle: "Class recordings",
      href: "/tutor/recordings",
      keywords: ["recordings", "videos"],
    },
    {
      roles: ["tutor"],
      title: "Schedule Class",
      subtitle: "Create a new class",
      href: "/tutor/schedule",
      keywords: ["schedule", "create class", "new class"],
    },
    {
      roles: ["tutor"],
      title: "Quizzes",
      subtitle: "Quiz management",
      href: "/tutor/quizzes",
      keywords: ["quizzes", "assessments", "tests"],
    },
    {
      roles: ["tutor"],
      title: "Assignments",
      subtitle: "Assignments & grading",
      href: "/tutor/assignments",
      keywords: ["assignments", "grading", "homework"],
    },
    {
      roles: ["tutor"],
      title: "Students",
      subtitle: "Your students",
      href: "/tutor/students",
      keywords: ["students", "learners"],
    },
    {
      roles: ["tutor"],
      title: "Analytics",
      subtitle: "Teaching analytics",
      href: "/tutor/analytics",
      keywords: ["analytics", "stats"],
    },
    {
      roles: ["mentor"],
      title: "Dashboard",
      subtitle: "Mentor overview",
      href: "/mentor/dashboard",
      keywords: ["dashboard", "home"],
    },
    {
      roles: ["mentor"],
      title: "My Mentees",
      subtitle: "Assigned mentees",
      href: "/mentor/mentees",
      keywords: ["mentees", "students"],
    },
    {
      roles: ["mentor"],
      title: "Sessions",
      subtitle: "Mentorship sessions",
      href: "/mentor/sessions",
      keywords: ["sessions", "meetings"],
    },
    {
      roles: ["mentor"],
      title: "Goals",
      subtitle: "Mentorship goals",
      href: "/mentor/goals",
      keywords: ["goals", "milestones"],
    },
    {
      roles: ["mentor"],
      title: "Feedback",
      subtitle: "Mentee feedback",
      href: "/mentor/feedback",
      keywords: ["feedback", "reviews"],
    },
    {
      roles: ["mentor"],
      title: "Notes",
      subtitle: "Private mentor notes",
      href: "/mentor/notes",
      keywords: ["notes"],
    },
    {
      roles: ["student"],
      title: "Dashboard",
      subtitle: "Your learning home",
      href: "/dashboard",
      keywords: ["dashboard", "home"],
    },
    {
      roles: ["student"],
      title: "My Learning",
      subtitle: "Enrolled categories",
      href: "/my-learning",
      keywords: ["learning", "courses", "enrolled"],
    },
    {
      roles: ["student"],
      title: "Community",
      subtitle: "Category communities",
      href: "/community",
      keywords: ["community", "chat", "channels"],
    },
    {
      roles: ["student"],
      title: "Live Classes",
      subtitle: "Upcoming & live sessions",
      href: "/live-classes",
      keywords: ["live", "classes", "sessions"],
    },
    {
      roles: ["student"],
      title: "Recordings",
      subtitle: "Watch past classes",
      href: "/recordings",
      keywords: ["recordings", "videos", "replay"],
    },
    {
      roles: ["student"],
      title: "Quizzes",
      subtitle: "Take quizzes",
      href: "/quizzes",
      keywords: ["quizzes", "tests"],
    },
    {
      roles: ["student"],
      title: "Assignments",
      subtitle: "Your assignments",
      href: "/assignments",
      keywords: ["assignments", "homework"],
    },
    {
      roles: ["student"],
      title: "Mentorship",
      subtitle: "Mentor sessions & goals",
      href: "/mentorship",
      keywords: ["mentorship", "mentor"],
    },
    {
      roles: ["student"],
      title: "Progress",
      subtitle: "Your progress",
      href: "/progress",
      keywords: ["progress", "stats"],
    },
    {
      roles: ["student"],
      title: "Certificates",
      subtitle: "Earned certificates",
      href: "/certificates",
      keywords: ["certificates", "diploma"],
    },
    {
      roles: ["student"],
      title: "Calendar",
      subtitle: "Schedule overview",
      href: "/calendar",
      keywords: ["calendar", "schedule"],
    },
    {
      roles: ["admin", "tutor", "mentor", "student", "super_admin"],
      title: "Profile",
      subtitle: "Your profile settings",
      href:
        role === "super_admin"
          ? "/super-admin/dashboard"
          : role === "admin"
            ? "/admin/profile"
            : role === "tutor"
              ? "/tutor/profile"
              : role === "mentor"
                ? "/mentor/profile"
                : "/profile",
      keywords: ["profile", "account", "settings", "avatar"],
    },
  ];

  const needle = q.toLowerCase();
  return pages
    .filter((p) => p.roles.includes(role))
    .filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.subtitle.toLowerCase().includes(needle) ||
        p.keywords.some((k) => k.includes(needle) || needle.includes(k)),
    )
    .slice(0, PER_BUCKET)
    .map((p) => ({
      id: `page-${p.href}`,
      type: "page" as const,
      title: p.title,
      subtitle: p.subtitle,
      href: p.href,
      badge: "Page",
    }));
}

async function categoryIdsForTutor(tutorId: string): Promise<string[]> {
  const cats = await Category.find({ tutors: tutorId }).select("_id").lean();
  return cats.map((c) => String(c._id));
}

async function categoryIdsForStudent(studentId: string): Promise<string[]> {
  const [enrollments, user] = await Promise.all([
    Enrollment.find({ student: studentId, status: "active" })
      .select("category")
      .lean(),
    User.findById(studentId).select("categories").lean(),
  ]);
  const ids = new Set<string>();
  for (const e of enrollments) ids.add(String(e.category));
  for (const c of user?.categories || []) ids.add(String(c));
  return [...ids];
}

async function menteeIdsForMentor(mentorId: string): Promise<string[]> {
  const rows = await MentorAssignment.find({
    mentor: mentorId,
    isActive: true,
  })
    .select("mentees")
    .lean();
  const ids = new Set<string>();
  for (const row of rows) {
    for (const m of row.mentees || []) ids.add(String(m));
  }
  return [...ids];
}

function mapUser(
  u: { _id: unknown; name?: string; email?: string; role?: string },
  href: string,
): SearchResult {
  return {
    id: String(u._id),
    type: "user",
    title: u.name || "User",
    subtitle: [u.email, u.role].filter(Boolean).join(" · "),
    href,
    badge: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "User",
  };
}

/**
 * Global workspace search — role-scoped across entities + pages.
 */
export const searchWorkspace = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const raw = String(req.query.q || "").trim();
    if (raw.length < 1) {
      res.json({ success: true, data: { results: [], query: raw } });
      return;
    }
    if (raw.length > 120) {
      res.status(400).json({ success: false, message: "Query too long" });
      return;
    }

    const user = req.user!;
    const role = user.role as Role;
    const userId = String(user._id);
    const rx = textMatch(raw);
    const results: SearchResult[] = [...pageResults(role, raw)];

    const push = (items: SearchResult[]) => {
      for (const item of items) {
        if (results.length >= MAX_TOTAL) break;
        if (results.some((r) => r.id === item.id && r.type === item.type)) {
          continue;
        }
        results.push(item);
      }
    };

    if (role === "admin" || role === "super_admin") {
      const [
        users,
        categories,
        classes,
        quizzes,
        assignments,
        recordings,
        fees,
        expenses,
        salaries,
        sessions,
        activities,
        notifications,
      ] = await Promise.all([
        User.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] })
          .select("name email role")
          .limit(PER_BUCKET)
          .lean(),
        Category.find({ $or: [{ name: rx }, { description: rx }, { slug: rx }] })
          .select("name description")
          .limit(PER_BUCKET)
          .lean(),
        LiveClass.find({ $or: [{ title: rx }, { description: rx }] })
          .select("title status scheduledDate")
          .limit(PER_BUCKET)
          .lean(),
        Quiz.find({ $or: [{ title: rx }, { description: rx }] })
          .select("title isActive")
          .limit(PER_BUCKET)
          .lean(),
        Assignment.find({ $or: [{ title: rx }, { description: rx }] })
          .select("title dueDate")
          .limit(PER_BUCKET)
          .lean(),
        Recording.find({
          $or: [{ summary: rx }, { transcript: rx }, { aiNotes: rx }],
        })
          .populate("classId", "title")
          .select("processingStatus date classId")
          .limit(PER_BUCKET)
          .lean(),
        User.find({ role: "student", $or: [{ name: rx }, { email: rx }] })
          .select("_id")
          .limit(40)
          .lean()
          .then((students) =>
            Fee.find({
              $or: [
                { description: rx },
                { status: rx },
                { student: { $in: students.map((s) => s._id) } },
              ],
            })
              .populate("student", "name email")
              .limit(PER_BUCKET)
              .lean(),
          ),
        Expense.find({ $or: [{ description: rx }, { category: rx }] })
          .limit(PER_BUCKET)
          .lean(),
        User.find({ $or: [{ name: rx }, { email: rx }] })
          .select("_id")
          .limit(40)
          .lean()
          .then((emps) =>
            Salary.find({ employee: { $in: emps.map((e) => e._id) } })
              .populate("employee", "name email role")
              .limit(PER_BUCKET)
              .lean(),
          ),
        MentorshipSession.find({
          $or: [{ topic: rx }, { description: rx }, { notes: rx }],
        })
          .populate("mentor", "name")
          .populate("mentee", "name")
          .limit(PER_BUCKET)
          .lean(),
        ActivityLog.find({ $or: [{ action: rx }, { details: rx }] })
          .limit(PER_BUCKET)
          .lean(),
        Notification.find({
          user: userId,
          $or: [{ title: rx }, { message: rx }],
        })
          .limit(PER_BUCKET)
          .lean(),
      ]);

      push(
        users.map((u) =>
          mapUser(u, `/admin/users?highlight=${String(u._id)}`),
        ),
      );
      push(
        categories.map((c) => ({
          id: String(c._id),
          type: "category",
          title: c.name,
          subtitle: c.description?.slice(0, 80),
          href: "/admin/categories",
          badge: "Category",
        })),
      );
      push(
        classes.map((c) => ({
          id: String(c._id),
          type: "class",
          title: c.title,
          subtitle: `${c.status} · ${new Date(c.scheduledDate).toLocaleDateString()}`,
          href: "/admin/analytics",
          badge: "Class",
        })),
      );
      push(
        quizzes.map((q) => ({
          id: String(q._id),
          type: "quiz",
          title: q.title,
          subtitle: q.isActive ? "Active" : "Inactive",
          href: "/admin/analytics",
          badge: "Quiz",
        })),
      );
      push(
        assignments.map((a) => ({
          id: String(a._id),
          type: "assignment",
          title: a.title,
          subtitle: a.dueDate
            ? `Due ${new Date(a.dueDate).toLocaleDateString()}`
            : undefined,
          href: "/admin/analytics",
          badge: "Assignment",
        })),
      );
      push(
        recordings.map((r) => {
          const cls = r.classId as { title?: string } | null;
          return {
            id: String(r._id),
            type: "recording" as const,
            title: cls?.title || "Recording",
            subtitle: r.processingStatus,
            href: "/admin/recordings",
            badge: "Recording",
          };
        }),
      );
      push(
        fees.map((f) => {
          const student = f.student as { name?: string } | null;
          return {
            id: String(f._id),
            type: "fee" as const,
            title: student?.name
              ? `Fee · ${student.name}`
              : `Fee ₦${Number(f.amount).toLocaleString()}`,
            subtitle: `${f.status} · ₦${Number(f.amount).toLocaleString()}`,
            href: "/admin/finance",
            badge: "Fee",
          };
        }),
      );
      push(
        expenses.map((e) => ({
          id: String(e._id),
          type: "expense",
          title: e.description.slice(0, 80),
          subtitle: `${e.category} · ₦${Number(e.amount).toLocaleString()}`,
          href: "/admin/finance",
          badge: "Expense",
        })),
      );
      push(
        salaries.map((s) => {
          const emp = s.employee as { name?: string; role?: string } | null;
          return {
            id: String(s._id),
            type: "salary" as const,
            title: emp?.name ? `Salary · ${emp.name}` : "Salary record",
            subtitle: `${s.status} · ${s.month}/${s.year} · ₦${Number(s.amount).toLocaleString()}`,
            href: "/admin/finance",
            badge: "Salary",
          };
        }),
      );
      push(
        sessions.map((s) => {
          const mentor = s.mentor as { name?: string } | null;
          const mentee = s.mentee as { name?: string } | null;
          return {
            id: String(s._id),
            type: "session" as const,
            title: s.topic || "Mentorship session",
            subtitle: [mentor?.name, mentee?.name].filter(Boolean).join(" → "),
            href: "/admin/mentorship",
            badge: "Session",
          };
        }),
      );
      push(
        activities.map((a) => ({
          id: String(a._id),
          type: "activity",
          title: a.action,
          subtitle: a.details?.slice(0, 90),
          href: "/admin/activity-logs",
          badge: "Activity",
        })),
      );
      push(
        notifications.map((n) => ({
          id: String(n._id),
          type: "notification",
          title: n.title,
          subtitle: n.message.slice(0, 90),
          href: n.link || "/admin/dashboard",
          badge: "Alert",
        })),
      );
    }

    if (role === "tutor") {
      const catIds = await categoryIdsForTutor(userId);
      const [
        classes,
        quizzes,
        assignments,
        recordings,
        categories,
        students,
        notifications,
      ] = await Promise.all([
        LiveClass.find({
          tutor: userId,
          $or: [{ title: rx }, { description: rx }],
        })
          .select("title status scheduledDate")
          .limit(PER_BUCKET)
          .lean(),
        Quiz.find({
          tutor: userId,
          $or: [{ title: rx }, { description: rx }],
        })
          .select("title isActive")
          .limit(PER_BUCKET)
          .lean(),
        Assignment.find({
          tutor: userId,
          $or: [{ title: rx }, { description: rx }],
        })
          .select("title dueDate")
          .limit(PER_BUCKET)
          .lean(),
        Recording.find({
          tutor: userId,
          $or: [{ summary: rx }, { transcript: rx }, { aiNotes: rx }],
        })
          .populate("classId", "title")
          .limit(PER_BUCKET)
          .lean(),
        Category.find({
          _id: { $in: catIds },
          $or: [{ name: rx }, { description: rx }],
        })
          .select("name description")
          .limit(PER_BUCKET)
          .lean(),
        catIds.length
          ? Enrollment.find({
              category: { $in: catIds },
              status: "active",
            })
              .select("student")
              .lean()
              .then(async (enrolled) => {
                const ids = enrolled.map((e) => e.student);
                return User.find({
                  _id: { $in: ids },
                  $or: [{ name: rx }, { email: rx }],
                })
                  .select("name email role")
                  .limit(PER_BUCKET)
                  .lean();
              })
          : Promise.resolve([]),
        Notification.find({
          user: userId,
          $or: [{ title: rx }, { message: rx }],
        })
          .limit(PER_BUCKET)
          .lean(),
      ]);

      const scopedStudents = students;

      push(
        classes.map((c) => ({
          id: String(c._id),
          type: "class",
          title: c.title,
          subtitle: `${c.status} · ${new Date(c.scheduledDate).toLocaleDateString()}`,
          href:
            c.status === "live"
              ? `/tutor/classes/${c._id}/live`
              : `/tutor/classes/${c._id}/analytics`,
          badge: "Class",
        })),
      );
      push(
        quizzes.map((q) => ({
          id: String(q._id),
          type: "quiz",
          title: q.title,
          subtitle: q.isActive ? "Active" : "Inactive",
          href: "/tutor/quizzes",
          badge: "Quiz",
        })),
      );
      push(
        assignments.map((a) => ({
          id: String(a._id),
          type: "assignment",
          title: a.title,
          subtitle: a.dueDate
            ? `Due ${new Date(a.dueDate).toLocaleDateString()}`
            : undefined,
          href: `/tutor/assignments/${a._id}/grade`,
          badge: "Assignment",
        })),
      );
      push(
        recordings.map((r) => {
          const cls = r.classId as { title?: string } | null;
          return {
            id: String(r._id),
            type: "recording" as const,
            title: cls?.title || "Recording",
            subtitle: "Recording",
            href: `/tutor/recordings/${r._id}`,
            badge: "Recording",
          };
        }),
      );
      push(
        categories.map((c) => ({
          id: String(c._id),
          type: "category",
          title: c.name,
          subtitle: c.description?.slice(0, 80),
          href: "/tutor/classes",
          badge: "Category",
        })),
      );
      push(
        scopedStudents.map((s) =>
          mapUser(s, `/tutor/students?q=${encodeURIComponent(s.name || "")}`),
        ),
      );
      push(
        notifications.map((n) => ({
          id: String(n._id),
          type: "notification",
          title: n.title,
          subtitle: n.message.slice(0, 90),
          href: n.link || "/tutor/dashboard",
          badge: "Alert",
        })),
      );
    }

    if (role === "mentor") {
      const menteeIds = await menteeIdsForMentor(userId);
      const [
        mentees,
        sessions,
        goals,
        notes,
        feedback,
        notifications,
      ] = await Promise.all([
        menteeIds.length
          ? User.find({
              _id: { $in: menteeIds },
              $or: [{ name: rx }, { email: rx }],
            })
              .select("name email role")
              .limit(PER_BUCKET)
              .lean()
          : Promise.resolve([]),
        MentorshipSession.find({
          mentor: userId,
          $or: [{ topic: rx }, { description: rx }, { notes: rx }],
        })
          .populate("mentee", "name")
          .limit(PER_BUCKET)
          .lean(),
        MentorshipGoal.find({
          mentor: userId,
          $or: [{ title: rx }, { description: rx }],
        })
          .populate("mentee", "name")
          .limit(PER_BUCKET)
          .lean(),
        MentorNote.find({
          mentor: userId,
          content: rx,
        })
          .populate("mentee", "name")
          .limit(PER_BUCKET)
          .lean(),
        MentorFeedback.find({
          mentor: userId,
          $or: [{ projectTitle: rx }, { feedback: rx }],
        })
          .populate("mentee", "name")
          .limit(PER_BUCKET)
          .lean(),
        Notification.find({
          user: userId,
          $or: [{ title: rx }, { message: rx }],
        })
          .limit(PER_BUCKET)
          .lean(),
      ]);

      push(
        mentees.map((m) =>
          mapUser(m, `/mentor/mentees/${String(m._id)}`),
        ),
      );
      push(
        sessions.map((s) => {
          const mentee = s.mentee as { name?: string } | null;
          return {
            id: String(s._id),
            type: "session" as const,
            title: s.topic || "Session",
            subtitle: mentee?.name,
            href: "/mentor/sessions",
            badge: "Session",
          };
        }),
      );
      push(
        goals.map((g) => {
          const mentee = g.mentee as { name?: string } | null;
          return {
            id: String(g._id),
            type: "goal" as const,
            title: g.title,
            subtitle: [mentee?.name, g.status].filter(Boolean).join(" · "),
            href: "/mentor/goals",
            badge: "Goal",
          };
        }),
      );
      push(
        notes.map((n) => {
          const mentee = n.mentee as { name?: string } | null;
          return {
            id: String(n._id),
            type: "note" as const,
            title: n.content.slice(0, 60),
            subtitle: mentee?.name,
            href: "/mentor/notes",
            badge: "Note",
          };
        }),
      );
      push(
        feedback.map((f) => {
          const mentee = f.mentee as { name?: string } | null;
          return {
            id: String(f._id),
            type: "feedback" as const,
            title: f.projectTitle || "Feedback",
            subtitle: mentee?.name,
            href: "/mentor/feedback",
            badge: "Feedback",
          };
        }),
      );
      push(
        notifications.map((n) => ({
          id: String(n._id),
          type: "notification",
          title: n.title,
          subtitle: n.message.slice(0, 90),
          href: n.link || "/mentor/dashboard",
          badge: "Alert",
        })),
      );
    }

    if (role === "student") {
      const catIds = await categoryIdsForStudent(userId);
      const [
        classes,
        quizzes,
        assignments,
        recordings,
        categories,
        certificates,
        sessions,
        goals,
        notifications,
        communities,
        messages,
      ] = await Promise.all([
        catIds.length
          ? LiveClass.find({
              category: { $in: catIds },
              $or: [{ title: rx }, { description: rx }],
            })
              .select("title status scheduledDate")
              .limit(PER_BUCKET)
              .lean()
          : Promise.resolve([]),
        catIds.length
          ? Quiz.find({
              category: { $in: catIds },
              $or: [{ title: rx }, { description: rx }],
            })
              .select("title isActive")
              .limit(PER_BUCKET)
              .lean()
          : Promise.resolve([]),
        catIds.length
          ? Assignment.find({
              category: { $in: catIds },
              $or: [{ title: rx }, { description: rx }],
            })
              .select("title dueDate")
              .limit(PER_BUCKET)
              .lean()
          : Promise.resolve([]),
        catIds.length
          ? Recording.find({
              category: { $in: catIds },
              $or: [{ summary: rx }, { transcript: rx }, { aiNotes: rx }],
            })
              .populate("classId", "title")
              .limit(PER_BUCKET)
              .lean()
          : Promise.resolve([]),
        catIds.length
          ? Category.find({
              _id: { $in: catIds },
              $or: [{ name: rx }, { description: rx }],
            })
              .select("name description")
              .limit(PER_BUCKET)
              .lean()
          : Promise.resolve([]),
        Certificate.find({
          student: userId,
          $or: [
            { title: rx },
            { categoryName: rx },
            { certificateNumber: rx },
          ],
        })
          .limit(PER_BUCKET)
          .lean(),
        MentorshipSession.find({
          mentee: userId,
          $or: [{ topic: rx }, { description: rx }],
        })
          .populate("mentor", "name")
          .limit(PER_BUCKET)
          .lean(),
        MentorshipGoal.find({
          mentee: userId,
          $or: [{ title: rx }, { description: rx }],
        })
          .limit(PER_BUCKET)
          .lean(),
        Notification.find({
          user: userId,
          $or: [{ title: rx }, { message: rx }],
        })
          .limit(PER_BUCKET)
          .lean(),
        Community.find({
          category: { $in: catIds },
          isActive: true,
        })
          .populate("category", "name")
          .limit(PER_BUCKET)
          .lean(),
        catIds.length
          ? Community.find({ category: { $in: catIds } })
              .select("_id")
              .lean()
              .then((coms) =>
                CommunityMessage.find({
                  community: { $in: coms.map((c) => c._id) },
                  content: rx,
                  deletedAt: null,
                })
                  .limit(PER_BUCKET)
                  .lean(),
              )
          : Promise.resolve([]),
      ]);

      push(
        classes.map((c) => ({
          id: String(c._id),
          type: "class",
          title: c.title,
          subtitle: `${c.status} · ${new Date(c.scheduledDate).toLocaleDateString()}`,
          href:
            c.status === "live"
              ? `/live-class/${c._id}`
              : "/live-classes",
          badge: "Class",
        })),
      );
      push(
        quizzes.map((q) => ({
          id: String(q._id),
          type: "quiz",
          title: q.title,
          subtitle: q.isActive ? "Available" : "Closed",
          href: `/quizzes/${q._id}`,
          badge: "Quiz",
        })),
      );
      push(
        assignments.map((a) => ({
          id: String(a._id),
          type: "assignment",
          title: a.title,
          subtitle: a.dueDate
            ? `Due ${new Date(a.dueDate).toLocaleDateString()}`
            : undefined,
          href: "/assignments",
          badge: "Assignment",
        })),
      );
      push(
        recordings.map((r) => {
          const cls = r.classId as { title?: string } | null;
          return {
            id: String(r._id),
            type: "recording" as const,
            title: cls?.title || "Recording",
            subtitle: "Recording",
            href: `/recordings/${r._id}`,
            badge: "Recording",
          };
        }),
      );
      push(
        categories.map((c) => ({
          id: String(c._id),
          type: "category",
          title: c.name,
          subtitle: c.description?.slice(0, 80),
          href: "/my-learning",
          badge: "Category",
        })),
      );
      push(
        certificates.map((c) => ({
          id: String(c._id),
          type: "certificate",
          title: c.title || c.categoryName,
          subtitle: c.certificateNumber,
          href: `/certificates/${c._id}`,
          badge: "Certificate",
        })),
      );
      push(
        sessions.map((s) => {
          const mentor = s.mentor as { name?: string } | null;
          return {
            id: String(s._id),
            type: "session" as const,
            title: s.topic || "Mentorship session",
            subtitle: mentor?.name,
            href: "/mentorship",
            badge: "Session",
          };
        }),
      );
      push(
        goals.map((g) => ({
          id: String(g._id),
          type: "goal",
          title: g.title,
          subtitle: g.status,
          href: "/mentorship",
          badge: "Goal",
        })),
      );
      push(
        notifications.map((n) => ({
          id: String(n._id),
          type: "notification",
          title: n.title,
          subtitle: n.message.slice(0, 90),
          href: n.link || "/dashboard",
          badge: "Alert",
        })),
      );
      push(
        communities
          .filter((c) => {
            const cat = c.category as { name?: string } | null;
            return (
              !raw ||
              (cat?.name || "").toLowerCase().includes(raw.toLowerCase()) ||
              "community".includes(raw.toLowerCase())
            );
          })
          .map((c) => {
            const cat = c.category as { name?: string } | null;
            return {
              id: String(c._id),
              type: "community" as const,
              title: cat?.name ? `${cat.name} community` : "Community",
              subtitle: "Open community",
              href: "/community",
              badge: "Community",
            };
          }),
      );
      push(
        messages.map((m) => ({
          id: String(m._id),
          type: "community",
          title: m.content.slice(0, 70),
          subtitle: "Community message",
          href: "/community",
          badge: "Message",
        })),
      );
    }

    res.json({
      success: true,
      data: {
        query: raw,
        results: results.slice(0, MAX_TOTAL),
      },
    });
  },
);
