import type { Request } from "express";
import mongoose from "mongoose";
import User, { type userRoles } from "../models/user.model.js";
import Enrollment from "../models/enrollment.model.js";
import AcademicYear from "../models/academic-year.model.js";
import Certificate from "../models/certificate.model.js";
import QuizSubmission from "../models/quiz-submission.model.js";
import AssignmentSubmission from "../models/assignment-submission.model.js";
import Recording from "../models/recording.model.js";
import CommunityMessage from "../models/community-message.model.js";
import LiveClass from "../models/live-class.model.js";
import Attendance from "../models/attendance.model.js";
import MentorAssignment from "../models/mentor-assignment.model.js";
import VideoRoom from "../models/video-room.model.js";
import Fee from "../models/fee.model.js";
import Salary from "../models/salary.model.js";
import Expense from "../models/expense.model.js";
import Notification from "../models/notification.model.js";
import SupportTicket, {
  type SupportTicketPriority,
  type SupportTicketStatus,
} from "../models/support-ticket.model.js";
import {
  DEFAULT_REPORT_PRESETS,
  type IExperiment,
  type IFeatureFlag,
  type IKillSwitch,
  type IReportPreset,
  type IScheduledMaintenance,
  type IStaffChangelogEntry,
  type IWebhook,
} from "../models/platform-control.model.js";
import { getOrCreatePlatformControl } from "./super-admin.service.js";
import { logActivity } from "./activity.service.js";
import { badRequest, notFound } from "../middleware/error.middleware.js";

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

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const escapeCsv = (value: unknown): string => {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

type ActorCtx = { actorId: string; req?: Request };

/* -------------------------------------------------------------------------- */
/* Hubs                                                                        */
/* -------------------------------------------------------------------------- */

export async function getGrowthHub() {
  const today = startOfDay();
  const d1 = daysAgo(1);
  const d7 = daysAgo(7);
  const d21 = daysAgo(21);
  const d30 = daysAgo(30);
  const d90 = daysAgo(90);

  const roleCounts = async (since: Date) => {
    const rows = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);
    const out: Record<string, number> = {};
    for (const r of rows) out[String(r._id)] = r.count;
    return out;
  };

  const [funnel1d, funnel7d, funnel30d, churnRisk, retentionRaw, presenceByRole, categoryGrowth] =
    await Promise.all([
      roleCounts(d1),
      roleCounts(d7),
      roleCounts(d30),
      User.find({
        role: "student",
        isActive: true,
        $or: [{ lastLoginAt: null }, { lastLoginAt: { $lt: d21 } }],
      })
        .select("name email role lastLoginAt isActive createdAt")
        .sort({ lastLoginAt: 1 })
        .limit(50)
        .lean(),
      User.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $gte: ["$lastLoginAt", today] }, then: "today" },
                  { case: { $gte: ["$lastLoginAt", d7] }, then: "7d" },
                  { case: { $gte: ["$lastLoginAt", d30] }, then: "30d" },
                  { case: { $gte: ["$lastLoginAt", d90] }, then: "90d" },
                ],
                default: "older",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([
        {
          $match: {
            isActive: true,
            lastLoginAt: { $gte: today },
          },
        },
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
      Enrollment.aggregate([
        { $match: { enrolledAt: { $gte: d30 } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
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
      ]),
    ]);

  const retentionCohorts = {
    today: 0,
    "7d": 0,
    "30d": 0,
    "90d": 0,
    older: 0,
  };
  for (const row of retentionRaw) {
    const key = String(row._id) as keyof typeof retentionCohorts;
    if (key in retentionCohorts) retentionCohorts[key] = row.count;
  }

  return {
    signupFunnel: { "1d": funnel1d, "7d": funnel7d, "30d": funnel30d },
    churnRisk,
    retentionCohorts,
    presenceByRole: presenceByRole.map((r) => ({
      role: r._id,
      count: r.count,
    })),
    categoryGrowth,
  };
}

export async function getAcademicsHub() {
  const [
    statusCounts,
    topCategories,
    academicYears,
    certificates,
    revokedCount,
    quizAnomalies,
    assignmentLate,
  ] = await Promise.all([
    Enrollment.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Enrollment.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
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
    ]),
    AcademicYear.find({}).sort({ startDate: -1, name: -1 }).lean(),
    Certificate.find({})
      .sort({ issuedAt: -1 })
      .limit(40)
      .populate("student", "name email")
      .populate("category", "name")
      .lean(),
    Certificate.countDocuments({ status: "revoked" }),
    QuizSubmission.find({
      $or: [
        { percentage: { $lt: 20 } },
        { $and: [{ percentage: 100 }, { attempt: { $gt: 2 } }] },
      ],
    })
      .sort({ submittedAt: -1 })
      .limit(50)
      .populate("student", "name email")
      .populate("quiz", "title")
      .lean(),
    AssignmentSubmission.find({
      $or: [{ isLate: true }, { status: "late" }],
    })
      .sort({ submittedAt: -1 })
      .limit(50)
      .populate("student", "name email")
      .populate("assignment", "title dueDate")
      .lean(),
  ]);

  const byStatus: Record<string, number> = {
    active: 0,
    completed: 0,
    dropped: 0,
    suspended: 0,
  };
  for (const row of statusCounts) {
    byStatus[String(row._id)] = row.count;
  }

  return {
    enrollmentStats: {
      byStatus,
      topCategories,
    },
    academicYears,
    certificates: { recent: certificates, revokedCount },
    quizAnomalies,
    assignmentLate,
  };
}

