import OfficialMessageThread from "../models/official-message-thread.model.js";
import ModerationAction from "../models/moderation-action.model.js";
import User from "../models/user.model.js";
import { createNotification } from "./notification.service.js";
import { sendToUser } from "../sockets/socket.server.js";
import {
  badRequest,
  forbidden,
  notFound,
} from "../middleware/error.middleware.js";

const serializeThread = (thread: any) => {
  const plain = thread.toObject ? thread.toObject() : thread;
  return {
    _id: String(plain._id),
    targetUser: String(plain.targetUser?._id || plain.targetUser),
    actor: String(plain.actor?._id || plain.actor),
    moderationAction: plain.moderationAction
      ? String(plain.moderationAction)
      : null,
    subject: plain.subject,
    status: plain.status,
    lastMessageAt: plain.lastMessageAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    messages: (plain.messages || []).map((m: any) => ({
      _id: String(m._id),
      sender: String(m.sender?._id || m.sender),
      senderRole: m.senderRole,
      senderName: m.senderName,
      body: m.body,
      createdAt: m.createdAt,
    })),
    targetUserInfo: plain.targetUser?._id
      ? {
          _id: String(plain.targetUser._id),
          name: plain.targetUser.name,
          email: plain.targetUser.email,
          avatar: plain.targetUser.avatar,
          role: plain.targetUser.role,
        }
      : undefined,
    actorInfo: plain.actor?._id
      ? {
          _id: String(plain.actor._id),
          name: plain.actor.name,
          email: plain.actor.email,
          avatar: plain.actor.avatar,
          role: plain.actor.role,
        }
      : undefined,
  };
};

const assertParticipant = (
  thread: { targetUser: any; actor: any },
  userId: string,
  role?: string,
) => {
  const isTarget =
    String(thread.targetUser?._id || thread.targetUser) === userId;
  const isActor = String(thread.actor?._id || thread.actor) === userId;
  const isSuper = role === "super_admin";
  if (!isTarget && !isActor && !isSuper) {
    throw forbidden("You do not have access to this conversation");
  }
};

export async function createOfficialThread(input: {
  targetUserId: string;
  actorId: string;
  subject: string;
  body: string;
  moderationActionId?: string;
}) {
  const actor = await User.findById(input.actorId).select("name role");
  if (!actor) throw notFound("Sender not found");

  const thread = await OfficialMessageThread.create({
    targetUser: input.targetUserId,
    actor: input.actorId,
    moderationAction: input.moderationActionId || null,
    subject: input.subject,
    status: "open",
    lastMessageAt: new Date(),
    messages: [
      {
        sender: input.actorId,
        senderRole: actor.role,
        senderName: actor.name || "GYGI Official",
        body: input.body,
        createdAt: new Date(),
      },
    ],
  });

  return thread;
}

export async function getThreadForUser(
  threadId: string,
  userId: string,
  role?: string,
) {
  const thread = await OfficialMessageThread.findById(threadId)
    .populate("targetUser", "name email avatar role")
    .populate("actor", "name email avatar role");
  if (!thread) throw notFound("Conversation not found");
  assertParticipant(thread, userId, role);
  return serializeThread(thread);
}

/** Resolve by threadId, or fall back to moderation actionId (legacy notifications). */
export async function resolveThread(
  opts: { threadId?: string; actionId?: string },
  userId: string,
  role?: string,
) {
  if (opts.threadId) {
    return getThreadForUser(opts.threadId, userId, role);
  }

  if (!opts.actionId) {
    throw badRequest("threadId or actionId is required");
  }

  let thread = await OfficialMessageThread.findOne({
    moderationAction: opts.actionId,
  });

  if (!thread) {
    const action = await ModerationAction.findById(opts.actionId);
    if (!action) throw notFound("Official message not found");
    if (action.type !== "message") {
      throw badRequest("This notification is not an official message thread");
    }

    const actor = await User.findById(action.actor).select("name role");
    thread = await OfficialMessageThread.create({
      targetUser: action.targetUser,
      actor: action.actor,
      moderationAction: action._id,
      subject: action.messageTitle || "Official message",
      status: "open",
      lastMessageAt: action.createdAt || new Date(),
      messages: [
        {
          sender: action.actor,
          senderRole: actor?.role || "super_admin",
          senderName: actor?.name || "GYGI Official",
          body: action.messageBody || action.reason,
          createdAt: action.createdAt || new Date(),
        },
      ],
    });
  }

  assertParticipant(thread, userId, role);

  const populated = await OfficialMessageThread.findById(thread._id)
    .populate("targetUser", "name email avatar role")
    .populate("actor", "name email avatar role");

  return serializeThread(populated);
}

export async function replyToThread(
  threadId: string,
  userId: string,
  body: string,
  role?: string,
) {
  const text = (body || "").trim();
  if (!text) throw badRequest("Message is required");
  if (text.length > 2000) throw badRequest("Message is too long");

  const thread = await OfficialMessageThread.findById(threadId);
  if (!thread) throw notFound("Conversation not found");
  assertParticipant(thread, userId, role);

  if (thread.status === "closed") {
    throw badRequest("This conversation is closed");
  }

  const sender = await User.findById(userId).select("name role");
  if (!sender) throw notFound("User not found");

  const msg = {
    sender: sender._id,
    senderRole: sender.role,
    senderName: sender.name || "User",
    body: text,
    createdAt: new Date(),
  };

  thread.messages.push(msg as any);
  thread.lastMessageAt = new Date();
  await thread.save();

  const isTargetReplying = String(thread.targetUser) === userId;
  const notifyUserId = isTargetReplying
    ? String(thread.actor)
    : String(thread.targetUser);

  const title = isTargetReplying
    ? "Reply to your official message"
    : thread.subject || "Official message from GYGI";

  const notification = await createNotification({
    user: notifyUserId,
    type: "moderation_message",
    title,
    message: text.slice(0, 280),
    link: undefined,
    metadata: {
      threadId: String(thread._id),
      actionId: thread.moderationAction
        ? String(thread.moderationAction)
        : undefined,
      openOfficialChat: true,
    },
  });

  if (notification) {
    sendToUser(notifyUserId, "new-notification", notification);
  }

  const populated = await OfficialMessageThread.findById(thread._id)
    .populate("targetUser", "name email avatar role")
    .populate("actor", "name email avatar role");

  return serializeThread(populated);
}

export async function listMyThreads(userId: string, role?: string) {
  const filter =
    role === "super_admin"
      ? { $or: [{ targetUser: userId }, { actor: userId }] }
      : { targetUser: userId };

  const threads = await OfficialMessageThread.find(filter)
    .sort({ lastMessageAt: -1 })
    .limit(40)
    .populate("targetUser", "name email avatar role")
    .populate("actor", "name email avatar role")
    .lean();

  return threads.map((t) => serializeThread(t));
}
