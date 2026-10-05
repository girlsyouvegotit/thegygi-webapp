import type { Request } from "express";
import User from "../models/user.model.js";
import ModerationAction, {
  type ModerationSeverity,
} from "../models/moderation-action.model.js";
import { logActivity } from "./activity.service.js";
import { createNotification } from "./notification.service.js";
import { createOfficialThread } from "./official-message.service.js";
import { sendToUser } from "../sockets/socket.server.js";
import {
  badRequest,
  notFound,
  unauthorized,
} from "../middleware/error.middleware.js";
import type { NotificationType } from "../models/notification.model.js";

type ActorCtx = { actorId: string; req?: Request };

const assertNotSuperTarget = (role?: string) => {
  if (role === "super_admin") {
    throw badRequest("Cannot apply enforcement actions to a super-admin");
  }
};

const durationToDate = (duration?: string): Date | null => {
  if (!duration || duration === "indefinite") return null;
  const map: Record<string, number> = {
    "1d": 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };
  const days = map[duration];
  if (!days) {
    const custom = Number(duration);
    if (!Number.isFinite(custom) || custom <= 0) {
      throw badRequest("Invalid duration");
    }
    const d = new Date();
    d.setDate(d.getDate() + custom);
    return d;
  }
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

async function notify(
  userId: string,
  type:
    | "moderation_warning"
    | "moderation_message"
    | "account_suspended"
    | "account_banned"
    | "announcement",
  title: string,
  message: string,
  metadata?: Record<string, unknown>,
  link?: string | null,
) {
  const openChat = Boolean(
    metadata?.openOfficialChat || metadata?.threadId,
  );
  const notification = await createNotification({
    user: userId,
    type: type as NotificationType,
    title,
    message,
    link: openChat ? undefined : link === null ? undefined : link || "/profile",
    metadata: metadata || undefined,
  });
  if (notification) {
    sendToUser(userId, "new-notification", notification);
  }
  return notification;
}

export async function getModerationOverview() {
  const [
    warned,
    suspended,
    banned,
    muted,
    recentActions,
    strikeLeaders,
    openStrikes,
  ] = await Promise.all([
    User.countDocuments({ moderationStatus: "warned", isActive: true }),
    User.countDocuments({ moderationStatus: "suspended" }),
    User.countDocuments({ moderationStatus: "banned" }),
    User.countDocuments({
      moderationStatus: "muted",
      mutedUntil: { $gt: new Date() },
    }),
    ModerationAction.find({})
      .sort({ createdAt: -1 })
      .limit(25)
      .populate("targetUser", "name email avatar role moderationStatus")
      .populate("actor", "name email avatar role")
      .lean(),
    User.find({ strikeCount: { $gt: 0 } })
      .select("name email avatar role strikeCount moderationStatus")
      .sort({ strikeCount: -1 })
      .limit(12)
      .lean(),
    ModerationAction.countDocuments({
      type: "warning",
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  return {
    stats: { warned, suspended, banned, muted, warnings30d: openStrikes },
    recentActions,
    strikeLeaders,
  };
}

export async function getEnforcementHistory(userId: string) {
  const user = await User.findById(userId)
    .select(
      "name email role avatar moderationStatus strikeCount bannedAt banReason suspendUntil suspendReason mutedUntil isActive",
    )
    .lean();
  if (!user) throw notFound("User not found");

  const actions = await ModerationAction.find({ targetUser: userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("actor", "name email avatar role")
    .lean();

  return { user, actions };
}

export async function sendOfficialMessage(
  userId: string,
  body: { title: string; message: string; reason?: string; internalNote?: string },
  ctx: ActorCtx,
) {
  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");
  assertNotSuperTarget(user.role);

  const action = await ModerationAction.create({
    targetUser: userId,
    actor: ctx.actorId,
    type: "message",
    severity: "notice",
    reason: body.reason || "Official message",
    internalNote: body.internalNote || "",
    messageTitle: body.title,
    messageBody: body.message,
    strikeDelta: 0,
  });

  const thread = await createOfficialThread({
    targetUserId: userId,
    actorId: ctx.actorId,
    subject: body.title,
    body: body.message,
    moderationActionId: String(action._id),
  });

  await notify(
    userId,
    "moderation_message",
    body.title,
    body.message,
    {
      actionId: String(action._id),
      threadId: String(thread._id),
      openOfficialChat: true,
    },
    null,
  );

  await logActivity({
    userId: ctx.actorId,
    action: "Official message sent",
    details: `${user.email}: ${body.title}`,
    resourceType: "user",
    resourceId: userId,
    isAudit: true,
    req: ctx.req,
  });

  return { action, threadId: String(thread._id) };
}

export async function warnUser(
  userId: string,
  body: {
    reason: string;
    severity?: ModerationSeverity;
    messageTitle?: string;
    messageBody?: string;
    internalNote?: string;
  },
  ctx: ActorCtx,
) {
  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");
  assertNotSuperTarget(user.role);

  const severity = body.severity || "warning";
  const strikeDelta = severity === "notice" ? 0 : 1;
  user.strikeCount = (user.strikeCount || 0) + strikeDelta;
  if (user.moderationStatus === "clear" || !user.moderationStatus) {
    user.moderationStatus = "warned";
  }
  await user.save();

  const title = body.messageTitle || "Official warning from GYGI";
  const message =
    body.messageBody ||
    `You have received a ${severity.replace("_", " ")}. Reason: ${body.reason}`;

  const action = await ModerationAction.create({
    targetUser: userId,
    actor: ctx.actorId,
    type: "warning",
    severity,
    reason: body.reason,
    internalNote: body.internalNote || "",
    messageTitle: title,
    messageBody: message,
    strikeDelta,
  });

  await notify(userId, "moderation_warning", title, message, {
    actionId: String(action._id),
    severity,
    strikes: user.strikeCount,
  });

  await logActivity({
    userId: ctx.actorId,
    action: "User warned",
    details: `${user.email} · ${severity} · ${body.reason}`,
    resourceType: "user",
    resourceId: userId,
    isAudit: true,
    req: ctx.req,
  });

  return { action, user };
}

export async function suspendUserModeration(
  userId: string,
  body: {
    reason: string;
    duration?: string;
    internalNote?: string;
  },
  ctx: ActorCtx,
) {
  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");
  assertNotSuperTarget(user.role);

  const endsAt = durationToDate(body.duration);
  user.isActive = false;
  user.moderationStatus = "suspended";
  user.suspendUntil = endsAt;
  user.suspendReason = body.reason;
  user.sessionsRevokedAt = new Date();
  await user.save();

  const untilLabel = endsAt
    ? endsAt.toLocaleString()
    : "further notice";
  const title = "Account suspended";
  const message = `Your GYGI account has been suspended until ${untilLabel}. Reason: ${body.reason}`;

  const action = await ModerationAction.create({
    targetUser: userId,
    actor: ctx.actorId,
    type: "suspend",
    severity: "critical",
    reason: body.reason,
    internalNote: body.internalNote || "",
    messageTitle: title,
    messageBody: message,
    endsAt,
    strikeDelta: 0,
  });

  await notify(userId, "account_suspended", title, message, {
    actionId: String(action._id),
    until: endsAt,
  });

  await logActivity({
    userId: ctx.actorId,
    action: "User suspended",
    details: `${user.email} · until ${untilLabel} · ${body.reason}`,
    resourceType: "user",
    resourceId: userId,
    isAudit: true,
    req: ctx.req,
  });

  return { action, user };
}

export async function unsuspendUser(userId: string, body: { reason?: string; internalNote?: string }, ctx: ActorCtx) {
  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");
  if (user.moderationStatus === "banned") {
    throw badRequest("User is banned — use unban instead");
  }

  user.isActive = true;
  user.suspendUntil = null;
  user.suspendReason = null;
  user.moderationStatus =
    (user.strikeCount || 0) > 0 ? "warned" : "clear";
  await user.save();

  const action = await ModerationAction.create({
    targetUser: userId,
    actor: ctx.actorId,
    type: "unsuspend",
    severity: "notice",
    reason: body.reason || "Suspension lifted",
    internalNote: body.internalNote || "",
    status: "lifted",
  });

  await ModerationAction.updateMany(
    { targetUser: userId, type: "suspend", status: "active" },
    { $set: { status: "lifted" } },
  );

  await notify(
    userId,
    "moderation_message",
    "Suspension lifted",
    "Your GYGI account access has been restored.",
  );

  await logActivity({
    userId: ctx.actorId,
    action: "User unsuspended",
    details: user.email,
    resourceType: "user",
    resourceId: userId,
    isAudit: true,
    req: ctx.req,
  });

  return { action, user };
}

export async function banUser(
  userId: string,
  body: { reason: string; internalNote?: string },
  ctx: ActorCtx,
) {
  const actor = await User.findById(ctx.actorId).select("role capabilities");
  if (!actor || actor.role !== "super_admin") {
    throw unauthorized("Only super-admins can ban users");
  }

  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");
  assertNotSuperTarget(user.role);

  user.isActive = false;
  user.moderationStatus = "banned";
  user.bannedAt = new Date();
  user.banReason = body.reason;
  user.suspendUntil = null;
  user.sessionsRevokedAt = new Date();
  await user.save();

  const title = "Account banned";
  const message = `Your GYGI account has been permanently banned. Reason: ${body.reason}`;

  const action = await ModerationAction.create({
    targetUser: userId,
    actor: ctx.actorId,
    type: "ban",
    severity: "critical",
    reason: body.reason,
    internalNote: body.internalNote || "",
    messageTitle: title,
    messageBody: message,
  });

  await notify(userId, "account_banned", title, message, {
    actionId: String(action._id),
  });

  await logActivity({
    userId: ctx.actorId,
    action: "User banned",
    details: `${user.email} · ${body.reason}`,
    resourceType: "user",
    resourceId: userId,
    isAudit: true,
    req: ctx.req,
  });

  return { action, user };
}

export async function unbanUser(
  userId: string,
  body: { reason: string; internalNote?: string },
  ctx: ActorCtx,
) {
  const actor = await User.findById(ctx.actorId).select("role");
  if (!actor || actor.role !== "super_admin") {
    throw unauthorized("Only super-admins can unban users");
  }

  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");

  user.isActive = true;
  user.moderationStatus =
    (user.strikeCount || 0) > 0 ? "warned" : "clear";
  user.bannedAt = null;
  user.banReason = null;
  await user.save();

  const action = await ModerationAction.create({
    targetUser: userId,
    actor: ctx.actorId,
    type: "unban",
    severity: "notice",
    reason: body.reason,
    internalNote: body.internalNote || "",
    status: "lifted",
  });

  await ModerationAction.updateMany(
    { targetUser: userId, type: "ban", status: "active" },
    { $set: { status: "lifted" } },
  );

  await notify(
    userId,
    "moderation_message",
    "Ban lifted",
    "Your GYGI account ban has been lifted. You may sign in again.",
  );

  await logActivity({
    userId: ctx.actorId,
    action: "User unbanned",
    details: `${user.email} · ${body.reason}`,
    resourceType: "user",
    resourceId: userId,
    isAudit: true,
    req: ctx.req,
  });

  return { action, user };
}

export async function searchModerationTargets(q: string) {
  const filter: Record<string, unknown> = {
    role: { $ne: "super_admin" },
  };
  if (q.trim()) {
    const rx = new RegExp(q.trim(), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }
  return User.find(filter)
    .select(
      "name email avatar role isActive moderationStatus strikeCount suspendUntil bannedAt",
    )
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();
}