export async function getContentHub() {
  const [total, failedCount, byStatus, failedRecordings, recentMessages] =
    await Promise.all([
      Recording.countDocuments({}),
      Recording.countDocuments({ processingStatus: "failed" }),
      Recording.aggregate([
        { $group: { _id: "$processingStatus", count: { $sum: 1 } } },
      ]),
      Recording.find({ processingStatus: "failed" })
        .sort({ updatedAt: -1 })
        .limit(50)
        .populate("tutor", "name email")
        .populate("category", "name")
        .lean(),
      CommunityMessage.find({})
        .sort({ createdAt: -1 })
        .limit(40)
        .populate("user", "name email role avatar")
        .select(
          "content community channel user isAnnouncement isPinned deletedAt createdAt updatedAt",
        )
        .lean(),
    ]);

  return {
    recordingStorage: {
      total,
      failedCount,
      byStatus: byStatus.map((r) => ({
        status: r._id,
        count: r.count,
      })),
    },
    failedRecordings,
    recentMessages,
  };
}

export async function getWorkforceHub() {
  const past14 = daysAgo(14);
  const next14 = daysFromNow(14);
  const d30 = daysAgo(30);

  const classes = await LiveClass.find({
    scheduledDate: { $gte: past14, $lte: next14 },
    status: { $ne: "cancelled" },
  })
    .select("title tutor scheduledDate duration maxParticipants status category")
    .populate("tutor", "name email")
    .populate("category", "name")
    .lean();

  const classIds = classes.map((c) => c._id);
  const attendanceCounts = await Attendance.aggregate([
    { $match: { classId: { $in: classIds } } },
    {
      $group: {
        _id: "$classId",
        attendanceCount: { $sum: 1 },
        presentCount: {
          $sum: {
            $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0],
          },
        },
      },
    },
  ]);
  const attendanceMap = new Map(
    attendanceCounts.map((r) => [String(r._id), r]),
  );

  const fillRates = classes.map((c) => {
    const att = attendanceMap.get(String(c._id));
    const attendanceCount = att?.attendanceCount || 0;
    const max = c.maxParticipants || 0;
    return {
      ...c,
      attendanceCount,
      presentCount: att?.presentCount || 0,
      fillRate: max > 0 ? Math.round((attendanceCount / max) * 1000) / 10 : null,
      window: c.scheduledDate >= new Date() ? "upcoming" : "past",
    };
  });

  const [tutorUtilization, noShowRisk, scheduleConflicts, mentorshipLoad] =
    await Promise.all([
      LiveClass.aggregate([
        {
          $match: {
            scheduledDate: { $gte: d30 },
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: "$tutor", classCount: { $sum: 1 } } },
        { $sort: { classCount: -1 } },
        { $limit: 40 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "tutor",
          },
        },
        { $unwind: { path: "$tutor", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            tutorId: "$_id",
            name: "$tutor.name",
            email: "$tutor.email",
            classCount: 1,
          },
        },
      ]),
      Attendance.aggregate([
        { $match: { status: "absent" } },
        { $group: { _id: "$student", absentCount: { $sum: 1 } } },
        { $sort: { absentCount: -1 } },
        { $limit: 30 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            studentId: "$_id",
            name: "$student.name",
            email: "$student.email",
            absentCount: 1,
          },
        },
      ]),
      findScheduleConflicts(),
      MentorAssignment.aggregate([
        { $match: { isActive: true } },
        {
          $project: {
            mentor: 1,
            category: 1,
            menteeCount: { $size: { $ifNull: ["$mentees", []] } },
            maxMentees: 1,
          },
        },
        { $sort: { menteeCount: -1 } },
        {
          $lookup: {
            from: "users",
            localField: "mentor",
            foreignField: "_id",
            as: "mentorUser",
          },
        },
        { $unwind: { path: "$mentorUser", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryDoc",
          },
        },
        { $unwind: { path: "$categoryDoc", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            mentorId: "$mentor",
            name: "$mentorUser.name",
            email: "$mentorUser.email",
            categoryName: "$categoryDoc.name",
            menteeCount: 1,
            maxMentees: 1,
          },
        },
      ]),
    ]);

  return {
    fillRates,
    tutorUtilization,
    noShowRisk,
    scheduleConflicts,
    mentorshipLoad,
  };
}

