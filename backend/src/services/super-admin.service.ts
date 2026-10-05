import User, {
  ALL_SUPER_ADMIN_CAPABILITIES,
  type SuperAdminCapability,
} from "../models/user.model.js";
import Category from "../models/category.model.js";
import LiveClass from "../models/live-class.model.js";
import VideoRoom from "../models/video-room.model.js";
import Recording from "../models/recording.model.js";
import MentorAssignment from "../models/mentor-assignment.model.js";
import MentorshipSession from "../models/mentorship-session.model.js";
import MentorshipGoal from "../models/mentorship-goal.model.js";
import Fee from "../models/fee.model.js";
import Salary from "../models/salary.model.js";
import Expense from "../models/expense.model.js";
import ActivityLog from "../models/activity-log.model.js";
import Enrollment from "../models/enrollment.model.js";
import Certificate from "../models/certificate.model.js";
import Notification from "../models/notification.model.js";
import PlatformControl, {
  DEFAULT_FEATURE_FLAGS,
} from "../models/platform-control.model.js";
import { logActivity } from "./activity.service.js";
import type { Request } from "express";

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export async function getOrCreatePlatformControl() {
  let doc = await PlatformControl.findOne().sort({ updatedAt: -1 });
  if (!doc) {
    doc = await PlatformControl.create({
      featureFlags: DEFAULT_FEATURE_FLAGS,
    });
  } else if (!doc.featureFlags?.length) {
    doc.featureFlags = DEFAULT_FEATURE_FLAGS;
    await doc.save();
  }
  return doc;
}