async function findScheduleConflicts() {
  const upcoming = await LiveClass.find({
    scheduledDate: { $gte: daysAgo(1) },
    status: { $in: ["scheduled", "live"] },
  })
    .select("tutor title scheduledDate duration status")
    .populate("tutor", "name email")
    .sort({ tutor: 1, scheduledDate: 1 })
    .lean();

  type ClassRow = (typeof upcoming)[number];
  const byTutor = new Map<string, ClassRow[]>();
  for (const cls of upcoming) {
    const tid = String((cls.tutor as { _id?: unknown })?._id || cls.tutor);
    if (!byTutor.has(tid)) byTutor.set(tid, []);
    byTutor.get(tid)!.push(cls);
  }

  const conflicts: Array<{
    tutorId: string;
    tutor: unknown;
    a: { _id: unknown; title: string; scheduledDate: Date; duration: number };
    b: { _id: unknown; title: string; scheduledDate: Date; duration: number };
  }> = [];

  for (const [tutorId, list] of byTutor) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const aStart = new Date(a.scheduledDate).getTime();
        const aEnd = aStart + (a.duration || 60) * 60_000;
        const bStart = new Date(b.scheduledDate).getTime();
        const bEnd = bStart + (b.duration || 60) * 60_000;
        if (aStart < bEnd && bStart < aEnd) {
          conflicts.push({
            tutorId,
            tutor: a.tutor,
            a: {
              _id: a._id,
              title: a.title,
              scheduledDate: a.scheduledDate,
              duration: a.duration,
            },
            b: {
              _id: b._id,
              title: b.title,
              scheduledDate: b.scheduledDate,
              duration: b.duration,
            },
          });
        }
      }
    }
  }

  return conflicts.slice(0, 50);
}

export async function getTrustHub() {
  const control = await getOrCreatePlatformControl();
  const now = new Date();

  const [lockedUsers, highFailedLogins, revokedSessionUsers] = await Promise.all([
    User.find({
      $or: [{ lockedUntil: { $gt: now } }, { isActive: false }],
    })
      .select(
        "name email role isActive lockedUntil failedLoginAttempts sessionsRevokedAt deletedAt lastLoginAt",
      )
      .sort({ lockedUntil: -1 })
      .limit(50)
      .lean(),
    User.find({ failedLoginAttempts: { $gte: 3 } })
      .select(
        "name email role failedLoginAttempts lockedUntil isActive lastLoginAt",
      )
      .sort({ failedLoginAttempts: -1 })
      .limit(50)
      .lean(),
    User.countDocuments({ sessionsRevokedAt: { $ne: null } }),
  ]);

  return {
    blocklists: {
      ipBlocklist: control.ipBlocklist || [],
      emailBlocklist: control.emailBlocklist || [],
    },
    lockedUsers,
    highFailedLogins,
    sessionsRevokedUsersCount: revokedSessionUsers,
  };
}

export async function getSystemHub() {
  const control = await getOrCreatePlatformControl();

  // Seed defaults without failing the GET if save has schema issues
  try {
    let dirty = false;
    if (!control.reportPresets?.length) {
      control.reportPresets = DEFAULT_REPORT_PRESETS;
      dirty = true;
    }
    if (!control.featureFlags?.length) {
      const { DEFAULT_FEATURE_FLAGS } = await import(
        "../models/platform-control.model.js"
      );
      control.featureFlags = DEFAULT_FEATURE_FLAGS;
      dirty = true;
    }
    if (!control.killSwitches?.length) {
      control.killSwitches = [
        { key: "live_classes", label: "Kill live classes", enabled: false },
        { key: "new_enrollments", label: "Kill new enrollments", enabled: false },
        { key: "community", label: "Kill community", enabled: false },
        { key: "payments", label: "Kill payments", enabled: false },
      ];
      dirty = true;
    }
    if (dirty) await control.save();
  } catch {
    /* read-only fallback below */
  }

  return {
    scheduledMaintenance: control.scheduledMaintenance || { enabled: false },
    ipBlocklist: control.ipBlocklist || [],
    emailBlocklist: control.emailBlocklist || [],
    killSwitches: control.killSwitches?.length
      ? control.killSwitches
      : [
          { key: "live_classes", label: "Kill live classes", enabled: false },
          { key: "new_enrollments", label: "Kill new enrollments", enabled: false },
          { key: "community", label: "Kill community", enabled: false },
          { key: "payments", label: "Kill payments", enabled: false },
        ],
    featureFlags: control.featureFlags?.length
      ? control.featureFlags
      : (
          await import("../models/platform-control.model.js")
        ).DEFAULT_FEATURE_FLAGS,
    experiments: control.experiments || [],
    staffChangelog: control.staffChangelog || [],
    reportPresets: control.reportPresets?.length
      ? control.reportPresets
      : DEFAULT_REPORT_PRESETS,
    webhooks: control.webhooks || [],
    maintenanceMode: control.maintenanceMode,
    bannerEnabled: control.bannerEnabled,
    bannerMessage: control.bannerMessage,
    bannerTone: control.bannerTone,
  };
}

export async function getSupportHub() {
  const now = new Date();
  const [tickets, openCount, slaBreachedCount] = await Promise.all([
    SupportTicket.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("user", "name email role")
      .populate("assignedTo", "name email")
      .lean(),
    SupportTicket.countDocuments({
      status: { $in: ["open", "in_progress"] },
    }),
    SupportTicket.countDocuments({
      status: { $in: ["open", "in_progress"] },
      slaDueAt: { $lt: now },
    }),
  ]);

  return { tickets, openCount, slaBreachedCount };
}

export async function getTreasuryQueues() {
  const today = startOfDay();
  const [pendingSalaries, overdueFees, recentExpenses] = await Promise.all([
    Salary.find({ status: "pending" })
      .sort({ year: 1, month: 1 })
      .limit(50)
      .populate("employee", "name email role")
      .lean(),
    Fee.find({
      $or: [
        { status: "overdue" },
        { status: "pending", dueDate: { $lt: today } },
      ],
    })
      .sort({ dueDate: 1 })
      .limit(50)
      .populate("student", "name email")
      .lean(),
    Expense.find({}).sort({ date: -1 }).limit(40).lean(),
  ]);

  return { pendingSalaries, overdueFees, recentExpenses };
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                   */
/* -------------------------------------------------------------------------- */

export async function exportPeopleCsv(filters: {
  q?: string;
  role?: string;
  status?: string;
}) {
  const filter: Record<string, unknown> = {};
  if (filters.role) filter.role = filters.role;
  if (filters.status === "active") filter.isActive = true;
  if (filters.status === "inactive") filter.isActive = false;
  if (filters.q?.trim()) {
    const rx = new RegExp(filters.q.trim(), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const users = await User.find(filter)
    .select("name email role isActive phone lastLoginAt createdAt emailVerified")
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();

  const header = [
    "name",
    "email",
    "role",
    "isActive",
    "phone",
    "lastLoginAt",
    "createdAt",
    "emailVerified",
  ];
  const lines = [
    header.join(","),
    ...users.map((u) =>
      [
        escapeCsv(u.name),
        escapeCsv(u.email),
        escapeCsv(u.role),
        escapeCsv(u.isActive),
        escapeCsv(u.phone),
        escapeCsv(u.lastLoginAt?.toISOString?.() || u.lastLoginAt),
        escapeCsv(u.createdAt?.toISOString?.() || u.createdAt),
        escapeCsv(u.emailVerified),
      ].join(","),
    ),
  ];

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    csv: lines.join("\n"),
    filename: `people-export-${stamp}.csv`,
  };
}

export async function bulkSetActive(
  userIds: string[],
  isActive: boolean,
  ctx: ActorCtx,
) {
  if (!userIds?.length) throw badRequest("userIds required");
  const ids = userIds.filter((id) => id !== ctx.actorId);

  const result = await User.updateMany(
    {
      _id: { $in: ids },
      role: { $ne: "super_admin" },
    },
    { $set: { isActive } },
  );

  await logActivity({
    userId: ctx.actorId,
    action: isActive ? "Bulk activated users" : "Bulk deactivated users",
    details: `${result.modifiedCount} users`,
    resourceType: "user",
    isAudit: true,
    req: ctx.req,
  });

  return { matched: result.matchedCount, modified: result.modifiedCount };
}

export async function bulkSetRole(
  userIds: string[],
  role: userRoles,
  ctx: ActorCtx,
) {
  if (!userIds?.length) throw badRequest("userIds required");
  if (role === "super_admin") {
    throw badRequest("Bulk role change to super_admin is not allowed");
  }

  const targets = await User.find({ _id: { $in: userIds } }).select("role");
  if (targets.some((t) => t.role === "super_admin")) {
    throw badRequest("Cannot bulk-change role of a super_admin");
  }

  const result = await User.updateMany(
    {
      _id: { $in: userIds },
      role: { $ne: "super_admin" },
    },
    { $set: { role } },
  );

  await logActivity({
    userId: ctx.actorId,
    action: "Bulk set user roles",
    details: `${result.modifiedCount} users → ${role}`,
    resourceType: "user",
    isAudit: true,
    req: ctx.req,
  });

  return { matched: result.matchedCount, modified: result.modifiedCount };
}

export async function forcePasswordReset(userId: string, ctx: ActorCtx) {
  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");
  if (user.role === "super_admin" && String(user._id) !== ctx.actorId) {
    throw badRequest("Cannot force password reset for another super-admin");
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  await logActivity({
    userId: ctx.actorId,
    action: "Forced password reset",
    details: user.email,
    resourceType: "user",
    resourceId: String(user._id),
    isAudit: true,
    req: ctx.req,
  });

  return { resetToken, userId: String(user._id), email: user.email };
}

export async function softDeleteUser(userId: string, ctx: ActorCtx) {
  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");
  if (user.role === "super_admin") {
    throw badRequest("Cannot soft-delete a super-admin");
  }
  if (String(user._id) === ctx.actorId) {
    throw badRequest("Cannot soft-delete yourself");
  }

  user.isActive = false;
  user.deletedAt = new Date();
  user.sessionsRevokedAt = new Date();
  await user.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Soft-deleted user",
    details: user.email,
    resourceType: "user",
    resourceId: String(user._id),
    isAudit: true,
    req: ctx.req,
  });

  return user;
}

export async function restoreUser(userId: string, ctx: ActorCtx) {
  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");

  user.deletedAt = null;
  user.isActive = true;
  await user.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Restored soft-deleted user",
    details: user.email,
    resourceType: "user",
    resourceId: String(user._id),
    isAudit: true,
    req: ctx.req,
  });

  return user;
}