export async function buildSuperAdminOverview() {
  const today = startOfDay();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const fourteenDaysAgo = daysAgo(14);
  const twentyOneDaysAgo = daysAgo(21);

  const [
    totalStudents,
    totalTutors,
    totalMentors,
    totalAdmins,
    totalSuperAdmins,
    activeUsersToday,
    lockedUsers,
    totalCategories,
    liveClassesNow,
    activeRooms,
    totalRecordings,
    failedRecordings,
    activeMentorships,
    sessionsToday,
    overdueGoals,
    feesPaidMonth,
    feesPending,
    feesOverdue,
    salariesPending,
    salariesPaidMonth,
    expensesMonth,
    enrollmentsActive,
    certificatesIssued,
    criticalLogs,
    recentActivity,
    roomsNow,
    classesLive,
  ] = await Promise.all([
    User.countDocuments({ role: "student", isActive: true }),
    User.countDocuments({ role: "tutor", isActive: true }),
    User.countDocuments({ role: "mentor", isActive: true }),
    User.countDocuments({ role: "admin", isActive: true }),
    User.countDocuments({ role: "super_admin", isActive: true }),
    User.countDocuments({
      isActive: true,
      lastLoginAt: { $gte: today },
    }),
    User.countDocuments({
      $or: [{ isActive: false }, { lockedUntil: { $gt: new Date() } }],
    }),
    Category.countDocuments({ isActive: true }),
    LiveClass.countDocuments({ status: "live" }),
    VideoRoom.countDocuments({ status: "active" }),
    Recording.countDocuments({}),
    Recording.countDocuments({ processingStatus: "failed" }),
    MentorAssignment.countDocuments({}),
    MentorshipSession.countDocuments({
      scheduledDate: { $gte: today },
    }),
    MentorshipGoal.countDocuments({
      status: "active",
      targetDate: { $lt: today },
    }).catch(() =>
      MentorshipGoal.countDocuments({ status: "active" }),
    ),
    Fee.aggregate([
      {
        $match: {
          status: "paid",
          paymentDate: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Fee.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Fee.aggregate([
      {
        $match: {
          $or: [
            { status: "overdue" },
            { status: "pending", dueDate: { $lt: today } },
          ],
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Salary.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Salary.aggregate([
      {
        $match: {
          status: "paid",
          paymentDate: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]).catch(() =>
      Expense.aggregate([
        { $match: { createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ),
    Enrollment.countDocuments({ status: "active" }),
    Certificate.countDocuments({ status: "issued" }),
    ActivityLog.countDocuments({
      createdAt: { $gte: daysAgo(1) },
      $or: [
        { isAudit: true },
        { action: /suspend|delete|role|force|override|maintenance/i },
      ],
    }),
    ActivityLog.find({})
      .sort({ createdAt: -1 })
      .limit(25)
      .populate("user", "name email role avatar")
      .lean(),
    VideoRoom.find({ status: { $in: ["active", "waiting"] } })
      .sort({ updatedAt: -1 })
      .limit(12)
      .lean(),
    LiveClass.find({
      $or: [
        { status: "live" },
        {
          scheduledDate: {
            $gte: daysAgo(0),
            $lte: new Date(Date.now() + 2 * 60 * 60 * 1000),
          },
          status: { $nin: ["ended", "cancelled", "recorded"] },
        },
      ],
    })
      .sort({ scheduledDate: 1 })
      .limit(12)
      .populate("tutor", "name email avatar")
      .populate("category", "name")
      .lean(),
  ]);

  const paidFees = feesPaidMonth[0]?.total || 0;
  const pendingFees = feesPending[0]?.total || 0;
  const overdueFees = feesOverdue[0]?.total || 0;
  const pendingSalaries = salariesPending[0]?.total || 0;
  const paidSalaries = salariesPaidMonth[0]?.total || 0;
  const monthExpenses = expensesMonth[0]?.total || 0;

  const netMonth = paidFees - paidSalaries - monthExpenses;

  // Health score heuristic
  let healthScore = 92;
  if (failedRecordings > 0) healthScore -= Math.min(15, failedRecordings * 3);
  if (overdueFees > paidFees * 0.35) healthScore -= 10;
  if (lockedUsers > 10) healthScore -= 5;
  if (overdueGoals > 20) healthScore -= 5;
  healthScore = Math.max(35, Math.min(100, healthScore));

  const health =
    healthScore >= 85 ? "green" : healthScore >= 65 ? "amber" : "red";

  const control = await getOrCreatePlatformControl();

  // Anomalies / risk cards
  const longOverdueFees = await Fee.find({
    $or: [
      { status: "overdue" },
      { status: "pending", dueDate: { $lt: fourteenDaysAgo } },
    ],
  })
    .sort({ dueDate: 1 })
    .limit(8)
    .populate("student", "name email avatar")
    .lean();

  const inactiveMentors = await User.find({
    role: "mentor",
    isActive: true,
    $or: [
      { lastLoginAt: { $lt: twentyOneDaysAgo } },
      { lastLoginAt: null },
    ],
  })
    .select("name email avatar lastLoginAt")
    .limit(8)
    .lean();

  const salaryPaidMissingNotif = await Salary.find({
    status: "paid",
    paymentDate: { $gte: daysAgo(30) },
  })
    .populate("employee", "name email role")
    .limit(20)
    .lean();

  const salaryIds = salaryPaidMissingNotif.map((s) => String(s._id));
  const notifCount = await Notification.countDocuments({
    type: "salary_paid",
    "metadata.salaryId": { $in: salaryIds },
  }).catch(() => 0);

  const alerts = [
    failedRecordings > 0
      ? {
          id: "recording-fail",
          severity: "critical" as const,
          title: `${failedRecordings} recording failure(s)`,
          detail: "Playback or processing may be broken for recent classes.",
          href: "/super-admin/live-ops",
        }
      : null,
    overdueFees > 0
      ? {
          id: "fee-overdue",
          severity: "warning" as const,
          title: `₦${Math.round(overdueFees).toLocaleString()} overdue fees`,
          detail: `${feesOverdue[0]?.count || 0} student fee records need attention.`,
          href: "/super-admin/finance",
        }
      : null,
    control.maintenanceMode
      ? {
          id: "maintenance",
          severity: "critical" as const,
          title: "Maintenance mode is ON",
          detail: control.maintenanceMessage || "Platform access may be limited.",
          href: "/super-admin/org",
        }
      : null,
    inactiveMentors.length > 0
      ? {
          id: "mentor-inactive",
          severity: "warning" as const,
          title: `${inactiveMentors.length} inactive mentor(s)`,
          detail: "No login in 21+ days — consider rebalancing mentees.",
          href: "/super-admin/mentorship",
        }
      : null,
    salaryPaidMissingNotif.length > 0 &&
    notifCount < salaryPaidMissingNotif.length
      ? {
          id: "salary-notif-gap",
          severity: "info" as const,
          title: "Salary notification gaps detected",
          detail: "Some paid salaries may be missing salary_paid alerts.",
          href: "/super-admin/finance",
        }
      : null,
  ].filter(Boolean);

  // Category growth snapshot
  const categoryGrowth = await Enrollment.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        categoryId: "$_id",
        name: "$category.name",
        count: 1,
      },
    },
  ]).catch(() => []);

  return {
    health: { score: healthScore, status: health },
    pulse: {
      activeUsersToday,
      liveClassesNow: Array.isArray(classesLive)
        ? classesLive.filter((c: { status?: string }) => c.status === "live")
            .length || liveClassesNow
        : liveClassesNow,
      activeRooms,
      sessionsToday,
      lockedUsers,
      criticalEvents24h: criticalLogs,
    },
    census: {
      totalStudents,
      totalTutors,
      totalMentors,
      totalAdmins,
      totalSuperAdmins,
      totalCategories,
      totalRecordings,
      activeMentorships,
      enrollmentsActive,
      certificatesIssued,
    },
    finance: {
      feesCollectedMonth: paidFees,
      feesPending: pendingFees,
      feesOverdue: overdueFees,
      salariesPending: pendingSalaries,
      salariesPaidMonth: paidSalaries,
      expensesMonth: monthExpenses,
      netMonth,
      overdueFeeCount: feesOverdue[0]?.count || 0,
      pendingSalaryCount: salariesPending[0]?.count || 0,
    },
    risk: {
      failedRecordings,
      overdueGoals,
      longOverdueFees,
      inactiveMentors,
      alerts,
    },
    growth: { categoryGrowth },
    live: {
      rooms: roomsNow,
      classes: classesLive,
    },
    activity: recentActivity,
    platform: {
      maintenanceMode: control.maintenanceMode,
      bannerEnabled: control.bannerEnabled,
      bannerMessage: control.bannerMessage,
      bannerTone: control.bannerTone,
    },
  };
}

export async function listPeople(query: {
  q?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const filter: Record<string, unknown> = {};

  if (query.role) filter.role = query.role;
  if (query.status === "active") filter.isActive = true;
  if (query.status === "inactive") filter.isActive = false;
  if (query.q?.trim()) {
    const rx = new RegExp(query.q.trim(), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categories", "name slug")
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  };
}

export async function getPersonDossier(userId: string) {
  const user = await User.findById(userId)
    .select("-password")
    .populate("categories", "name slug icon")
    .lean();
  if (!user) return null;

  const [
    enrollments,
    fees,
    salaries,
    sessions,
    goals,
    certificates,
    activity,
    notifications,
  ] = await Promise.all([
    Enrollment.find({ student: userId })
      .populate("category", "name slug")
      .limit(20)
      .lean()
      .catch(() => []),
    Fee.find({ student: userId }).sort({ dueDate: -1 }).limit(20).lean(),
    Salary.find({ employee: userId }).sort({ year: -1, month: -1 }).limit(20).lean(),
    MentorshipSession.find({
      $or: [{ mentor: userId }, { mentee: userId }],
    })
      .sort({ scheduledDate: -1 })
      .limit(20)
      .populate("mentor mentee", "name email avatar")
      .lean(),
    MentorshipGoal.find({
      $or: [{ mentor: userId }, { mentee: userId }],
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean()
      .catch(() => []),
    Certificate.find({ student: userId }).limit(20).lean().catch(() => []),
    ActivityLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
    Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  return {
    user,
    enrollments,
    fees,
    salaries,
    sessions,
    goals,
    certificates,
    activity,
    notifications,
  };
}

export async function listAdmins() {
  return User.find({ role: { $in: ["admin", "super_admin"] } })
    .select("-password")
    .sort({ role: -1, name: 1 })
    .lean();
}

export async function updateAdminAccess(input: {
  actorId: string;
  targetId: string;
  role?: "admin" | "super_admin";
  capabilities?: SuperAdminCapability[];
  isActive?: boolean;
  req?: Request;
}) {
  const target = await User.findById(input.targetId);
  if (!target) throw new Error("User not found");
  if (!["admin", "super_admin"].includes(target.role) && !input.role) {
    throw new Error("Target is not an admin");
  }

  if (input.role) target.role = input.role;
  if (typeof input.isActive === "boolean") target.isActive = input.isActive;
  if (input.capabilities) {
    target.capabilities = input.capabilities.filter((c) =>
      ALL_SUPER_ADMIN_CAPABILITIES.includes(c),
    );
  }
  await target.save();

  await logActivity({
    userId: input.actorId,
    action: "Updated admin access",
    details: `Updated ${target.email}`,
    resourceType: "user",
    resourceId: String(target._id),
    metadata: {
      role: target.role,
      capabilities: target.capabilities,
      isActive: target.isActive,
    },
    isAudit: true,
    req: input.req,
  });

  return target;
}

export async function getFinanceCommand() {
  const today = startOfDay();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [paid, pending, overdue, salariesPending, salariesPaid, expenses] =
    await Promise.all([
      Fee.aggregate([
        { $match: { status: "paid", paymentDate: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Fee.find({ status: "pending" })
        .sort({ dueDate: 1 })
        .limit(30)
        .populate("student", "name email avatar")
        .lean(),
      Fee.find({
        $or: [
          { status: "overdue" },
          { status: "pending", dueDate: { $lt: today } },
        ],
      })
        .sort({ dueDate: 1 })
        .limit(30)
        .populate("student", "name email avatar")
        .lean(),
      Salary.find({ status: "pending" })
        .sort({ year: -1, month: -1 })
        .limit(30)
        .populate("employee", "name email role avatar")
        .lean(),
      Salary.find({ status: "paid", paymentDate: { $gte: monthStart } })
        .sort({ paymentDate: -1 })
        .limit(30)
        .populate("employee", "name email role avatar")
        .lean(),
      Expense.find({})
        .sort({ date: -1, createdAt: -1 })
        .limit(30)
        .lean(),
    ]);

  const expenseMonth = await Expense.aggregate([
    {
      $match: {
        $or: [{ date: { $gte: monthStart } }, { createdAt: { $gte: monthStart } }],
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return {
    summary: {
      collectedMonth: paid[0]?.total || 0,
      collectedCount: paid[0]?.count || 0,
      pendingTotal: pending.reduce((s, f) => s + (f.amount || 0), 0),
      overdueTotal: overdue.reduce((s, f) => s + (f.amount || 0), 0),
      salariesPendingTotal: salariesPending.reduce(
        (s, x) => s + (x.amount || 0),
        0,
      ),
      salariesPaidMonth: salariesPaid.reduce((s, x) => s + (x.amount || 0), 0),
      expensesMonth: expenseMonth[0]?.total || 0,
    },
    pendingFees: pending,
    overdueFees: overdue,
    pendingSalaries: salariesPending,
    paidSalaries: salariesPaid,
    expenses,
  };
}

export async function getMentorshipGraph() {
  // MentorAssignment docs (legacy/explicit) + Category.mentors + role=mentor users
  const [assignments, categories, mentorUsers] = await Promise.all([
    MentorAssignment.find({})
      .populate("mentor", "name email avatar lastLoginAt isActive")
      .populate("mentees", "name email avatar")
      .populate("category", "name")
      .lean(),
    Category.find({ isActive: true })
      .select("name mentors students")
      .populate("mentors", "name email avatar lastLoginAt isActive")
      .populate("students", "name email avatar")
      .lean(),
    User.find({ role: "mentor" })
      .select("name email avatar lastLoginAt isActive categories")
      .lean(),
  ]);

  const nodes: {
    id: string;
    kind: "mentor" | "mentee";
    name: string;
    email?: string;
    avatar?: string;
  }[] = [];
  const edges: { from: string; to: string; category?: string }[] = [];
  const seen = new Set<string>();
  const loadMap = new Map<
    string,
    { mentorId: string; mentorName: string; menteeCount: number; categories: string[] }
  >();

  const ensureMentor = (m: {
    _id?: { toString(): string };
    name?: string;
    email?: string;
    avatar?: string;
  } | null) => {
    if (!m?._id) return null;
    const mid = String(m._id);
    if (!seen.has(mid)) {
      seen.add(mid);
      nodes.push({
        id: mid,
        kind: "mentor",
        name: m.name || "Mentor",
        email: m.email,
        avatar: m.avatar,
      });
    }
    if (!loadMap.has(mid)) {
      loadMap.set(mid, {
        mentorId: mid,
        mentorName: m.name || "Mentor",
        menteeCount: 0,
        categories: [],
      });
    }
    return mid;
  };

  const ensureMentee = (m: {
    _id?: { toString(): string };
    name?: string;
    email?: string;
    avatar?: string;
  } | null) => {
    if (!m?._id) return null;
    const id = String(m._id);
    if (!seen.has(`mentee:${id}`)) {
      seen.add(`mentee:${id}`);
      nodes.push({
        id,
        kind: "mentee",
        name: m.name || "Mentee",
        email: m.email,
        avatar: m.avatar,
      });
    }
    return id;
  };

  for (const a of assignments) {
    const mentor = a.mentor as {
      _id: { toString(): string };
      name?: string;
      email?: string;
      avatar?: string;
    } | null;
    const mid = ensureMentor(mentor);
    if (!mid) continue;
    const catName = (a.category as { name?: string } | null)?.name;
    if (catName && !loadMap.get(mid)!.categories.includes(catName)) {
      loadMap.get(mid)!.categories.push(catName);
    }
    const mentees = (a.mentees || []) as Array<{
      _id: { toString(): string };
      name?: string;
      email?: string;
      avatar?: string;
    }>;
    for (const m of mentees) {
      const id = ensureMentee(m);
      if (!id) continue;
      edges.push({ from: mid, to: id, category: catName });
      loadMap.get(mid)!.menteeCount += 1;
    }
  }

  for (const cat of categories) {
    const mentors = (cat.mentors || []) as Array<{
      _id: { toString(): string };
      name?: string;
      email?: string;
      avatar?: string;
    }>;
    const students = (cat.students || []) as Array<{
      _id: { toString(): string };
      name?: string;
      email?: string;
      avatar?: string;
    }>;
    for (const mentor of mentors) {
      const mid = ensureMentor(mentor);
      if (!mid) continue;
      if (cat.name && !loadMap.get(mid)!.categories.includes(cat.name)) {
        loadMap.get(mid)!.categories.push(cat.name);
      }
      // If no explicit mentee links yet, use category students as mentee pool size
      if (
        !assignments.some(
          (a) => String((a.mentor as { _id?: unknown })?._id) === mid,
        )
      ) {
        for (const s of students.slice(0, 50)) {
          const id = ensureMentee(s);
          if (!id) continue;
          if (!edges.some((e) => e.from === mid && e.to === id)) {
            edges.push({ from: mid, to: id, category: cat.name });
            loadMap.get(mid)!.menteeCount += 1;
          }
        }
      }
    }
  }

  // Include mentors with no category links yet
  for (const m of mentorUsers) {
    ensureMentor(m as { _id: { toString(): string }; name?: string; email?: string; avatar?: string });
  }

  const load = Array.from(loadMap.values()).sort(
    (x, y) => y.menteeCount - x.menteeCount,
  );

  return {
    nodes,
    edges,
    load,
    summary: {
      mentors: nodes.filter((n) => n.kind === "mentor").length,
      mentees: nodes.filter((n) => n.kind === "mentee").length,
      links: edges.length,
      assignments: assignments.length,
      categoriesWithMentors: categories.filter(
        (c) => Array.isArray(c.mentors) && c.mentors.length > 0,
      ).length,
    },
  };
}

export async function getAuditLogs(query: {
  q?: string;
  page?: number;
  limit?: number;
  auditOnly?: boolean;
}) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 30));
  const filter: Record<string, unknown> = {
    // Keep View as / act-as out of audit dashboards
    "metadata.mode": { $ne: "act_as" },
    "metadata.impersonatorId": { $exists: false },
  };
  if (query.auditOnly) filter.isAudit = true;
  if (query.q?.trim()) {
    const rx = new RegExp(query.q.trim(), "i");
    filter.$or = [{ action: rx }, { details: rx }];
  }

  const [items, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name email role avatar")
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  };
}

export async function getLiveOps() {
  const [rooms, classes, failedRecordings] = await Promise.all([
    VideoRoom.find({ status: { $in: ["active", "waiting"] } })
      .sort({ updatedAt: -1 })
      .limit(40)
      .lean(),
    LiveClass.find({
      status: { $nin: ["ended", "cancelled", "recorded"] },
      scheduledDate: {
        $gte: daysAgo(1),
        $lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })
      .sort({ scheduledDate: 1 })
      .limit(40)
      .populate("tutor", "name email avatar")
      .populate("category", "name")
      .lean(),
    Recording.find({ processingStatus: "failed" })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean(),
  ]);

  return { rooms, classes, failedRecordings };
}