export async function unlockUser(userId: string, ctx: ActorCtx) {
  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");

  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  await user.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Unlocked user account",
    details: user.email,
    resourceType: "user",
    resourceId: String(user._id),
    isAudit: true,
    req: ctx.req,
  });

  return user;
}

export async function overridePhotoLock(userId: string, ctx: ActorCtx) {
  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");

  user.avatarUpdatedAt = undefined;
  user.coverImageUpdatedAt = undefined;
  await user.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Override photo lock",
    details: user.email,
    resourceType: "user",
    resourceId: String(user._id),
    isAudit: true,
    req: ctx.req,
  });

  return user;
}

export async function revokeSessions(userId: string, ctx: ActorCtx) {
  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");

  user.sessionsRevokedAt = new Date();
  await user.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Revoked all user sessions",
    details: user.email,
    resourceType: "user",
    resourceId: String(user._id),
    isAudit: true,
    req: ctx.req,
  });

  return user;
}

export async function revokeCertificate(id: string, ctx: ActorCtx) {
  const cert = await Certificate.findById(id);
  if (!cert) throw notFound("Certificate not found");

  cert.status = "revoked";
  cert.revokedAt = new Date();
  await cert.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Revoked certificate",
    details: cert.certificateNumber,
    resourceType: "certificate",
    resourceId: String(cert._id),
    isAudit: true,
    req: ctx.req,
  });

  return cert;
}

export async function softDeleteCommunityMessage(id: string, ctx: ActorCtx) {
  const msg = await CommunityMessage.findById(id);
  if (!msg) throw notFound("Message not found");

  msg.deletedAt = new Date();
  await msg.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Soft-deleted community message",
    details: String(msg._id),
    resourceType: "community_message",
    resourceId: String(msg._id),
    isAudit: true,
    req: ctx.req,
  });

  return msg;
}

export async function purgeFailedRecordings(ctx: ActorCtx) {
  const result = await Recording.deleteMany({ processingStatus: "failed" });

  await logActivity({
    userId: ctx.actorId,
    action: "Purged failed recordings",
    details: `${result.deletedCount} deleted`,
    resourceType: "recording",
    isAudit: true,
    req: ctx.req,
  });

  return { deleted: result.deletedCount };
}

export async function forceEndAllRooms(ctx: ActorCtx) {
  const result = await VideoRoom.updateMany(
    { status: { $in: ["active", "waiting"] } },
    { $set: { status: "ended" } },
  );

  await LiveClass.updateMany(
    { status: "live" },
    { $set: { status: "ended" } },
  );

  await logActivity({
    userId: ctx.actorId,
    action: "Force-ended all live rooms",
    details: `${result.modifiedCount} rooms ended`,
    resourceType: "video_room",
    isAudit: true,
    req: ctx.req,
  });

  return { ended: result.modifiedCount };
}

export async function updateFeeStatus(
  feeId: string,
  status: "paid" | "pending" | "overdue",
  ctx: ActorCtx,
) {
  const fee = await Fee.findById(feeId);
  if (!fee) throw notFound("Fee not found");

  fee.status = status;
  if (status === "paid") fee.paymentDate = new Date();
  await fee.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Updated fee status",
    details: `${feeId} → ${status}`,
    resourceType: "fee",
    resourceId: feeId,
    isAudit: true,
    req: ctx.req,
  });

  return fee;
}

export async function updateSalaryStatus(
  salaryId: string,
  status: "paid" | "pending",
  ctx: ActorCtx,
) {
  const salary = await Salary.findById(salaryId);
  if (!salary) throw notFound("Salary not found");

  salary.status = status;
  if (status === "paid") salary.paymentDate = new Date();
  await salary.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Updated salary status",
    details: `${salaryId} → ${status}`,
    resourceType: "salary",
    resourceId: salaryId,
    isAudit: true,
    req: ctx.req,
  });

  return salary;
}

export async function reassignMentee(
  assignmentId: string,
  newMentorId: string,
  ctx: ActorCtx,
) {
  const assignment = await MentorAssignment.findById(assignmentId);
  if (!assignment) throw notFound("Mentor assignment not found");

  const mentor = await User.findById(newMentorId);
  if (!mentor || mentor.role !== "mentor") {
    throw badRequest("newMentorId must be a mentor user");
  }

  const previousMentor = String(assignment.mentor);
  assignment.mentor = mentor._id as mongoose.Types.ObjectId;
  await assignment.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Reassigned mentorship assignment",
    details: `${previousMentor} → ${newMentorId}`,
    resourceType: "mentor_assignment",
    resourceId: assignmentId,
    isAudit: true,
    req: ctx.req,
  });

  return assignment;
}

export async function blastNotification(
  input: {
    title: string;
    message: string;
    roles?: string[];
    userIds?: string[];
  },
  ctx: ActorCtx,
) {
  const filter: Record<string, unknown> = { isActive: true };
  if (input.userIds?.length) {
    filter._id = { $in: input.userIds };
  } else if (input.roles?.length) {
    filter.role = { $in: input.roles };
  }

  const users = await User.find(filter).select("_id").lean();
  if (!users.length) throw badRequest("No matching recipients");

  const docs = users.map((u) => ({
    user: u._id,
    type: "announcement" as const,
    title: input.title,
    message: input.message,
    metadata: { blast: true, actorId: ctx.actorId },
  }));

  await Notification.insertMany(docs, { ordered: false });

  await logActivity({
    userId: ctx.actorId,
    action: "Sent notification blast",
    details: `${docs.length} recipients — ${input.title}`,
    resourceType: "notification",
    isAudit: true,
    req: ctx.req,
  });

  return { sent: docs.length };
}

export async function emergencyBroadcast(
  input: { message: string },
  ctx: ActorCtx,
) {
  const users = await User.find({ isActive: true }).select("_id").lean();
  const title = "Emergency broadcast";
  const docs = users.map((u) => ({
    user: u._id,
    type: "announcement" as const,
    title,
    message: input.message,
    metadata: { emergency: true, actorId: ctx.actorId },
  }));

  if (docs.length) {
    await Notification.insertMany(docs, { ordered: false });
  }

  const control = await getOrCreatePlatformControl();
  control.bannerEnabled = true;
  control.bannerMessage = input.message;
  control.bannerTone = "critical";
  control.updatedBy = new mongoose.Types.ObjectId(ctx.actorId);
  await control.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Emergency broadcast",
    details: `${docs.length} users notified`,
    resourceType: "platform_control",
    resourceId: String(control._id),
    isAudit: true,
    req: ctx.req,
  });

  return { sent: docs.length, bannerEnabled: true };
}

export async function updateAdvancedOrg(
  partial: {
    scheduledMaintenance?: Partial<IScheduledMaintenance>;
    ipBlocklist?: string[];
    emailBlocklist?: string[];
    killSwitches?: IKillSwitch[];
    experiments?: IExperiment[];
    staffChangelog?: IStaffChangelogEntry[];
    reportPresets?: IReportPreset[];
    webhooks?: IWebhook[];
    featureFlags?: IFeatureFlag[];
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
    bannerEnabled?: boolean;
    bannerMessage?: string;
    bannerTone?: "info" | "warning" | "critical";
  },
  ctx: ActorCtx,
) {
  const control = await getOrCreatePlatformControl();

  if (partial.scheduledMaintenance) {
    control.scheduledMaintenance = {
      enabled: partial.scheduledMaintenance.enabled ?? false,
      startsAt: partial.scheduledMaintenance.startsAt ?? null,
      endsAt: partial.scheduledMaintenance.endsAt ?? null,
      message: partial.scheduledMaintenance.message ?? "",
    };
  }
  if (Array.isArray(partial.ipBlocklist)) {
    control.ipBlocklist = partial.ipBlocklist;
  }
  if (Array.isArray(partial.emailBlocklist)) {
    control.emailBlocklist = partial.emailBlocklist;
  }
  if (Array.isArray(partial.killSwitches)) {
    control.killSwitches = partial.killSwitches;
  }
  if (Array.isArray(partial.experiments)) {
    control.experiments = partial.experiments;
  }
  if (Array.isArray(partial.staffChangelog)) {
    control.staffChangelog = partial.staffChangelog;
  }
  if (Array.isArray(partial.reportPresets)) {
    control.reportPresets = partial.reportPresets;
  }
  if (Array.isArray(partial.webhooks)) {
    control.webhooks = partial.webhooks;
  }
  if (Array.isArray(partial.featureFlags)) {
    control.featureFlags = partial.featureFlags;
  }
  if (typeof partial.maintenanceMode === "boolean") {
    control.maintenanceMode = partial.maintenanceMode;
  }
  if (typeof partial.maintenanceMessage === "string") {
    control.maintenanceMessage = partial.maintenanceMessage;
  }
  if (typeof partial.bannerEnabled === "boolean") {
    control.bannerEnabled = partial.bannerEnabled;
  }
  if (typeof partial.bannerMessage === "string") {
    control.bannerMessage = partial.bannerMessage;
  }
  if (partial.bannerTone) control.bannerTone = partial.bannerTone;

  control.updatedBy = new mongoose.Types.ObjectId(ctx.actorId);
  await control.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Updated advanced platform controls",
    details: "system hub update",
    resourceType: "platform_control",
    resourceId: String(control._id),
    isAudit: true,
    req: ctx.req,
  });

  return control;
}

export async function createSupportTicket(
  input: {
    subject: string;
    body: string;
    priority?: SupportTicketPriority;
    requesterName?: string;
    requesterEmail?: string;
    user?: string;
    assignedTo?: string;
    slaDueAt?: Date | string;
  },
  ctx: ActorCtx,
) {
  const ticket = await SupportTicket.create({
    subject: input.subject,
    body: input.body,
    priority: input.priority || "medium",
    requesterName: input.requesterName,
    requesterEmail: input.requesterEmail,
    user: input.user || null,
    assignedTo: input.assignedTo || null,
    slaDueAt: input.slaDueAt ? new Date(input.slaDueAt) : null,
    status: "open",
  });

  await logActivity({
    userId: ctx.actorId,
    action: "Created support ticket",
    details: ticket.subject,
    resourceType: "support_ticket",
    resourceId: String(ticket._id),
    req: ctx.req,
  });

  return ticket;
}

export async function updateSupportTicket(
  id: string,
  input: {
    subject?: string;
    body?: string;
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    assignedTo?: string | null;
    slaDueAt?: Date | string | null;
  },
  ctx: ActorCtx,
) {
  const ticket = await SupportTicket.findById(id);
  if (!ticket) throw notFound("Support ticket not found");

  if (input.subject != null) ticket.subject = input.subject;
  if (input.body != null) ticket.body = input.body;
  if (input.status) ticket.status = input.status;
  if (input.priority) ticket.priority = input.priority;
  if (input.assignedTo !== undefined) {
    ticket.assignedTo = input.assignedTo
      ? (new mongoose.Types.ObjectId(input.assignedTo) as never)
      : null;
  }
  if (input.slaDueAt !== undefined) {
    ticket.slaDueAt = input.slaDueAt ? new Date(input.slaDueAt) : null;
  }
  await ticket.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Updated support ticket",
    details: `${ticket.subject} (${ticket.status})`,
    resourceType: "support_ticket",
    resourceId: String(ticket._id),
    req: ctx.req,
  });

  return ticket;
}

export async function runReportPreset(key: string) {
  const today = startOfDay();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  switch (key) {
    case "census": {
      const [students, tutors, mentors, admins, superAdmins, active] =
        await Promise.all([
          User.countDocuments({ role: "student", isActive: true }),
          User.countDocuments({ role: "tutor", isActive: true }),
          User.countDocuments({ role: "mentor", isActive: true }),
          User.countDocuments({ role: "admin", isActive: true }),
          User.countDocuments({ role: "super_admin", isActive: true }),
          User.countDocuments({ isActive: true }),
        ]);
      return {
        key,
        generatedAt: new Date().toISOString(),
        data: { students, tutors, mentors, admins, superAdmins, active },
      };
    }
    case "finance_mtd": {
      const [feesPaid, feesPending, salariesPaid, salariesPending, expenses] =
        await Promise.all([
          Fee.aggregate([
            { $match: { status: "paid", paymentDate: { $gte: monthStart } } },
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ]),
          Fee.aggregate([
            { $match: { status: "pending" } },
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ]),
          Salary.aggregate([
            { $match: { status: "paid", paymentDate: { $gte: monthStart } } },
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ]),
          Salary.aggregate([
            { $match: { status: "pending" } },
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ]),
          Expense.aggregate([
            { $match: { date: { $gte: monthStart } } },
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ]),
        ]);
      return {
        key,
        generatedAt: new Date().toISOString(),
        data: {
          feesPaid: feesPaid[0] || { total: 0, count: 0 },
          feesPending: feesPending[0] || { total: 0, count: 0 },
          salariesPaid: salariesPaid[0] || { total: 0, count: 0 },
          salariesPending: salariesPending[0] || { total: 0, count: 0 },
          expenses: expenses[0] || { total: 0, count: 0 },
        },
      };
    }
    case "live_now": {
      const [rooms, classes] = await Promise.all([
        VideoRoom.find({ status: { $in: ["active", "waiting"] } })
          .limit(50)
          .lean(),
        LiveClass.find({ status: "live" })
          .populate("tutor", "name email")
          .populate("category", "name")
          .limit(50)
          .lean(),
      ]);
      return {
        key,
        generatedAt: new Date().toISOString(),
        data: { rooms, classes },
      };
    }
    case "risk_board": {
      const [locked, overdueFees, failedRecordings, churn] = await Promise.all([
        User.countDocuments({
          $or: [{ lockedUntil: { $gt: new Date() } }, { isActive: false }],
        }),
        Fee.countDocuments({
          $or: [
            { status: "overdue" },
            { status: "pending", dueDate: { $lt: today } },
          ],
        }),
        Recording.countDocuments({ processingStatus: "failed" }),
        User.countDocuments({
          role: "student",
          isActive: true,
          $or: [{ lastLoginAt: null }, { lastLoginAt: { $lt: daysAgo(21) } }],
        }),
      ]);
      return {
        key,
        generatedAt: new Date().toISOString(),
        data: {
          locked,
          overdueFees,
          failedRecordings,
          churnRiskStudents: churn,
        },
      };
    }
    default:
      throw badRequest(`Unknown report preset: ${key}`);
  }
}

export async function gdprExport(userId: string, ctx: ActorCtx) {
  const user = await User.findById(userId).select("-password").lean();
  if (!user) throw notFound("User not found");

  const [enrollments, fees] = await Promise.all([
    Enrollment.find({ student: userId })
      .populate("category", "name slug")
      .lean(),
    Fee.find({ student: userId }).lean(),
  ]);

  const feeSummary = {
    total: fees.length,
    paid: fees.filter((f) => f.status === "paid").length,
    pending: fees.filter((f) => f.status === "pending").length,
    overdue: fees.filter((f) => f.status === "overdue").length,
    amountPaid: fees
      .filter((f) => f.status === "paid")
      .reduce((s, f) => s + (f.amount || 0), 0),
    amountOutstanding: fees
      .filter((f) => f.status !== "paid")
      .reduce((s, f) => s + (f.amount || 0), 0),
  };

  await logActivity({
    userId: ctx.actorId,
    action: "GDPR data export",
    details: user.email,
    resourceType: "user",
    resourceId: userId,
    isAudit: true,
    req: ctx.req,
  });

  return {
    exportedAt: new Date().toISOString(),
    user,
    enrollments,
    feesSummary: feeSummary,
  };
}

export async function gdprAnonymize(userId: string, ctx: ActorCtx) {
  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");
  if (user.role === "super_admin") {
    throw badRequest("Cannot anonymize a super-admin");
  }

  const suffix = String(user._id).slice(-8);
  user.name = `Anonymized User ${suffix}`;
  user.email = `anonymized-${suffix}@deleted.local`;
  user.phone = undefined;
  user.avatar = undefined;
  user.coverImage = undefined;
  user.bio = undefined;
  user.isActive = false;
  user.deletedAt = new Date();
  user.sessionsRevokedAt = new Date();
  await user.save();

  await logActivity({
    userId: ctx.actorId,
    action: "GDPR anonymized user",
    details: `user ${userId}`,
    resourceType: "user",
    resourceId: userId,
    isAudit: true,
    req: ctx.req,
  });

  return user;
}

export async function activateAcademicYear(id: string, ctx: ActorCtx) {
  const year = await AcademicYear.findById(id);
  if (!year) throw notFound("Academic year not found");

  await AcademicYear.updateMany({}, { $set: { isActive: false } });
  year.isActive = true;
  await year.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Activated academic year",
    details: year.name,
    resourceType: "academic_year",
    resourceId: id,
    isAudit: true,
    req: ctx.req,
  });

  return year;
}

export async function setFeatureRollout(
  key: string,
  percent: number,
  ctx: ActorCtx,
) {
  if (percent < 0 || percent > 100) {
    throw badRequest("percent must be between 0 and 100");
  }

  const control = await getOrCreatePlatformControl();
  const flag = control.featureFlags.find((f) => f.key === key);
  if (!flag) throw notFound(`Feature flag not found: ${key}`);

  flag.rolloutPercent = percent;
  control.updatedBy = new mongoose.Types.ObjectId(ctx.actorId);
  await control.save();

  await logActivity({
    userId: ctx.actorId,
    action: "Set feature flag rollout",
    details: `${key} → ${percent}%`,
    resourceType: "platform_control",
    resourceId: String(control._id),
    isAudit: true,
    req: ctx.req,
  });

  return flag;
}
